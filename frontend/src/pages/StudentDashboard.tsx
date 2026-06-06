/**
 * Student Dashboard Page
 */

import React from 'react'
import { Card, Stat, Badge, Skeleton } from '@/components/ui'
import { useAsync } from '@/hooks'
import { apiClient } from '@/utils/api'
import { BookOpen, FileText, Users, TrendingUp, AlertCircle, Calendar } from 'lucide-react'

interface DashboardData {
  class: {
    name: string
    teacher: string
  }
  stats: {
    assignments: number
    submissions: number
    groups: number
    averageGrade: number
  }
  events: Array<{ title: string; date: string; type: string }>
  notifications: Array<{ message: string; timestamp: string }>
}

export const StudentDashboard: React.FC = () => {
  const { data, loading, error } = useAsync<DashboardData>(() =>
    apiClient.getStudentDashboard().then((res) => res.data)
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
          <h2 className="text-4xl font-bold mb-2">Welcome back! 👋</h2>
          <p className="text-muted">Your class: <span className="text-primary font-bold">{data.class?.name || 'Unknown'}</span> • Teacher: <span className="font-semibold">{data.class?.teacher || 'Unknown'}</span></p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat value={data.stats.assignments} label="Assignments" icon={<FileText />} color="primary" />
          <Stat value={data.stats.submissions} label="Submitted" icon={<BookOpen />} color="green" />
          <Stat value={data.stats.groups} label="Groups" icon={<Users />} color="amber" />
          <Stat value={`${data.stats.averageGrade}%`} label="Avg Grade" icon={<TrendingUp />} color="green" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <Card title="📅 Upcoming Events" subtitle="Next 7 days" className="lg:col-span-2">
            <div className="space-y-3">
              {data.events.length > 0 ? (
                data.events.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-3 border-b border-border last:border-0">
                    <Calendar className="text-primary mt-1 flex-shrink-0" size={18} />
                    <div className="flex-1">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted">{event.date}</p>
                    </div>
                    <Badge variant={event.type === 'exam' ? 'error' : 'primary'} className="ml-2">
                      {event.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center py-4">No upcoming events</p>
              )}
            </div>
          </Card>

          {/* Notifications */}
          <Card title="🔔 Notifications">
            <div className="space-y-2">
              {data.notifications.length > 0 ? (
                data.notifications.map((notif, idx) => (
                  <div key={idx} className="text-sm p-3 bg-surface-2 rounded-xs border border-border animate-slideInLeft">
                    <p>{notif.message}</p>
                    <p className="text-xs text-muted mt-1">{notif.timestamp}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center py-4">No notifications</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/student/assignments" className="card group cursor-pointer hover:border-primary/50">
            <FileText className="text-amber mb-2 group-hover:scale-110 transition-transform" size={32} />
            <p className="font-bold mb-1">View Assignments</p>
            <p className="text-sm text-muted">See all pending tasks</p>
          </a>
          <a href="/student/progress" className="card group cursor-pointer hover:border-primary/50">
            <TrendingUp className="text-green mb-2 group-hover:scale-110 transition-transform" size={32} />
            <p className="font-bold mb-1">Check Progress</p>
            <p className="text-sm text-muted">Track your performance</p>
          </a>
          <a href="/student/groups" className="card group cursor-pointer hover:border-primary/50">
            <Users className="text-primary mb-2 group-hover:scale-110 transition-transform" size={32} />
            <p className="font-bold mb-1">Join Groups</p>
            <p className="text-sm text-muted">Collaborate with peers</p>
          </a>
        </div>
      </div>
    </main>
  )
}
