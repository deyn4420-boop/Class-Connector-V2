import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Groups & Topics Page Component
 */
import { useState } from 'react';
import { Card, Button, Input, Textarea, Modal, Select, Skeleton } from '@/components/ui';
import { useAsync, useForm } from '@/hooks';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/utils/store';
import { Users, Plus, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
export const GroupsPage = () => {
    const { session } = useAuth();
    const isTeacher = session?.role === 'teacher';
    // Modals state
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    // Selection state
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    // Mode state ('specific' | 'random') for group creation
    const [groupCreateType, setGroupCreateType] = useState('specific');
    const [refreshKey, setRefreshKey] = useState(0);
    const { data: groups, loading, error } = useAsync(() => apiClient.getGroups().then((res) => res.data || []), [refreshKey]);
    const refreshGroups = () => setRefreshKey(prev => prev + 1);
    const { data: attendanceData } = useAsync(() => isTeacher ? apiClient.getAttendance().then((res) => res.data || { students: [] }) : Promise.resolve({ students: [] }));
    const students = attendanceData?.students || [];
    // Create Group Form
    const groupForm = useForm({ name: '', group_count: '2', members: [] }, async (values) => {
        const payload = groupCreateType === 'random'
            ? { action: 'create_random', group_count: parseInt(values.group_count) }
            : { action: 'create_specific', name: values.name, members: values.members };
        await apiClient.client.post('/groups', payload);
        setIsGroupModalOpen(false);
        refreshGroups();
    });
    // Assign Topic Form
    const topicForm = useForm({ topic_title: '', subject: 'General', description: '', deadline: '' }, async (values) => {
        if (!selectedGroupId)
            return;
        await apiClient.client.post('/groups/topic', {
            group_id: selectedGroupId,
            ...values
        });
        setIsTopicModalOpen(false);
        refreshGroups();
    });
    // Submit Topic Form (Student)
    const submitForm = useForm({ content: '' }, async (values) => {
        if (!selectedTopicId || !selectedGroupId)
            return;
        await apiClient.client.post('/groups/submit', {
            topic_id: selectedTopicId,
            group_id: selectedGroupId,
            content: values.content
        });
        setIsSubmitModalOpen(false);
        refreshGroups();
    });
    const handleMemberToggle = (studentId) => {
        const current = groupForm.values.members;
        if (current.includes(studentId)) {
            groupForm.setFieldValue('members', current.filter(id => id !== studentId));
        }
        else {
            groupForm.setFieldValue('members', [...current, studentId]);
        }
    };
    if (error) {
        return (_jsxs("div", { className: "p-6 text-center", children: [_jsx(AlertCircle, { size: 48, className: "mx-auto mb-2 text-red" }), _jsx("p", { className: "text-red", children: "Failed to load groups" })] }));
    }
    return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-5xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\uD83D\uDC65 Study Groups" }), _jsx("p", { className: "text-muted", children: isTeacher ? 'Create collaborative groups and assign project topics' : 'View your group members, assigned topics, and submit solutions' })] }), isTeacher && (_jsxs(Button, { onClick: () => setIsGroupModalOpen(true), children: [_jsx(Plus, { size: 18 }), "New Group"] }))] }), _jsx(Modal, { isOpen: isGroupModalOpen, title: "Create New Group", onClose: () => setIsGroupModalOpen(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setIsGroupModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => groupForm.handleSubmit(), children: "Create" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsx(Select, { label: "Group Creation Type", options: [
                                    { value: 'specific', label: 'Manual Creation (Select Members)' },
                                    { value: 'random', label: 'Randomized Distribution' }
                                ], value: groupCreateType, onChange: (e) => setGroupCreateType(e.target.value) }), groupCreateType === 'random' ? (_jsx(Input, { label: "Number of Groups to Generate", name: "group_count", type: "number", min: "2", max: "20", value: groupForm.values.group_count, onChange: groupForm.handleChange, error: groupForm.errors.group_count })) : (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Group Name", name: "name", placeholder: "e.g. Project Group Alpha", value: groupForm.values.name, onChange: groupForm.handleChange, error: groupForm.errors.name }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "label", children: "Select Students" }), _jsx("div", { className: "max-h-48 overflow-y-auto border border-border rounded-md p-2 space-y-1 bg-black/10", children: students.length > 0 ? (students.map(s => (_jsxs("label", { className: "flex items-center gap-2 text-sm p-1 hover:bg-white/5 rounded cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: groupForm.values.members.includes(s.id), onChange: () => handleMemberToggle(s.id), className: "rounded accent-primary" }), _jsxs("span", { children: [s.name, " (", s.usn, ")"] })] }, s.id)))) : (_jsx("p", { className: "text-xs text-muted p-2", children: "No students enrolled yet" })) })] })] }))] }) }), _jsx(Modal, { isOpen: isTopicModalOpen, title: "Assign Study Topic", onClose: () => setIsTopicModalOpen(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setIsTopicModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => topicForm.handleSubmit(), children: "Assign" })] }), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Topic Title", name: "topic_title", placeholder: "e.g. Bluetooth Chat Client", value: topicForm.values.topic_title, onChange: topicForm.handleChange, error: topicForm.errors.topic_title }), _jsx(Input, { label: "Subject", name: "subject", placeholder: "e.g. Computer Networks", value: topicForm.values.subject, onChange: topicForm.handleChange, error: topicForm.errors.subject }), _jsx(Textarea, { label: "Description", name: "description", placeholder: "Provide topic requirements...", value: topicForm.values.description, onChange: topicForm.handleChange, error: topicForm.errors.description }), _jsx(Input, { label: "Submission Deadline", name: "deadline", type: "datetime-local", value: topicForm.values.deadline, onChange: topicForm.handleChange, error: topicForm.errors.deadline })] }) }), _jsx(Modal, { isOpen: isSubmitModalOpen, title: "Submit Topic Response", onClose: () => setIsSubmitModalOpen(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setIsSubmitModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => submitForm.handleSubmit(), isLoading: submitForm.isSubmitting, children: "Submit" })] }), children: _jsx("form", { className: "space-y-4", children: _jsx(Textarea, { label: "Submission Content", name: "content", placeholder: "Type or paste your submission answer/github link/notes...", value: submitForm.values.content, onChange: submitForm.handleChange, error: submitForm.errors.content }) }) }), loading ? (_jsx("div", { className: "space-y-4", children: _jsx(Skeleton, { count: 2, className: "h-48" }) })) : groups && groups.length > 0 ? (_jsx("div", { className: "space-y-6", children: groups.map((group) => (_jsx(Card, { className: "hover:shadow-md transition-all", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-6", children: [_jsxs("h3", { className: "text-xl font-bold flex items-center gap-2 mb-2 text-primary", children: [_jsx(Users, { size: 20 }), group.g.name] }), _jsxs("p", { className: "text-xs text-muted mb-4", children: ["Type: ", group.g.group_type === 'random' ? 'Random Assignment' : 'Specific Group'] }), _jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted mb-2", children: "Members" }), _jsx("ul", { className: "space-y-1.5", children: group.members.map(m => (_jsxs("li", { className: "text-sm", children: [_jsx("span", { className: "font-medium", children: m.name }), ' ', _jsxs("span", { className: "text-xs text-muted", children: ["(", m.usn, ")"] })] }, m.id))) }), isTeacher && (_jsxs(Button, { size: "sm", className: "mt-6 w-full", variant: "secondary", onClick: () => {
                                                setSelectedGroupId(group.g.id);
                                                setIsTopicModalOpen(true);
                                            }, children: [_jsx(Target, { size: 14 }), "Assign Topic"] }))] }), _jsxs("div", { className: "col-span-2 space-y-4", children: [_jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted", children: "Assigned Topics" }), group.topics && group.topics.length > 0 ? (group.topics.map(t => {
                                            const isOverdue = t.deadline ? new Date(t.deadline) < new Date() : false;
                                            return (_jsxs("div", { className: "border border-border/55 rounded-lg p-4 bg-white/[0.01] flex justify-between items-start gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h5", { className: "font-bold text-md", children: t.title }), _jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary", children: t.subject })] }), _jsx("p", { className: "text-sm text-muted mb-3", children: t.description }), t.deadline && (_jsxs("p", { className: "text-xs text-muted", children: ["Deadline: ", format(new Date(t.deadline), 'PPpp'), isOverdue && _jsx("span", { className: "ml-2 text-red font-semibold", children: "(Overdue)" })] }))] }), !isTeacher && (t.submitted ? (_jsxs("div", { className: "flex items-center gap-1 text-green text-sm font-semibold whitespace-nowrap", children: [_jsx(CheckCircle, { size: 16 }), "Submitted"] })) : (_jsx(Button, { size: "sm", onClick: () => {
                                                            setSelectedGroupId(group.g.id);
                                                            setSelectedTopicId(t.id);
                                                            setIsSubmitModalOpen(true);
                                                        }, disabled: isOverdue, children: "Submit" })))] }, t.id));
                                        })) : (_jsx("p", { className: "text-sm text-muted italic", children: "No topics assigned yet" }))] })] }) }, group.g.id))) })) : (_jsxs(Card, { className: "text-center py-12", children: [_jsx(Users, { size: 48, className: "mx-auto mb-4 text-muted opacity-50" }), _jsx("p", { className: "text-muted", children: "No groups created yet" })] }))] }) }));
};
export default GroupsPage;
