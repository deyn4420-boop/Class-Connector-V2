/**
 * Layout Components
 */

import React from 'react'
import { useTheme } from '@/utils/store'
import { Menu, Sun, Moon, Bell, LogOut } from 'lucide-react'
import { Button } from './ui'

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
  showNotifications?: boolean
  unreadCount?: number
}

export const Header: React.FC<HeaderProps> = ({
  title = 'ClassConnect',
  onMenuClick,
  showNotifications = false,
  unreadCount = 0,
}) => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-surface to-bg-light border-b border-border backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button onClick={onMenuClick} className="text-muted hover:text-text transition-colors">
              <Menu size={24} />
            </button>
          )}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {showNotifications && (
            <button className="relative text-muted hover:text-text transition-colors focus-visible">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red rounded-full text-xs text-white font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="text-muted hover:text-text transition-colors p-2 focus-visible"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
  items: Array<{
    label: string
    href: string
    icon: React.ReactNode
    isActive?: boolean
  }>
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, items, onLogout }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 md:hidden z-20" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:static top-0 left-0 h-screen w-64 bg-surface border-r border-border overflow-y-auto transition-transform duration-300 z-30',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            ClassConnect
          </h2>
          <p className="text-xs text-muted mt-1">v2.0</p>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2 rounded-xs transition-all duration-200',
                item.isActive
                  ? 'bg-primary/20 text-primary border-l-2 border-primary'
                  : 'text-muted hover:text-text hover:bg-surface-2'
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}

// Helper for imports
import { clsx } from 'clsx'
