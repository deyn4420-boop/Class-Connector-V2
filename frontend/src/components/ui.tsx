/**
 * Reusable UI Components
 */

import React from 'react'
import { clsx } from 'clsx'

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        className
      )}
      {...props}
    >
      {isLoading ? '⏳' : children}
    </button>
  )
)
Button.displayName = 'Button'

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, children, ...props }, ref) => (
    <div ref={ref} className={clsx('card', className)} {...props}>
      {title && (
        <div className="mb-4">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
)
Card.displayName = 'Card'

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <span ref={ref} className={clsx('badge', `badge-${variant}`, className)} {...props} />
  )
)
Badge.displayName = 'Badge'

// Stat Component
interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number
  label: string
  icon?: React.ReactNode
  color?: 'primary' | 'green' | 'amber' | 'red'
}

export const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, value, label, icon, color = 'primary', ...props }, ref) => (
    <div ref={ref} className={clsx('stat', className)} {...props}>
      {icon && <div className="mb-2 text-2xl">{icon}</div>}
      <div className={clsx('stat-value', color === 'primary' && 'text-primary', color === 'green' && 'text-green', color === 'amber' && 'text-amber', color === 'red' && 'text-red')}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
)
Stat.displayName = 'Stat'

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <input ref={ref} className={clsx(error && 'border-red', className)} {...props} />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <textarea ref={ref} className={clsx(error && 'border-red', className)} {...props} />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={clsx(error && 'border-red', className)} {...props}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  )
)
Select.displayName = 'Select'

// Modal Component
interface ModalProps {
  isOpen: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  actions?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose, actions }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeInUp" onClick={onClose}>
      <div className="card max-w-md w-full mx-4 animate-slideInLeft" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">✕</button>
        </div>
        {children}
        {actions && <div className="mt-6 flex gap-2 justify-end">{actions}</div>}
      </div>
    </div>
  )
}

// Spinner Component
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  return (
    <div className={clsx(sizeClass[size], 'border-2 border-primary/20 border-t-primary rounded-full animate-spin')} />
  )
}

// Loading Skeleton
export const Skeleton: React.FC<{ count?: number; className?: string }> = ({ count = 1, className }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={clsx('skeleton h-8 rounded-xs mb-2', className)} />
    ))}
  </>
)
