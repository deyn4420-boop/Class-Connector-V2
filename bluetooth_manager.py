"""
bluetooth_manager.py
Handles classroom discovery via:
  - BLE (bleak/bless) — primary method
  - UDP broadcast — automatic fallback if BLE unavailable
"""

import socket
import threading
import asyncio
import time
import logging

log = logging.getLogger(__name__)

UDP_PORT      = 55432
SERVICE_UUID  = "A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
CHAR_IP_UUID  = "B1B2C3D4-E5F6-7890-ABCD-EF1234567891"
LOST_TIMEOUT  = 12   # seconds before "teacher left" fires
SCAN_INTERVAL = 4    # seconds between scans


# ─────────────────────────────────────────────────────────────
#  TEACHER SIDE — broadcast classroom presence
# ─────────────────────────────────────────────────────────────

class ClassroomBroadcaster:
    """
    Runs on teacher's machine.
    Advertises server IP via BLE (bless). Falls back to UDP if BLE fails.
    """

    def __init__(self, server_ip: str, server_port: int, class_name: str = "ClassConnect"):
        self.server_ip   = server_ip
        self.server_port = server_port
        self.class_name  = class_name
        self.running     = False
        self.method      = "starting"
        self._thread     = None
        self._ble_loop   = None

    def start(self):
        self.running = True
        self._thread = threading.Thread(target=self._run, daemon=True, name="BT-Broadcaster")
        self._thread.start()

    def stop(self):
        self.running = False
        if self._ble_loop and self._ble_loop.is_running():
            self._ble_loop.call_soon_threadsafe(self._ble_loop.stop)

    def _payload(self) -> str:
        return f"{self.server_ip}:{self.server_port}"

    def _run(self):
        try:
            from bless import BlessServer, GATTCharacteristicProperties, GATTAttributePermissions
            self._run_ble()
        except Exception as e:
            log.warning(f"BLE advertiser unavailable ({e}), using UDP fallback")
            self._run_udp()

    # ── BLE path ──────────────────────────────────────────────
    def _run_ble(self):
        self._ble_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._ble_loop)
        self._ble_loop.run_until_complete(self._ble_serve())

    async def _ble_serve(self):
        from bless import (BlessServer, GATTCharacteristicProperties,
                           GATTAttributePermissions)

        trigger = asyncio.Event()

        def read_req(char, **kw):
            return bytearray(self._payload().encode())

        server = BlessServer(name=f"CC-{self.class_name[:12]}", loop=self._ble_loop)
        server.read_request_func = read_req

        await server.add_new_service(SERVICE_UUID)
        flags = GATTCharacteristicProperties.read | GATTCharacteristicProperties.notify
        perms = GATTAttributePermissions.readable
        await server.add_new_characteristic(SERVICE_UUID, CHAR_IP_UUID,
                                            flags, bytearray(self._payload().encode()), perms)
        await server.start()
        self.method = "BLE"
        log.info(f"BLE advertising as CC-{self.class_name[:12]}")

        while self.running:
            await asyncio.sleep(0.5)

        await server.stop()

    # ── UDP fallback ───────────────────────────────────────────
    def _run_udp(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.settimeout(1)
        self.method = "UDP"
        log.info("UDP broadcast started")

        while self.running:
            try:
                msg = f"CLASSCONNECT:{self._payload()}".encode()
                sock.sendto(msg, ("255.255.255.255", UDP_PORT))
            except Exception:
                pass
            # Interruptible sleep
            for _ in range(20):
                if not self.running:
                    break
                time.sleep(0.1)

        sock.close()
        log.info("UDP broadcast stopped")


# ─────────────────────────────────────────────────────────────
#  STUDENT SIDE — scan for classroom
# ─────────────────────────────────────────────────────────────

class ClassroomScanner:
    """
    Runs on student's machine.
    Scans for teacher's BLE advertisement (or UDP) and monitors proximity.
    Calls on_found(ip, port) when classroom appears.
    Calls on_lost()           when classroom disappears (teacher left).
    """

    def __init__(self, on_found, on_lost):
        self.on_found       = on_found
        self.on_lost        = on_lost
        self.running        = False
        self._connected_ip  = None
        self._last_seen     = 0.0
        self._thread        = None
        self.method         = "scanning"

    def start(self):
        self.running  = True
        self._thread  = threading.Thread(target=self._run, daemon=True, name="BT-Scanner")
        self._thread.start()

    def stop(self):
        self.running = False

    @property
    def is_connected(self):
        return self._connected_ip is not None

    def _run(self):
        try:
            from bleak import BleakScanner
            self._run_ble()
        except Exception as e:
            log.warning(f"BLE scanner unavailable ({e}), using UDP")
            self._run_udp()

    # ── BLE path ──────────────────────────────────────────────
    def _run_ble(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self.method = "BLE"

        while self.running:
            result = loop.run_until_complete(self._ble_scan(loop))
            self._handle_result(result)
            time.sleep(SCAN_INTERVAL)

    async def _ble_scan(self, loop):
        from bleak import BleakScanner, BleakClient
        try:
            devices = await BleakScanner.discover(timeout=5.0, service_uuids=[SERVICE_UUID])
            if not devices:
                return None
            device = devices[0]
            async with BleakClient(device, loop=loop) as client:
                raw = await client.read_gatt_char(CHAR_IP_UUID)
                ip, port = raw.decode().split(":")
                return ip, int(port)
        except Exception as e:
            log.debug(f"BLE scan error: {e}")
            return None

    # ── UDP fallback ───────────────────────────────────────────
    def _run_udp(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        except AttributeError:
            pass
        sock.bind(("", UDP_PORT))
        sock.settimeout(5)
        self.method = "UDP"

        while self.running:
            try:
                data, _ = sock.recvfrom(1024)
                msg = data.decode()
                if msg.startswith("CLASSCONNECT:"):
                    rest = msg[len("CLASSCONNECT:"):]
                    ip, port = rest.rsplit(":", 1)
                    self._handle_result((ip, int(port)))
            except socket.timeout:
                self._handle_result(None)
            except Exception:
                pass

        sock.close()

    # ── Shared logic ───────────────────────────────────────────
    def _handle_result(self, result):
        now = time.time()
        if result:
            ip, port = result
            self._last_seen = now
            if not self._connected_ip:
                self._connected_ip = ip
                self._connected_port = port
                try:
                    self.on_found(ip, port)
                except Exception as e:
                    log.error(f"on_found error: {e}")
        else:
            if self._connected_ip and (now - self._last_seen) > LOST_TIMEOUT:
                self._connected_ip = None
                try:
                    self.on_lost()
                except Exception as e:
                    log.error(f"on_lost error: {e}")
