/**
 * Assignments Page Component
 */

import React, { useState } from 'react'
import { Card, Button, Badge, Input, Textarea, Modal, Skeleton } from '@/components/ui'
import { useAsync, useForm } from '@/hooks'
import { apiClient } from '@/utils/api'
import { FileText, Plus, Send, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Assignment {
  id: number
  title: string
  description: string
  deadline: string
  createdAt: string
}

export const StudentAssignments: React.FC = () => {
  const { data: assignments, loading, error } = useAsync<Assignment[]>(() =>
    apiClient.getAssignments().then((res) => res.data || [])
  )

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load assignments</p>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">📝 Assignments</h2>
            <p className="text-muted">Track your pending and completed assignments</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton count={3} className="h-24" />
          </div>
        ) : assignments && assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isOverdue = new Date(assignment.deadline) < new Date()
              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={20} className="text-primary" />
                        <h3 className="text-lg font-bold">{assignment.title}</h3>
                        {isOverdue && <Badge variant="error">Overdue</Badge>}
                      </div>
                      <p className="text-muted text-sm mb-3">{assignment.description}</p>
                      <p className="text-xs text-muted">
                        Due: {format(new Date(assignment.deadline), 'PPpp')}
                      </p>
                    </div>
                    <Button size="sm" className="flex-shrink-0">
                      <Send size={16} />
                      Submit
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No assignments yet</p>
          </div>
        )}
      </div>
    </main>
  )
}

export const TeacherAssignments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: assignments, loading } = useAsync<Assignment[]>(() =>
    apiClient.getAssignments().then((res) => res.data || []),
    [refreshKey]
  )

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { title: '', description: '', deadline: '' },
    async (values) => {
      await apiClient.createAssignment(values.title, values.description, values.deadline)
      setIsModalOpen(false)
      setRefreshKey((prev) => prev + 1)
    }
  )

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">📝 Assignments</h2>
            <p className="text-muted">Create and manage class assignments</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            New Assignment
          </Button>
        </div>

        <Modal
          isOpen={isModalOpen}
          title="New Assignment"
          onClose={() => setIsModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleSubmit()} isLoading={isSubmitting}>
                Create
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Input
              label="Title"
              name="title"
              placeholder="Assignment title"
              value={values.title}
              onChange={handleChange}
              error={errors.title as string}
            />
            <Textarea
              label="Description"
              name="description"
              placeholder="What students need to do..."
              value={values.description}
              onChange={handleChange}
              error={errors.description as string}
            />
            <Input
              label="Deadline"
              name="deadline"
              type="datetime-local"
              value={values.deadline}
              onChange={handleChange}
              error={errors.deadline as string}
            />
          </form>
        </Modal>

        {loading ? (
          <div className="space-y-4">
            <Skeleton count={3} className="h-24" />
          </div>
        ) : assignments && assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{assignment.title}</h3>
                    <p className="text-muted text-sm mb-3">{assignment.description}</p>
                    <p className="text-xs text-muted">
                      Due: {format(new Date(assignment.deadline), 'PPpp')}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    View Submissions
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No assignments created yet</p>
          </Card>
        )}
      </div>
    </main>
  )
}
