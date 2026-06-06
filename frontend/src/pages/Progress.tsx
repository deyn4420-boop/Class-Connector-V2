/**
 * Progress & Analytics Page Component
 */

import React from 'react'
import { Card, Skeleton, Stat } from '@/components/ui'
import { useAsync } from '@/hooks'
import { apiClient } from '@/utils/api'
import { useAuth } from '@/utils/store'
import { Award, BookOpen, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface StudentProgressRow {
  name: string
  usn: string
  att: number
  att_pct: number
  subs_a: number
  a_pct: number
  subs_t: number
  t_pct: number
  overall: number
}

interface TeacherProgressData {
  progress: StudentProgressRow[]
  totals: {
    assignments: number
    topics: number
    days: number
  }
}

interface RecentSubmission {
  id: number
  submitted_at: string
  atitle?: string
  ttitle?: string
  grade?: number
  feedback?: string
}

interface StudentProgressData {
  total_a: number
  done_a: number
  a_pct: number
  total_t: number
  done_t: number
  t_pct: number
  total_d: number
  pres: number
  att_pct: number
  overall: number
  recent_subs: RecentSubmission[]
}

export const ProgressPage: React.FC = () => {
  const { session } = useAuth()
  const isTeacher = session?.role === 'teacher'

  // Teacher Progress Loading
  const { data: teacherData, loading: loadingTeacher, error: errorTeacher } = useAsync<TeacherProgressData>(() =>
    isTeacher 
      ? apiClient.client.get('/progress').then((res) => res.data.data)
      : Promise.resolve({ progress: [], totals: { assignments: 0, topics: 0, days: 0 } })
  )

  // Student Progress Loading
  const { data: studentData, loading: loadingStudent, error: errorStudent } = useAsync<StudentProgressData>(() =>
    !isTeacher
      ? apiClient.client.get('/progress').then((res) => res.data.data)
      : Promise.resolve({ total_a: 0, done_a: 0, a_pct: 0, total_t: 0, done_t: 0, t_pct: 0, total_d: 0, pres: 0, att_pct: 0, overall: 0, recent_subs: [] })
  )

  const error = isTeacher ? errorTeacher : errorStudent

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load progress data</p>
      </div>
    )
  }

  if (isTeacher) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">📈 Student Progress</h2>
            <p className="text-muted">Track and analyze performance metrics for all students</p>
          </div>

          {loadingTeacher ? (
            <Skeleton count={1} className="h-32 mb-8" />
          ) : teacherData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Stat value={teacherData.totals.assignments} label="Class Assignments Created" icon="📝" />
              <Stat value={teacherData.totals.topics} label="Group Project Topics assigned" icon="👥" />
              <Stat value={teacherData.totals.days} label="Total Lecture Days logged" icon="📅" />
            </div>
          ) : null}

          <Card title="Student Analytics Matrix">
            {loadingTeacher ? (
              <Skeleton count={4} className="h-16" />
            ) : teacherData && teacherData.progress.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <th className="py-3 px-2">Student</th>
                      <th className="py-3 px-2 text-center">Attendance %</th>
                      <th className="py-3 px-2 text-center">Assignments</th>
                      <th className="py-3 px-2 text-center">Group Tasks</th>
                      <th className="py-3 px-2 text-right">Overall Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {teacherData.progress.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-2">
                          <div className="font-semibold">{row.name}</div>
                          <div className="text-xs text-muted">{row.usn}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-sm font-bold ${row.att_pct >= 75 ? 'text-green' : 'text-red'}`}>
                            {row.att_pct}%
                          </span>
                          <span className="text-xs text-muted block">({row.att}/{teacherData.totals.days} days)</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-semibold">{row.a_pct}%</span>
                          <span className="text-xs text-muted block">({row.subs_a}/{teacherData.totals.assignments} done)</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-semibold">{row.t_pct}%</span>
                          <span className="text-xs text-muted block">({row.subs_t}/{teacherData.totals.topics} done)</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            row.overall >= 80 
                              ? 'bg-green/10 text-green border border-green/20'
                              : row.overall >= 50
                              ? 'bg-amber/10 text-amber border border-amber/20'
                              : 'bg-red/10 text-red border border-red/20'
                          }`}>
                            {row.overall}% Overall
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-6">No progress statistics available</p>
            )}
          </Card>
        </div>
      </main>
    )
  }

  // Student Analytics view
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">📈 My Progress</h2>
          <p className="text-muted">Review your personal academic analytics and performance rating</p>
        </div>

        {loadingStudent ? (
          <Skeleton count={1} className="h-32 mb-8" />
        ) : studentData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Stat
              value={`${studentData.overall}%`}
              label="Overall Grade"
              color={studentData.overall >= 75 ? 'green' : 'amber'}
              icon={<Award />}
            />
            <Stat
              value={`${studentData.att_pct}%`}
              label="Attendance Rate"
              color={studentData.att_pct >= 75 ? 'green' : 'red'}
              icon="📅"
            />
            <Stat
              value={`${studentData.done_a}/${studentData.total_a}`}
              label="Assignments Done"
              color="primary"
              icon="📝"
            />
            <Stat
              value={`${studentData.done_t}/${studentData.total_t}`}
              label="Group Tasks Done"
              color="primary"
              icon="👥"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          <Card title="Recent Submissions & Grading Logs">
            {loadingStudent ? (
              <Skeleton count={3} className="h-14" />
            ) : studentData && studentData.recent_subs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <th className="py-3 px-2">Task Title</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Submitted Date</th>
                      <th className="py-3 px-2 text-right">Grade Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {studentData.recent_subs.map((sub) => {
                      const title = sub.atitle || sub.ttitle || 'Unnamed Task'
                      const type = sub.atitle ? 'Assignment' : 'Group Topic'
                      return (
                        <tr key={sub.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 px-2 font-medium flex items-center gap-2">
                            <BookOpen size={16} className="text-primary" />
                            {title}
                          </td>
                          <td className="py-3 px-2 text-xs text-muted">{type}</td>
                          <td className="py-3 px-2 text-xs text-muted flex items-center gap-1 mt-1 border-0">
                            <Clock size={12} />
                            {format(new Date(sub.submitted_at), 'PPPp')}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {sub.grade !== null && sub.grade !== undefined ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green/10 text-green border border-green/20">
                                Graded: {sub.grade}/100
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber/10 text-amber border border-amber/20">
                                Pending Review
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-4 text-muted opacity-50" />
                <p className="text-muted">No recent submissions logged yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
export default ProgressPage
