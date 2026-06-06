/**
 * Groups & Topics Page Component
 */

import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Modal, Select, Skeleton } from '@/components/ui'
import { useAsync, useForm } from '@/hooks'
import { apiClient } from '@/utils/api'
import { useAuth } from '@/utils/store'
import { Users, Plus, Target, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Member {
  id: number
  name: string
  usn: string
}

interface Topic {
  id: number
  title: string
  subject: string
  description: string
  deadline: string
}

interface GroupData {
  g: {
    id: number
    name: string
    group_type: string
    created_at: string
  }
  members: Member[]
  topics: (Topic & { submitted?: boolean })[]
}

interface Student {
  id: number
  name: string
  usn: string
}

export const GroupsPage: React.FC = () => {
  const { session } = useAuth()
  const isTeacher = session?.role === 'teacher'
  
  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  
  // Selection state
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  
  // Mode state ('specific' | 'random') for group creation
  const [groupCreateType, setGroupCreateType] = useState<'specific' | 'random'>('specific')

  const [refreshKey, setRefreshKey] = useState(0)

  const { data: groups, loading, error } = useAsync<GroupData[]>(() =>
    apiClient.getGroups().then((res) => res.data || []),
    [refreshKey]
  )

  const refreshGroups = () => setRefreshKey(prev => prev + 1)

  const { data: attendanceData } = useAsync<{ students: Student[] }>(() =>
    isTeacher ? apiClient.getAttendance().then((res) => res.data || { students: [] }) : Promise.resolve({ students: [] })
  )
  const students = attendanceData?.students || []

  // Create Group Form
  const groupForm = useForm(
    { name: '', group_count: '2', members: [] as number[] },
    async (values) => {
      const payload = groupCreateType === 'random' 
        ? { action: 'create_random', group_count: parseInt(values.group_count) }
        : { action: 'create_specific', name: values.name, members: values.members }
      
      await apiClient.client.post('/groups', payload)
      setIsGroupModalOpen(false)
      refreshGroups()
    }
  )

  // Assign Topic Form
  const topicForm = useForm(
    { topic_title: '', subject: 'General', description: '', deadline: '' },
    async (values) => {
      if (!selectedGroupId) return
      await apiClient.client.post('/groups/topic', {
        group_id: selectedGroupId,
        ...values
      })
      setIsTopicModalOpen(false)
      refreshGroups()
    }
  )

  // Submit Topic Form (Student)
  const submitForm = useForm(
    { content: '' },
    async (values) => {
      if (!selectedTopicId || !selectedGroupId) return
      await apiClient.client.post('/groups/submit', {
        topic_id: selectedTopicId,
        group_id: selectedGroupId,
        content: values.content
      })
      setIsSubmitModalOpen(false)
      refreshGroups()
    }
  )

  const handleMemberToggle = (studentId: number) => {
    const current = groupForm.values.members
    if (current.includes(studentId)) {
      groupForm.setFieldValue('members', current.filter(id => id !== studentId))
    } else {
      groupForm.setFieldValue('members', [...current, studentId])
    }
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load groups</p>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">👥 Study Groups</h2>
            <p className="text-muted">
              {isTeacher ? 'Create collaborative groups and assign project topics' : 'View your group members, assigned topics, and submit solutions'}
            </p>
          </div>
          {isTeacher && (
            <Button onClick={() => setIsGroupModalOpen(true)}>
              <Plus size={18} />
              New Group
            </Button>
          )}
        </div>

        {/* Modal: Create Group */}
        <Modal
          isOpen={isGroupModalOpen}
          title="Create New Group"
          onClose={() => setIsGroupModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => groupForm.handleSubmit()}>
                Create
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Select
              label="Group Creation Type"
              options={[
                { value: 'specific', label: 'Manual Creation (Select Members)' },
                { value: 'random', label: 'Randomized Distribution' }
              ]}
              value={groupCreateType}
              onChange={(e) => setGroupCreateType(e.target.value as 'specific' | 'random')}
            />

            {groupCreateType === 'random' ? (
              <Input
                label="Number of Groups to Generate"
                name="group_count"
                type="number"
                min="2"
                max="20"
                value={groupForm.values.group_count}
                onChange={groupForm.handleChange}
                error={groupForm.errors.group_count as string}
              />
            ) : (
              <>
                <Input
                  label="Group Name"
                  name="name"
                  placeholder="e.g. Project Group Alpha"
                  value={groupForm.values.name}
                  onChange={groupForm.handleChange}
                  error={groupForm.errors.name as string}
                />
                
                <div className="input-group">
                  <label className="label">Select Students</label>
                  <div className="max-h-48 overflow-y-auto border border-border rounded-md p-2 space-y-1 bg-black/10">
                    {students.length > 0 ? (
                      students.map(s => (
                        <label key={s.id} className="flex items-center gap-2 text-sm p-1 hover:bg-white/5 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={groupForm.values.members.includes(s.id)}
                            onChange={() => handleMemberToggle(s.id)}
                            className="rounded accent-primary"
                          />
                          <span>{s.name} ({s.usn})</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-muted p-2">No students enrolled yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Modal: Assign Topic */}
        <Modal
          isOpen={isTopicModalOpen}
          title="Assign Study Topic"
          onClose={() => setIsTopicModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsTopicModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => topicForm.handleSubmit()}>
                Assign
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Input
              label="Topic Title"
              name="topic_title"
              placeholder="e.g. Bluetooth Chat Client"
              value={topicForm.values.topic_title}
              onChange={topicForm.handleChange}
              error={topicForm.errors.topic_title as string}
            />
            <Input
              label="Subject"
              name="subject"
              placeholder="e.g. Computer Networks"
              value={topicForm.values.subject}
              onChange={topicForm.handleChange}
              error={topicForm.errors.subject as string}
            />
            <Textarea
              label="Description"
              name="description"
              placeholder="Provide topic requirements..."
              value={topicForm.values.description}
              onChange={topicForm.handleChange}
              error={topicForm.errors.description as string}
            />
            <Input
              label="Submission Deadline"
              name="deadline"
              type="datetime-local"
              value={topicForm.values.deadline}
              onChange={topicForm.handleChange}
              error={topicForm.errors.deadline as string}
            />
          </form>
        </Modal>

        {/* Modal: Student Submission */}
        <Modal
          isOpen={isSubmitModalOpen}
          title="Submit Topic Response"
          onClose={() => setIsSubmitModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => submitForm.handleSubmit()} isLoading={submitForm.isSubmitting}>
                Submit
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Textarea
              label="Submission Content"
              name="content"
              placeholder="Type or paste your submission answer/github link/notes..."
              value={submitForm.values.content}
              onChange={submitForm.handleChange}
              error={submitForm.errors.content as string}
            />
          </form>
        </Modal>

        {loading ? (
          <div className="space-y-4">
            <Skeleton count={2} className="h-48" />
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <Card key={group.g.id} className="hover:shadow-md transition-all">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left block: Group metadata */}
                  <div className="border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-primary">
                      <Users size={20} />
                      {group.g.name}
                    </h3>
                    <p className="text-xs text-muted mb-4">
                      Type: {group.g.group_type === 'random' ? 'Random Assignment' : 'Specific Group'}
                    </p>
                    
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Members</h4>
                    <ul className="space-y-1.5">
                      {group.members.map(m => (
                        <li key={m.id} className="text-sm">
                          <span className="font-medium">{m.name}</span>{' '}
                          <span className="text-xs text-muted">({m.usn})</span>
                        </li>
                      ))}
                    </ul>

                    {isTeacher && (
                      <Button
                        size="sm"
                        className="mt-6 w-full"
                        variant="secondary"
                        onClick={() => {
                          setSelectedGroupId(group.g.id)
                          setIsTopicModalOpen(true)
                        }}
                      >
                        <Target size={14} />
                        Assign Topic
                      </Button>
                    )}
                  </div>

                  {/* Right block: Assigned Topics */}
                  <div className="col-span-2 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Assigned Topics</h4>
                    {group.topics && group.topics.length > 0 ? (
                      group.topics.map(t => {
                        const isOverdue = t.deadline ? new Date(t.deadline) < new Date() : false
                        return (
                          <div key={t.id} className="border border-border/55 rounded-lg p-4 bg-white/[0.01] flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-bold text-md">{t.title}</h5>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t.subject}</span>
                              </div>
                              <p className="text-sm text-muted mb-3">{t.description}</p>
                              {t.deadline && (
                                <p className="text-xs text-muted">
                                  Deadline: {format(new Date(t.deadline), 'PPpp')}
                                  {isOverdue && <span className="ml-2 text-red font-semibold">(Overdue)</span>}
                                </p>
                              )}
                            </div>
                            
                            {!isTeacher && (
                              t.submitted ? (
                                <div className="flex items-center gap-1 text-green text-sm font-semibold whitespace-nowrap">
                                  <CheckCircle size={16} />
                                  Submitted
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGroupId(group.g.id)
                                    setSelectedTopicId(t.id)
                                    setIsSubmitModalOpen(true)
                                  }}
                                  disabled={isOverdue}
                                >
                                  Submit
                                </Button>
                              )
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted italic">No topics assigned yet</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No groups created yet</p>
          </Card>
        )}
      </div>
    </main>
  )
}
export default GroupsPage
