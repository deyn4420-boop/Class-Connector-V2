/**
 * Main App Component with Router
 */

import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, useTheme } from '@/utils/store'
import { Header, Sidebar } from '@/components/layout'
import { StudentDashboard } from '@/pages/StudentDashboard'
import { TeacherDashboard } from '@/pages/TeacherDashboard'
import { LoginPage } from '@/pages/Login'
import { RegisterPage } from '@/pages/Register'
import { StudentAssignments, TeacherAssignments } from '@/pages/Assignments'
import { NotesPage } from '@/pages/Notes'
import { GroupsPage } from '@/pages/Groups'
import { AttendancePage } from '@/pages/Attendance'
import { ProgressPage } from '@/pages/Progress'
import { SubmissionsPage } from '@/pages/Submissions'
import { EventsPage } from '@/pages/Events'
import { SettingsPage } from '@/pages/Settings'
import './styles/globals.css'

export const App: React.FC = () => {
  const { session, isLoading } = useAuth()
  const { isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
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
      ]

  return (
    <div className="flex h-screen bg-bg text-text">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={sidebarItems.map((item) => ({
          ...item,
          icon: <span className="text-xl">{item.icon}</span>,
        }))}
        onLogout={() => {
          // Handle logout
          window.location.href = '/login'
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="ClassConnect"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <Routes>
          {session.role === 'student' && (
            <>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/notes" element={<NotesPage />} />
              <Route path="/student/groups" element={<GroupsPage />} />
              <Route path="/student/progress" element={<ProgressPage />} />
              <Route path="/student/attendance" element={<AttendancePage />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </>
          )}
          {session.role === 'teacher' && (
            <>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/notes" element={<NotesPage />} />
              <Route path="/teacher/groups" element={<GroupsPage />} />
              <Route path="/teacher/submissions" element={<SubmissionsPage />} />
              <Route path="/teacher/attendance" element={<AttendancePage />} />
              <Route path="/teacher/progress" element={<ProgressPage />} />
              <Route path="/teacher/events" element={<EventsPage />} />
              <Route path="/teacher/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/teacher" replace />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  )
}

export default App
