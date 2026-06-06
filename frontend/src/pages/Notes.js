import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Notes Page Component
 */
import { useState } from 'react';
import { Card, Button, Input, Textarea, Modal, Skeleton } from '@/components/ui';
import { useAsync, useForm } from '@/hooks';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/utils/store';
import { FileText, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
export const NotesPage = () => {
    const { session } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const isTeacher = session?.role === 'teacher';
    const { data: notes, loading, error } = useAsync(() => apiClient.getNotes().then((res) => res.data || []), [refreshKey]);
    const refreshNotes = () => setRefreshKey(prev => prev + 1);
    const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({ title: '', content: '' }, async (values) => {
        await apiClient.createNote(values.title, values.content);
        setIsModalOpen(false);
        refreshNotes();
    });
    const handleDelete = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            await apiClient.deleteNote(noteId);
            refreshNotes();
        }
    };
    if (error) {
        return (_jsxs("div", { className: "p-6 text-center", children: [_jsx(AlertCircle, { size: 48, className: "mx-auto mb-2 text-red" }), _jsx("p", { className: "text-red", children: "Failed to load notes" })] }));
    }
    return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-5xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\uD83D\uDCC4 Class Notes" }), _jsx("p", { className: "text-muted", children: isTeacher ? 'Post study materials and notices for your class' : 'Reference files and study notes posted by your teacher' })] }), isTeacher && (_jsxs(Button, { onClick: () => setIsModalOpen(true), children: [_jsx(Plus, { size: 18 }), "New Note"] }))] }), _jsx(Modal, { isOpen: isModalOpen, title: "New Note", onClose: () => setIsModalOpen(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setIsModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => handleSubmit(), isLoading: isSubmitting, children: "Post" })] }), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Title", name: "title", placeholder: "Note title", value: values.title, onChange: handleChange, error: errors.title }), _jsx(Textarea, { label: "Content", name: "content", placeholder: "Write the notes contents here...", value: values.content, onChange: handleChange, error: errors.content })] }) }), loading ? (_jsx("div", { className: "space-y-4", children: _jsx(Skeleton, { count: 3, className: "h-28" }) })) : notes && notes.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: notes.map((note) => (_jsxs(Card, { className: "hover:shadow-lg transition-all relative flex flex-col justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsxs("h3", { className: "text-lg font-bold flex items-center gap-2", children: [_jsx(FileText, { size: 18, className: "text-primary" }), note.title] }), isTeacher && (_jsx("button", { onClick: () => handleDelete(note.id), className: "text-red hover:text-red-dark transition-colors p-1", title: "Delete note", children: _jsx(Trash2, { size: 16 }) }))] }), _jsx("p", { className: "text-muted text-sm whitespace-pre-wrap mb-4", children: note.content })] }), _jsxs("div", { className: "border-t border-border/50 pt-3 flex justify-between text-xs text-muted", children: [_jsxs("span", { children: ["Posted by: ", note.tname || 'Teacher'] }), _jsx("span", { children: format(new Date(note.created_at), 'PPP') })] })] }, note.id))) })) : (_jsxs("div", { className: "card text-center py-12", children: [_jsx(FileText, { size: 48, className: "mx-auto mb-4 text-muted opacity-50" }), _jsx("p", { className: "text-muted", children: "No notes posted yet" })] }))] }) }));
};
export default NotesPage;
