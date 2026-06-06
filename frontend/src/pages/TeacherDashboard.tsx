/**
 * Teacher Dashboard Page
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Stat, Badge, Button, Skeleton } from '@/components/ui'
import { useAsync } from '@/hooks'
import { apiClient } from '@/utils/api'
import { Users, FileText, ClipboardList, BarChart3, AlertCircle } from 'lucide-react'

interface TeacherDashboardData {
  class: {
    name: string
    code: string
    studentCount: number
  }
  stats: {
    totalStudents: number
    pendingSubmissions: number
    averageGrade: number
    attendanceRate: number
  }
  recentSubmissions: Array<{ studentName: string; assignment: string; submittedAt: string }>
  assignments: Array<{ title: string; studentCount: number; submittedCount: number }>
}

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data, loading, error } = useAsync<TeacherDashboardData>(() =>
    apiClient.getTeacherDashboard().then((res) => res.data)
  )

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load dashboard</p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton count={3} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton count={1} className="h-20" />
          <Skeleton count={1} className="h-20" />
          <Skeleton count={1} className="h-20" />
          <Skeleton count={1} className="h-20" />
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto animate-fadeInUp">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Dashboard Overview 👨‍🏫</h2>
          <p className="text-muted">Class: <span className="text-primary font-bold">{data.class.name}</span> • Code: <span className="font-mono text-amber">{data.class.code}</span> • Students: <span className="font-semibold">{data.class.studentCount}</span></p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat value={data.stats.totalStudents} label="Total Students" icon={<Users />} color="primary" />
          <Stat value={data.stats.pendingSubmissions} label="Pending Reviews" icon={<FileText />} color="amber" />
          <Stat value={`${data.stats.averageGrade}%`} label="Class Average" icon={<BarChart3 />} color="green" />
          <Stat value={`${data.stats.attendanceRate}%`} label="Attendance" icon={<ClipboardList />} color="green" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Submissions */}
          <Card title="📝 Recent Submissions" subtitle="Latest 5" className="lg:col-span-2">
            <div className="space-y-3">
              {data.recentSubmissions.length > 0 ? (
                data.recentSubmissions.map((submission, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-3 border-b border-border last:border-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {submission.studentName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{submission.studentName}</p>
                      <p className="text-sm text-muted">{submission.assignment}</p>
                      <p className="text-xs text-muted mt-1">{submission.submittedAt}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center py-4">No recent submissions</p>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card title="⚡ Quick Actions">
            <div className="space-y-2">
              <Button
                className="w-full justify-center"
                variant="primary"
                onClick={() => navigate('/teacher/assignments')}
              >
                Create Assignment
              </Button>
              <Button
                className="w-full justify-center"
                variant="secondary"
                onClick={() => navigate('/teacher/attendance')}
              >
                Mark Attendance
              </Button>
              <Button
                className="w-full justify-center"
                variant="secondary"
                onClick={() => navigate('/teacher/events')}
              >
                Create Event
              </Button>
              <Button
                className="w-full justify-center"
                variant="secondary"
                onClick={() => navigate('/teacher/progress')}
              >
                View Progress
              </Button>
            </div>
          </Card>
        </div>

        {/* Assignment Status */}
        <Card title="📊 Assignment Status" className="mt-6">
          <div className="space-y-4">
            {data.assignments.map((assignment, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">{assignment.title}</p>
                  <Badge variant="success">
                    {assignment.submittedCount}/{assignment.studentCount}
                  </Badge>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-light h-full transition-all duration-500"
                    style={{
                      width: `${Math.round((assignment.submittedCount / assignment.studentCount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
