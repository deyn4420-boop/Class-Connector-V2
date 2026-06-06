import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Submissions Page Component (Teacher only)
 */
import { useState } from 'react';
import { Card, Button, Input, Textarea, Modal, Skeleton } from '@/components/ui';
import { useAsync, useForm } from '@/hooks';
import { apiClient } from '@/utils/api';
import { Inbox, Award, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
export const SubmissionsPage = () => {
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { data: submissions, loading, error } = useAsync(() => apiClient.getSubmissions().then((res) => res.data || []), [refreshKey]);
    const refreshSubmissions = () => setRefreshKey(prev => prev + 1);
    const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({ grade: '', feedback: '' }, async (values) => {
        if (!selectedSubmissionId)
            return;
        await apiClient.gradeSubmission(selectedSubmissionId, parseInt(values.grade), values.feedback);
        setIsGradeModalOpen(false);
        refreshSubmissions();
    });
    if (error) {
        return (_jsxs("div", { className: "p-6 text-center", children: [_jsx(AlertCircle, { size: 48, className: "mx-auto mb-2 text-red" }), _jsx("p", { className: "text-red", children: "Failed to load submissions" })] }));
    }
    return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-5xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\uD83D\uDCE5 Student Submissions" }), _jsx("p", { className: "text-muted", children: "Review, verify, and grade files/answers submitted by students" })] }), _jsx(Modal, { isOpen: isGradeModalOpen, title: "Grade Submission", onClose: () => setIsGradeModalOpen(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setIsGradeModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => handleSubmit(), isLoading: isSubmitting, children: "Submit Grade" })] }), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Grade (0 - 100)", name: "grade", type: "number", min: "0", max: "100", placeholder: "e.g. 85", value: values.grade, onChange: handleChange, error: errors.grade }), _jsx(Textarea, { label: "Teacher Feedback", name: "feedback", placeholder: "Type constructive comments for the student...", value: values.feedback, onChange: handleChange, error: errors.feedback })] }) }), loading ? (_jsx("div", { className: "space-y-4", children: _jsx(Skeleton, { count: 3, className: "h-32" }) })) : submissions && submissions.length > 0 ? (_jsx("div", { className: "space-y-4", children: submissions.map((sub) => {
                        const taskTitle = sub.atitle || sub.ttitle || 'Unnamed Task';
                        const taskType = sub.atitle ? 'Assignment' : 'Group project';
                        return (_jsx(Card, { className: "hover:shadow-md transition-all", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary", children: taskType }), sub.gname && (_jsx("span", { className: "text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber/10 text-amber", children: sub.gname })), _jsxs("span", { className: "text-xs text-muted", children: ["Submitted: ", format(new Date(sub.submitted_at), 'PPp')] })] }), _jsx("h3", { className: "text-lg font-bold mb-2 text-primary", children: taskTitle }), _jsx("div", { className: "text-sm border-l-2 border-border pl-3 py-1 bg-white/[0.01] rounded-xs mb-3 italic", children: sub.content || _jsx("span", { className: "text-muted italic", children: "(No text content submitted)" }) }), _jsxs("div", { className: "text-xs text-muted font-medium", children: ["Student: ", _jsx("span", { className: "text-text font-semibold", children: sub.sname }), " (", sub.usn, ")"] })] }), _jsx("div", { className: "flex-shrink-0 flex items-center gap-4 self-end md:self-center", children: sub.grade !== null ? (_jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-green/10 text-green border border-green/20", children: ["Graded: ", sub.grade, "/100"] }), sub.feedback && (_jsxs("p", { className: "text-xs text-muted mt-1 max-w-[200px] truncate", title: sub.feedback, children: ["\"", sub.feedback, "\""] }))] })) : (_jsxs(Button, { onClick: () => {
                                                setSelectedSubmissionId(sub.id);
                                                setIsGradeModalOpen(true);
                                            }, children: [_jsx(Award, { size: 16 }), "Grade Task"] })) })] }) }, sub.id));
                    }) })) : (_jsxs(Card, { className: "text-center py-12", children: [_jsx(Inbox, { size: 48, className: "mx-auto mb-4 text-muted opacity-50" }), _jsx("p", { className: "text-muted", children: "No student submissions received yet" })] }))] }) }));
};
export default SubmissionsPage;
