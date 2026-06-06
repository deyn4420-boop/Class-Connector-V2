/**
 * Theme Store - Zustand store for theme management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useTheme = create()(persist((set) => ({
    isDark: true,
    toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    setTheme: (isDark) => set({ isDark }),
}), {
    name: 'theme-store',
}));
export const useAuth = create((set) => ({
    session: null,
    isLoading: false,
    error: null,
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    logout: () => set({ session: null, error: null }),
}));
export const useNotifications = create((set) => ({
    notifications: [],
    unreadCount: 0,
    setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
    }),
    addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
    })),
    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
