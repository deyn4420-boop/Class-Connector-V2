import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Attendance Page Component
 */
import { useState, useEffect } from 'react';
import { Card, Button, Input, Skeleton, Stat } from '@/components/ui';
import { useAsync } from '@/hooks';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/utils/store';
import { Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';
export const AttendancePage = () => {
    const { session } = useAuth();
    const isTeacher = session?.role === 'teacher';
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [markedRecords, setMarkedRecords] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    // Teacher Data Loading
    const { data: teacherData, loading: loadingTeacher } = useAsync(() => apiClient.client.get(`/attendance?date=${selectedDate}`).then((res) => res.data.data), [selectedDate, refreshKey]);
    const loadTeacherData = () => setRefreshKey(prev => prev + 1);
    // Student Data Loading
    const { data: studentData, loading: loadingStudent } = useAsync(() => apiClient.client.get('/attendance').then((res) => res.data.data));
    // Sync markedRecords with backend existing records when loaded
    useEffect(() => {
        if (teacherData?.existing) {
            const records = {};
            teacherData.students.forEach(s => {
                records[s.id] = teacherData.existing[s.id] || 'absent';
            });
            setMarkedRecords(records);
        }
    }, [teacherData]);
    // Trigger reload when date changes
    useEffect(() => {
        if (isTeacher) {
            loadTeacherData();
        }
    }, [selectedDate]);
    const handleStatusChange = (studentId, status) => {
        setMarkedRecords(prev => ({
            ...prev,
            [studentId]: status
        }));
    };
    const handleSaveAttendance = async () => {
        setIsSubmitting(true);
        try {
            await apiClient.client.post('/attendance', {
                date: selectedDate,
                records: markedRecords
            });
            alert('Attendance saved successfully!');
            loadTeacherData();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Failed to save attendance');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (isTeacher) {
        return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-5xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\u2713 Attendance Sheets" }), _jsx("p", { className: "text-muted", children: "Select a date to mark attendance or review the overall summary" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Input, { label: "Date", type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "max-w-[200px]" }), _jsxs(Button, { onClick: handleSaveAttendance, isLoading: isSubmitting, className: "mt-5", children: [_jsx(Check, { size: 16 }), "Save Attendance"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx(Card, { className: "lg:col-span-2", title: `Mark Sheet: ${format(new Date(selectedDate + 'T00:00:00'), 'PP')}`, children: loadingTeacher ? (_jsx(Skeleton, { count: 5, className: "h-12" })) : teacherData && teacherData.students.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border text-xs uppercase tracking-wider text-muted", children: [_jsx("th", { className: "py-3 px-2", children: "Student Name" }), _jsx("th", { className: "py-3 px-2", children: "USN" }), _jsx("th", { className: "py-3 px-2 text-right", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-border/50", children: teacherData.students.map(s => {
                                                    const currentStatus = markedRecords[s.id] || 'absent';
                                                    return (_jsxs("tr", { className: "hover:bg-white/[0.01]", children: [_jsx("td", { className: "py-3 px-2 font-medium", children: s.name }), _jsx("td", { className: "py-3 px-2 text-sm text-muted", children: s.usn }), _jsx("td", { className: "py-3 px-2 text-right", children: _jsx("div", { className: "inline-flex rounded-md bg-black/20 p-0.5 border border-border", children: ['present', 'absent', 'late'].map(status => (_jsx("button", { type: "button", onClick: () => handleStatusChange(s.id, status), className: `px-3 py-1 text-xs font-semibold rounded-md transition-all uppercase ${currentStatus === status
                                                                            ? status === 'present'
                                                                                ? 'bg-green text-white shadow-sm'
                                                                                : status === 'absent'
                                                                                    ? 'bg-red text-white shadow-sm'
                                                                                    : 'bg-amber text-white shadow-sm'
                                                                            : 'text-muted hover:text-text'}`, children: status }, status))) }) })] }, s.id));
                                                }) })] }) })) : (_jsx("p", { className: "text-sm text-muted text-center py-6", children: "No students enrolled in this class" })) }), _jsx(Card, { title: "Overall Attendance Summary", children: loadingTeacher ? (_jsx(Skeleton, { count: 3, className: "h-16" })) : teacherData && teacherData.summary.length > 0 ? (_jsx("div", { className: "space-y-4", children: teacherData.summary.map(row => {
                                        const pct = row.total_days > 0 ? Math.round((row.present_count / row.total_days) * 100) : 0;
                                        return (_jsxs("div", { className: "border border-border/50 rounded-lg p-3 bg-white/[0.01]", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("span", { className: "font-semibold text-sm", children: row.name }), _jsxs("span", { className: `text-xs font-bold ${pct >= 75 ? 'text-green' : 'text-red'}`, children: [pct, "%"] })] }), _jsxs("div", { className: "flex justify-between text-xs text-muted", children: [_jsxs("span", { children: ["USN: ", row.usn] }), _jsxs("span", { children: [row.present_count, "/", row.total_days, " days present"] })] }), _jsx("div", { className: "w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${pct >= 75 ? 'bg-green' : 'bg-red'}`, style: { width: `${pct}%` } }) })] }, row.id));
                                    }) })) : (_jsx("p", { className: "text-sm text-muted text-center py-6", children: "No attendance reports available" })) })] })] }) }));
    }
    // Student Dashboard / View
    return (_jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "p-6 max-w-5xl mx-auto animate-fadeInUp", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-2", children: "\u2713 Attendance Records" }), _jsx("p", { className: "text-muted", children: "Monitor your attendance rate and details" })] }), loadingStudent ? (_jsx(Skeleton, { count: 1, className: "h-32 mb-6" })) : studentData?.stats ? (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 mb-8", children: [_jsx(Stat, { value: `${studentData.stats.pct}%`, label: "Attendance Rate", color: studentData.stats.pct >= 75 ? 'green' : 'red', icon: "\uD83D\uDCC8" }), _jsx(Stat, { value: studentData.stats.present, label: "Days Present", color: "green", icon: "\u2705" }), _jsx(Stat, { value: studentData.stats.absent, label: "Days Absent", color: "red", icon: "\u274C" }), _jsx(Stat, { value: studentData.stats.late, label: "Days Late", color: "amber", icon: "\u26A0\uFE0F" })] })) : null, _jsx("div", { className: "grid grid-cols-1 gap-6", children: _jsx(Card, { title: "Attendance Logs", children: loadingStudent ? (_jsx(Skeleton, { count: 4, className: "h-10" })) : studentData && studentData.records.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border text-xs uppercase tracking-wider text-muted", children: [_jsx("th", { className: "py-3 px-2", children: "Date" }), _jsx("th", { className: "py-3 px-2 text-right", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-border/50", children: studentData.records.map((record) => (_jsxs("tr", { className: "hover:bg-white/[0.01]", children: [_jsxs("td", { className: "py-3 px-2 font-medium flex items-center gap-2", children: [_jsx(Calendar, { size: 16, className: "text-primary" }), format(new Date(record.date + 'T00:00:00'), 'PPPP')] }), _jsx("td", { className: "py-3 px-2 text-right", children: _jsx("span", { className: `inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${record.status === 'present'
                                                            ? 'bg-green/10 text-green border border-green/20'
                                                            : record.status === 'absent'
                                                                ? 'bg-red/10 text-red border border-red/20'
                                                                : 'bg-amber/10 text-amber border border-amber/20'}`, children: record.status }) })] }, record.id))) })] }) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { size: 48, className: "mx-auto mb-4 text-muted opacity-50" }), _jsx("p", { className: "text-muted", children: "No attendance logs available yet" })] })) }) })] }) }));
};
export default AttendancePage;
