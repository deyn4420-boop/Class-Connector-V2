import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Events & Schedules Page Component (Teacher only)
 */
import { useState } from 'react';
import { Card, Button, Input, Textarea, Modal, Select, Skeleton } from '@/components/ui';
import { useAsync, useForm } from '@/hooks';
import { apiClient } from '@/utils/api';
import { Calendar, Plus, Mail, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
export const EventsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { data: events, loading, error } = useAsync(() => apiClient.client.get('/events').then((res) => res.data.data || []), [refreshKey]);
    const refreshEvents = () => setRefreshKey(prev => prev + 1);
    const { values, errors, isSubmitting, handleChange, handleSubmit, setFieldValue } = useForm({ title: '', description: '', event_date: '', event_type: 'event', send_email: false }, async (values) => {
        await apiClient.client.post('/events', {
            title: values.title,
            description: values.description,
            event_date: values.event_date,
            event_type: values.event_type,
            send_email: values.send_email
        });
        setIsModalOpen(false);
        refreshEvents();
    });
    if (error) {
        return (_jsxs("div", { className: "p-6 text-center", children: [_jsx(AlertCircle, { size: 48, className: "mx-auto mb-2 text-red" }), _jsx("p", { className: "text-red", children: "Failed to load events" })] }));
    }
    return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-5xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\uD83D\uDCC5 Events & Holidays" }), _jsx("p", { className: "text-muted", children: "Create exams, select holidays, or notify events to the class" })] }), _jsxs(Button, { onClick: () => setIsModalOpen(true), children: [_jsx(Plus, { size: 18 }), "New Event"] })] }), _jsx(Modal, { isOpen: isModalOpen, title: "Schedule New Event", onClose: () => setIsModalOpen(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setIsModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => handleSubmit(), isLoading: isSubmitting, children: "Schedule" })] }), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Event Title", name: "title", placeholder: "e.g. Midterm Examination", value: values.title, onChange: handleChange, error: errors.title }), _jsx(Select, { label: "Event Type", name: "event_type", options: [
                                    { value: 'exam', label: 'Exam' },
                                    { value: 'holiday', label: 'Holiday' },
                                    { value: 'event', label: 'General Event' }
                                ], value: values.event_type, onChange: handleChange }), _jsx(Input, { label: "Date", name: "event_date", type: "date", value: values.event_date, onChange: handleChange, error: errors.event_date }), _jsx(Textarea, { label: "Description", name: "description", placeholder: "Add details, instructions, or agenda...", value: values.description, onChange: handleChange }), _jsxs("label", { className: "flex items-center gap-2 text-sm p-1 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: values.send_email, onChange: (e) => setFieldValue('send_email', e.target.checked), className: "rounded accent-primary" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Mail, { size: 14 }), " Send automated email alert to all students"] })] })] }) }), loading ? (_jsx("div", { className: "space-y-4", children: _jsx(Skeleton, { count: 3, className: "h-28" }) })) : events && events.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: events.map((event) => (_jsxs(Card, { className: "hover:shadow-md transition-all flex flex-col justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsx("span", { className: `px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${event.event_type === 'exam'
                                                    ? 'bg-red/10 text-red border border-red/20'
                                                    : event.event_type === 'holiday'
                                                        ? 'bg-green/10 text-green border border-green/20'
                                                        : 'bg-primary/10 text-primary border border-primary/20'}`, children: event.event_type }), event.email_sent === 1 && (_jsxs("span", { className: "text-xs text-muted flex items-center gap-1", title: "Email notification sent", children: [_jsx(Mail, { size: 12, className: "text-green" }), " E-mailed"] }))] }), _jsxs("h3", { className: "text-lg font-bold mb-1 flex items-center gap-2", children: [_jsx(Calendar, { size: 18, className: "text-primary" }), event.title] }), _jsx("p", { className: "text-sm text-muted mb-4", children: event.description || 'No description provided.' })] }), _jsxs("div", { className: "border-t border-border/50 pt-3 flex justify-between text-xs text-muted", children: [_jsx("span", { children: "Scheduled date:" }), _jsx("span", { className: "font-semibold", children: format(new Date(event.event_date + 'T00:00:00'), 'PPP') })] })] }, event.id))) })) : (_jsxs("div", { className: "card text-center py-12", children: [_jsx(Calendar, { size: 48, className: "mx-auto mb-4 text-muted opacity-50" }), _jsx("p", { className: "text-muted", children: "No events scheduled yet" })] }))] }) }));
};
export default EventsPage;
