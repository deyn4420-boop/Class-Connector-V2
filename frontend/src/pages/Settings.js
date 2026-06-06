import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Settings Page Component (Teacher only)
 */
import { useState } from 'react';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import { useAsync, useForm } from '@/hooks';
import { apiClient } from '@/utils/api';
import { Mail, CheckCircle, AlertTriangle, Key } from 'lucide-react';
export const SettingsPage = () => {
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { data: settings, loading } = useAsync(() => apiClient.client.get('/settings').then((res) => res.data.data || { gmail: '' }));
    const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({ gmail: '', app_password: '' }, async (values) => {
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const res = await apiClient.client.put('/settings', {
                gmail: values.gmail,
                app_password: values.app_password
            });
            setSuccessMsg(res.data.message || 'Gmail connected! Test email sent.');
        }
        catch (err) {
            setErrorMsg(err.response?.data?.message || 'Connection failed. Check your password.');
        }
    });
    return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\u2699\uFE0F Email Settings" }), _jsx("p", { className: "text-muted", children: "Configure Gmail connections to send automated updates and alerts" })] }), loading ? (_jsx(Skeleton, { count: 1, className: "h-48" })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { title: "Gmail Integration", children: [_jsx("p", { className: "text-sm text-muted mb-6", children: "Connect your institutional or personal Gmail account. ClassConnect will use this to automatically email students about overdue assignments, exam notifications, and general announcements." }), settings?.gmail && (_jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg border border-green/20 bg-green/5 text-green text-sm mb-6 font-medium", children: [_jsx(CheckCircle, { size: 18 }), "Currently Connected: ", settings.gmail] })), successMsg && (_jsx("div", { className: "p-3 rounded-lg border border-green/30 bg-green/10 text-green text-sm mb-6 font-semibold animate-pulse", children: successMsg })), errorMsg && (_jsx("div", { className: "p-3 rounded-lg border border-red/30 bg-red/10 text-red text-sm mb-6 font-semibold", children: errorMsg })), _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Gmail Address", name: "gmail", type: "email", placeholder: "your.email@gmail.com", value: values.gmail, onChange: handleChange, error: errors.gmail }), _jsx(Input, { label: "App Password", name: "app_password", type: "password", placeholder: "16-character App Password", value: values.app_password, onChange: handleChange, error: errors.app_password }), _jsxs("div", { className: "flex gap-2 items-start p-3 bg-white/[0.02] border border-border/50 rounded-lg text-xs text-muted", children: [_jsx(Key, { size: 18, className: "text-amber flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "font-bold text-text", children: "How to get a Gmail App Password:" }), _jsxs("ol", { className: "list-decimal list-inside space-y-1 mt-1", children: [_jsx("li", { children: "Go to your Google Account Settings \u2192 Security." }), _jsxs("li", { children: ["Turn on ", _jsx("span", { className: "font-semibold text-text", children: "2-Step Verification" }), "."] }), _jsxs("li", { children: ["Search for ", _jsx("span", { className: "font-semibold text-text", children: "App Passwords" }), " and generate a new password named \"ClassConnect\"."] }), _jsx("li", { children: "Copy and paste the 16-character password here (spaces do not matter)." })] })] })] }), _jsxs(Button, { type: "button", onClick: () => handleSubmit(), isLoading: isSubmitting, className: "w-full mt-4", children: [_jsx(Mail, { size: 16 }), "Connect & Test Connection"] })] })] }), _jsxs("div", { className: "p-4 rounded-xl border border-amber/20 bg-amber/5 text-amber text-xs flex gap-2", children: [_jsx(AlertTriangle, { size: 18, className: "flex-shrink-0 mt-0.5" }), _jsx("p", { children: "We do not store your primary Google password. Your 16-character App Password is stored locally on this machine to authorize SMTP connections." })] })] }))] }) }));
};
export default SettingsPage;
