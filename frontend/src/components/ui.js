import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Reusable UI Components
 */
import React from 'react';
import { clsx } from 'clsx';
export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => (_jsx("button", { ref: ref, disabled: disabled || isLoading, className: clsx('btn', `btn-${variant}`, `btn-${size}`, className), ...props, children: isLoading ? '⏳' : children })));
Button.displayName = 'Button';
export const Card = React.forwardRef(({ className, title, subtitle, children, ...props }, ref) => (_jsxs("div", { ref: ref, className: clsx('card', className), ...props, children: [title && (_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "card-title", children: title }), subtitle && _jsx("p", { className: "text-sm text-muted", children: subtitle })] })), children] })));
Card.displayName = 'Card';
export const Badge = React.forwardRef(({ className, variant = 'primary', ...props }, ref) => (_jsx("span", { ref: ref, className: clsx('badge', `badge-${variant}`, className), ...props })));
Badge.displayName = 'Badge';
export const Stat = React.forwardRef(({ className, value, label, icon, color = 'primary', ...props }, ref) => (_jsxs("div", { ref: ref, className: clsx('stat', className), ...props, children: [icon && _jsx("div", { className: "mb-2 text-2xl", children: icon }), _jsx("div", { className: clsx('stat-value', color === 'primary' && 'text-primary', color === 'green' && 'text-green', color === 'amber' && 'text-amber', color === 'red' && 'text-red'), children: value }), _jsx("div", { className: "stat-label", children: label })] })));
Stat.displayName = 'Stat';
export const Input = React.forwardRef(({ className, label, error, ...props }, ref) => (_jsxs("div", { className: "input-group", children: [label && _jsx("label", { className: "label", children: label }), _jsx("input", { ref: ref, className: clsx(error && 'border-red', className), ...props }), error && _jsx("span", { className: "text-xs text-red", children: error })] })));
Input.displayName = 'Input';
export const Textarea = React.forwardRef(({ className, label, error, ...props }, ref) => (_jsxs("div", { className: "input-group", children: [label && _jsx("label", { className: "label", children: label }), _jsx("textarea", { ref: ref, className: clsx(error && 'border-red', className), ...props }), error && _jsx("span", { className: "text-xs text-red", children: error })] })));
Textarea.displayName = 'Textarea';
export const Select = React.forwardRef(({ className, label, error, options, ...props }, ref) => (_jsxs("div", { className: "input-group", children: [label && _jsx("label", { className: "label", children: label }), _jsxs("select", { ref: ref, className: clsx(error && 'border-red', className), ...props, children: [_jsx("option", { value: "", children: "Select..." }), options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }), error && _jsx("span", { className: "text-xs text-red", children: error })] })));
Select.displayName = 'Select';
export const Modal = ({ isOpen, title, children, onClose, actions }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeInUp", onClick: onClose, children: _jsxs("div", { className: "card max-w-md w-full mx-4 animate-slideInLeft", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold", children: title }), _jsx("button", { onClick: onClose, className: "text-muted hover:text-text transition-colors", children: "\u2715" })] }), children, actions && _jsx("div", { className: "mt-6 flex gap-2 justify-end", children: actions })] }) }));
};
// Spinner Component
export const Spinner = ({ size = 'md' }) => {
    const sizeClass = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };
    return (_jsx("div", { className: clsx(sizeClass[size], 'border-2 border-primary/20 border-t-primary rounded-full animate-spin') }));
};
// Loading Skeleton
export const Skeleton = ({ count = 1, className }) => (_jsx(_Fragment, { children: Array.from({ length: count }).map((_, i) => (_jsx("div", { className: clsx('skeleton h-8 rounded-xs mb-2', className) }, i))) }));
