/**
 * Attendance Page Component
 */

import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Skeleton, Stat } from '@/components/ui'
import { useAsync } from '@/hooks'
import { apiClient } from '@/utils/api'
import { useAuth } from '@/utils/store'
import { Check, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Student {
  id: number
  name: string
  usn: string
}

interface SummaryRow {
  id: number
  name: string
  usn: string
  present_count: number
  total_days: number
}

interface TeacherAttendanceData {
  students: Student[]
  existing: Record<string, 'present' | 'absent' | 'late'>
  summary: SummaryRow[]
}

interface StudentAttendanceRecord {
  id: number
  date: string
  status: 'present' | 'absent' | 'late'
}

interface StudentAttendanceData {
  records: StudentAttendanceRecord[]
  stats: {
    present: number
    absent: number
    late: number
    total: number
    pct: number
  }
}

export const AttendancePage: React.FC = () => {
  const { session } = useAuth()
  const isTeacher = session?.role === 'teacher'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [markedRecords, setMarkedRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  // Teacher Data Loading
  const { data: teacherData, loading: loadingTeacher } = useAsync<TeacherAttendanceData>(() =>
    apiClient.client.get(`/attendance?date=${selectedDate}`).then((res) => res.data.data),
    [selectedDate, refreshKey]
  )

  const loadTeacherData = () => setRefreshKey(prev => prev + 1)

  // Student Data Loading
  const { data: studentData, loading: loadingStudent } = useAsync<StudentAttendanceData>(() =>
    apiClient.client.get('/attendance').then((res) => res.data.data)
  )

  // Sync markedRecords with backend existing records when loaded
  useEffect(() => {
    if (teacherData?.existing) {
      const records: Record<string, 'present' | 'absent' | 'late'> = {}
      teacherData.students.forEach(s => {
        records[s.id] = teacherData.existing[s.id] || 'absent'
      })
      setMarkedRecords(records)
    }
  }, [teacherData])

  // Trigger reload when date changes
  useEffect(() => {
    if (isTeacher) {
      loadTeacherData()
    }
  }, [selectedDate])

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setMarkedRecords(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSaveAttendance = async () => {
    setIsSubmitting(true)
    try {
      await apiClient.client.post('/attendance', {
        date: selectedDate,
        records: markedRecords
      })
      alert('Attendance saved successfully!')
      loadTeacherData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save attendance')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isTeacher) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2">✓ Attendance Sheets</h2>
              <p className="text-muted">Select a date to mark attendance or review the overall summary</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-[200px]"
              />
              <Button onClick={handleSaveAttendance} isLoading={isSubmitting} className="mt-5">
                <Check size={16} />
                Save Attendance
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mark Attendance List */}
            <Card className="lg:col-span-2" title={`Mark Sheet: ${format(new Date(selectedDate + 'T00:00:00'), 'PP')}`}>
              {loadingTeacher ? (
                <Skeleton count={5} className="h-12" />
              ) : teacherData && teacherData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                        <th className="py-3 px-2">Student Name</th>
                        <th className="py-3 px-2">USN</th>
                        <th className="py-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {teacherData.students.map(s => {
                        const currentStatus = markedRecords[s.id] || 'absent'
                        return (
                          <tr key={s.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 px-2 font-medium">{s.name}</td>
                            <td className="py-3 px-2 text-sm text-muted">{s.usn}</td>
                            <td className="py-3 px-2 text-right">
                              <div className="inline-flex rounded-md bg-black/20 p-0.5 border border-border">
                                {(['present', 'absent', 'late'] as const).map(status => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(s.id, status)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all uppercase ${
                                      currentStatus === status
                                        ? status === 'present'
                                          ? 'bg-green text-white shadow-sm'
                                          : status === 'absent'
                                          ? 'bg-red text-white shadow-sm'
                                          : 'bg-amber text-white shadow-sm'
                                        : 'text-muted hover:text-text'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-6">No students enrolled in this class</p>
              )}
            </Card>

            {/* Attendance Summary */}
            <Card title="Overall Attendance Summary">
              {loadingTeacher ? (
                <Skeleton count={3} className="h-16" />
              ) : teacherData && teacherData.summary.length > 0 ? (
                <div className="space-y-4">
                  {teacherData.summary.map(row => {
                    const pct = row.total_days > 0 ? Math.round((row.present_count / row.total_days) * 100) : 0
                    return (
                      <div key={row.id} className="border border-border/50 rounded-lg p-3 bg-white/[0.01]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{row.name}</span>
                          <span className={`text-xs font-bold ${pct >= 75 ? 'text-green' : 'text-red'}`}>{pct}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted">
                          <span>USN: {row.usn}</span>
                          <span>{row.present_count}/{row.total_days} days present</span>
                        </div>
                        <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 75 ? 'bg-green' : 'bg-red'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-6">No attendance reports available</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    )
  }

  // Student Dashboard / View
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">✓ Attendance Records</h2>
          <p className="text-muted">Monitor your attendance rate and details</p>
        </div>

        {loadingStudent ? (
          <Skeleton count={1} className="h-32 mb-6" />
        ) : studentData?.stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Stat
              value={`${studentData.stats.pct}%`}
              label="Attendance Rate"
              color={studentData.stats.pct >= 75 ? 'green' : 'red'}
              icon="📈"
            />
            <Stat value={studentData.stats.present} label="Days Present" color="green" icon="✅" />
            <Stat value={studentData.stats.absent} label="Days Absent" color="red" icon="❌" />
            <Stat value={studentData.stats.late} label="Days Late" color="amber" icon="⚠️" />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          <Card title="Attendance Logs">
            {loadingStudent ? (
              <Skeleton count={4} className="h-10" />
            ) : studentData && studentData.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {studentData.records.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-2 font-medium flex items-center gap-2">
                          <Calendar size={16} className="text-primary" />
                          {format(new Date(record.date + 'T00:00:00'), 'PPPP')}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              record.status === 'present'
                                ? 'bg-green/10 text-green border border-green/20'
                                : record.status === 'absent'
                                ? 'bg-red/10 text-red border border-red/20'
                                : 'bg-amber/10 text-amber border border-amber/20'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-muted opacity-50" />
                <p className="text-muted">No attendance logs available yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
export default AttendancePage
