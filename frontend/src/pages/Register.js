import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Register Page
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@/hooks';
import { Button, Input, Select, Card } from '@/components/ui';
import { apiClient } from '@/utils/api';
import { UserPlus } from 'lucide-react';
export const RegisterPage = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const { values, errors, isSubmitting, handleChange, handleSubmit, setFieldError } = useForm({ name: '', email: '', password: '', confirmPassword: '', staffIdOrUsn: '', classCode: '', className: '' }, async (formValues) => {
        if (formValues.password !== formValues.confirmPassword) {
            setFieldError('confirmPassword', 'Passwords do not match');
            return;
        }
        try {
            const response = await apiClient.register(formValues.name, formValues.email, formValues.password, role, formValues.staffIdOrUsn, formValues.classCode, role === 'teacher' ? formValues.className : undefined);
            if (response.success) {
                navigate('/login');
            }
            else {
                setFieldError('email', response.message || 'Registration failed');
            }
        }
        catch (error) {
            setFieldError('email', 'Registration failed. Please try again.');
        }
    });
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-bg to-surface flex items-center justify-center p-4 animate-fadeInUp", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs(Card, { className: "backdrop-blur-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2", children: "ClassConnect" }), _jsx("p", { className: "text-muted", children: "Create your account" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Select, { label: "I am a", options: [
                                        { value: 'student', label: 'Student' },
                                        { value: 'teacher', label: 'Teacher' },
                                    ], value: role, onChange: (e) => setRole(e.target.value) }), _jsx(Input, { label: "Full Name", name: "name", placeholder: "John Doe", value: values.name, onChange: handleChange, error: errors.name, disabled: isSubmitting }), _jsx(Input, { label: "Email", name: "email", type: "email", placeholder: "your@email.com", value: values.email, onChange: handleChange, error: errors.email, disabled: isSubmitting }), role === 'teacher' && (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Staff ID", name: "staffIdOrUsn", placeholder: "STAFF001", value: values.staffIdOrUsn, onChange: handleChange, error: errors.staffIdOrUsn, disabled: isSubmitting }), _jsx(Input, { label: "Class Name (Optional)", name: "className", placeholder: "My Class", value: values.className, onChange: handleChange, disabled: isSubmitting })] })), role === 'student' && (_jsxs(_Fragment, { children: [_jsx(Input, { label: "USN", name: "staffIdOrUsn", placeholder: "USN123456", value: values.staffIdOrUsn, onChange: handleChange, error: errors.staffIdOrUsn, disabled: isSubmitting }), _jsx(Input, { label: "Class Code", name: "classCode", placeholder: "ABCD1234", value: values.classCode, onChange: handleChange, error: errors.classCode, disabled: isSubmitting })] })), _jsx(Input, { label: "Password", name: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: values.password, onChange: handleChange, error: errors.password, disabled: isSubmitting }), _jsx(Input, { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: values.confirmPassword, onChange: handleChange, error: errors.confirmPassword, disabled: isSubmitting }), _jsxs(Button, { type: "submit", variant: "primary", className: "w-full", isLoading: isSubmitting, children: [_jsx(UserPlus, { size: 18 }), "Create Account"] }), _jsxs("p", { className: "text-center text-sm text-muted", children: ["Already have an account?", ' ', _jsx("a", { href: "/login", className: "text-primary hover:text-primary-light transition-colors font-bold", children: "Login here" })] })] })] }), _jsx("p", { className: "text-center text-xs text-muted mt-4", children: "v2.0 \u2022 Modern Frontend \u2022 React + TypeScript" })] }) }));
};
