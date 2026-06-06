import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useForm } from '@/hooks';
import { Button, Input, Card } from '@/components/ui';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/utils/store';
import { LogIn } from 'lucide-react';
export const LoginPage = () => {
    const navigate = useNavigate();
    const { setSession } = useAuth();
    const { values, errors, isSubmitting, handleChange, handleSubmit, setFieldError } = useForm({ email: '', password: '' }, async (values) => {
        try {
            const response = await apiClient.login(values.email, values.password);
            if (response.data) {
                setSession(response.data);
                navigate(response.data.role === 'student' ? '/student' : '/teacher');
            }
            else {
                setFieldError('email', response.message || 'Login failed');
            }
        }
        catch (error) {
            setFieldError('email', 'Invalid email or password');
        }
    });
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-bg to-surface flex items-center justify-center p-4 animate-fadeInUp", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs(Card, { className: "backdrop-blur-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2", children: "ClassConnect" }), _jsx("p", { className: "text-muted", children: "Welcome back" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Email", name: "email", type: "email", placeholder: "your@email.com", value: values.email, onChange: handleChange, error: errors.email, disabled: isSubmitting }), _jsx(Input, { label: "Password", name: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: values.password, onChange: handleChange, error: errors.password, disabled: isSubmitting }), _jsxs(Button, { type: "submit", variant: "primary", className: "w-full", isLoading: isSubmitting, children: [_jsx(LogIn, { size: 18 }), "Sign In"] }), _jsxs("p", { className: "text-center text-sm text-muted", children: ["Don't have an account?", ' ', _jsx("a", { href: "/register", className: "text-primary hover:text-primary-light transition-colors font-bold", children: "Register here" })] })] })] }), _jsx("p", { className: "text-center text-xs text-muted mt-4", children: "v2.0 \u2022 Modern Frontend \u2022 React + TypeScript" })] }) }));
};
