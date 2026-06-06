/**
 * Submissions Page Component (Teacher only)
 */

import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Modal, Skeleton } from '@/components/ui'
import { useAsync, useForm } from '@/hooks'
import { apiClient } from '@/utils/api'
import { Inbox, Award, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface SubmissionRow {
  id: number
  student_id: number
  assignment_id: number | null
  topic_id: number | null
  group_id: number | null
  content: string
  submitted_at: string
  grade: number | null
  feedback: string | null
  sname: string
  usn: string
  atitle: string | null
  ttitle: string | null
  gname: string | null
}

export const SubmissionsPage: React.FC = () => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: submissions, loading, error } = useAsync<SubmissionRow[]>(() =>
    apiClient.getSubmissions().then((res) => res.data || []),
    [refreshKey]
  )

  const refreshSubmissions = () => setRefreshKey(prev => prev + 1)

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { grade: '', feedback: '' },
    async (values) => {
      if (!selectedSubmissionId) return
      await apiClient.gradeSubmission(
        selectedSubmissionId,
        parseInt(values.grade),
        values.feedback
      )
      setIsGradeModalOpen(false)
      refreshSubmissions()
    }
  )

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load submissions</p>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">📥 Student Submissions</h2>
          <p className="text-muted">Review, verify, and grade files/answers submitted by students</p>
        </div>

        {/* Modal: Grade Submission */}
        <Modal
          isOpen={isGradeModalOpen}
          title="Grade Submission"
          onClose={() => setIsGradeModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsGradeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleSubmit()} isLoading={isSubmitting}>
                Submit Grade
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Input
              label="Grade (0 - 100)"
              name="grade"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 85"
              value={values.grade}
              onChange={handleChange}
              error={errors.grade as string}
            />
            <Textarea
              label="Teacher Feedback"
              name="feedback"
              placeholder="Type constructive comments for the student..."
              value={values.feedback}
              onChange={handleChange}
              error={errors.feedback as string}
            />
          </form>
        </Modal>

        {loading ? (
          <div className="space-y-4">
            <Skeleton count={3} className="h-32" />
          </div>
        ) : submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const taskTitle = sub.atitle || sub.ttitle || 'Unnamed Task'
              const taskType = sub.atitle ? 'Assignment' : 'Group project'
              return (
                <Card key={sub.id} className="hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                          {taskType}
                        </span>
                        {sub.gname && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber/10 text-amber">
                            {sub.gname}
                          </span>
                        )}
                        <span className="text-xs text-muted">Submitted: {format(new Date(sub.submitted_at), 'PPp')}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-2 text-primary">{taskTitle}</h3>
                      
                      <div className="text-sm border-l-2 border-border pl-3 py-1 bg-white/[0.01] rounded-xs mb-3 italic">
                        {sub.content || <span className="text-muted italic">(No text content submitted)</span>}
                      </div>

                      <div className="text-xs text-muted font-medium">
                        Student: <span className="text-text font-semibold">{sub.sname}</span> ({sub.usn})
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-4 self-end md:self-center">
                      {sub.grade !== null ? (
                        <div className="text-right">
                          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-green/10 text-green border border-green/20">
                            Graded: {sub.grade}/100
                          </span>
                          {sub.feedback && (
                            <p className="text-xs text-muted mt-1 max-w-[200px] truncate" title={sub.feedback}>
                              "{sub.feedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedSubmissionId(sub.id)
                            setIsGradeModalOpen(true)
                          }}
                        >
                          <Award size={16} />
                          Grade Task
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Inbox size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No student submissions received yet</p>
          </Card>
        )}
      </div>
    </main>
  )
}
export default SubmissionsPage
