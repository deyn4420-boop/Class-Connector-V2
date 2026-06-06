import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Main App Component with Router
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useTheme } from '@/utils/store';
import { Header, Sidebar } from '@/components/layout';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { StudentAssignments, TeacherAssignments } from '@/pages/Assignments';
import { NotesPage } from '@/pages/Notes';
import { GroupsPage } from '@/pages/Groups';
import { AttendancePage } from '@/pages/Attendance';
import { ProgressPage } from '@/pages/Progress';
import { SubmissionsPage } from '@/pages/Submissions';
import { EventsPage } from '@/pages/Events';
import { SettingsPage } from '@/pages/Settings';
import './styles/globals.css';
export const App = () => {
    const { session, isLoading } = useAuth();
    const { isDark } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    useEffect(() => {
        // Apply theme to document
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-bg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-muted", children: "Loading..." })] }) }));
    }
    if (!session) {
        return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }));
    }
    const sidebarItems = session.role === 'student'
        ? [
            { label: 'Dashboard', href: '/student', icon: '📊' },
            { label: 'Assignments', href: '/student/assignments', icon: '📝' },
            { label: 'Notes', href: '/student/notes', icon: '📄' },
            { label: 'Groups', href: '/student/groups', icon: '👥' },
            { label: 'Progress', href: '/student/progress', icon: '📈' },
            { label: 'Attendance', href: '/student/attendance', icon: '✓' },
        ]
        : [
            { label: 'Dashboard', href: '/teacher', icon: '📊' },
            { label: 'Assignments', href: '/teacher/assignments', icon: '📝' },
            { label: 'Notes', href: '/teacher/notes', icon: '📄' },
            { label: 'Groups', href: '/teacher/groups', icon: '👥' },
            { label: 'Submissions', href: '/teacher/submissions', icon: '📥' },
            { label: 'Attendance', href: '/teacher/attendance', icon: '✓' },
            { label: 'Progress', href: '/teacher/progress', icon: '📈' },
            { label: 'Events', href: '/teacher/events', icon: '📅' },
            { label: 'Settings', href: '/teacher/settings', icon: '⚙️' },
        ];
    return (_jsxs("div", { className: "flex h-screen bg-bg text-text", children: [_jsx(Sidebar, { isOpen: sidebarOpen, onClose: () => setSidebarOpen(false), items: sidebarItems.map((item) => ({
                    ...item,
                    icon: _jsx("span", { className: "text-xl", children: item.icon }),
                })), onLogout: () => {
                    // Handle logout
                    window.location.href = '/login';
                } }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(Header, { title: "ClassConnect", onMenuClick: () => setSidebarOpen(!sidebarOpen) }), _jsxs(Routes, { children: [session.role === 'student' && (_jsxs(_Fragment, { children: [_jsx(Route, { path: "/student", element: _jsx(StudentDashboard, {}) }), _jsx(Route, { path: "/student/assignments", element: _jsx(StudentAssignments, {}) }), _jsx(Route, { path: "/student/notes", element: _jsx(NotesPage, {}) }), _jsx(Route, { path: "/student/groups", element: _jsx(GroupsPage, {}) }), _jsx(Route, { path: "/student/progress", element: _jsx(ProgressPage, {}) }), _jsx(Route, { path: "/student/attendance", element: _jsx(AttendancePage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/student", replace: true }) })] })), session.role === 'teacher' && (_jsxs(_Fragment, { children: [_jsx(Route, { path: "/teacher", element: _jsx(TeacherDashboard, {}) }), _jsx(Route, { path: "/teacher/assignments", element: _jsx(TeacherAssignments, {}) }), _jsx(Route, { path: "/teacher/notes", element: _jsx(NotesPage, {}) }), _jsx(Route, { path: "/teacher/groups", element: _jsx(GroupsPage, {}) }), _jsx(Route, { path: "/teacher/submissions", element: _jsx(SubmissionsPage, {}) }), _jsx(Route, { path: "/teacher/attendance", element: _jsx(AttendancePage, {}) }), _jsx(Route, { path: "/teacher/progress", element: _jsx(ProgressPage, {}) }), _jsx(Route, { path: "/teacher/events", element: _jsx(EventsPage, {}) }), _jsx(Route, { path: "/teacher/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/teacher", replace: true }) })] }))] })] })] }));
};
export default App;
