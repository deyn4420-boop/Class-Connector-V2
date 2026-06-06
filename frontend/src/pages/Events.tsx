/**
 * Events & Schedules Page Component (Teacher only)
 */

import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Modal, Select, Skeleton } from '@/components/ui'
import { useAsync, useForm } from '@/hooks'
import { apiClient } from '@/utils/api'
import { Calendar, Plus, Mail, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface EventRow {
  id: number
  title: string
  description: string | null
  event_date: string
  event_type: 'holiday' | 'exam' | 'event'
  email_sent: number
  created_at: string
}

export const EventsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  const { data: events, loading, error } = useAsync<EventRow[]>(() =>
    apiClient.client.get('/events').then((res) => res.data.data || []),
    [refreshKey]
  )

  const refreshEvents = () => setRefreshKey(prev => prev + 1)

  const { values, errors, isSubmitting, handleChange, handleSubmit, setFieldValue } = useForm(
    { title: '', description: '', event_date: '', event_type: 'event', send_email: false },
    async (values) => {
      await apiClient.client.post('/events', {
        title: values.title,
        description: values.description,
        event_date: values.event_date,
        event_type: values.event_type,
        send_email: values.send_email
      })
      setIsModalOpen(false)
      refreshEvents()
    }
  )

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load events</p>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">📅 Events &amp; Holidays</h2>
            <p className="text-muted">Create exams, select holidays, or notify events to the class</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            New Event
          </Button>
        </div>

        {/* Modal: New Event */}
        <Modal
          isOpen={isModalOpen}
          title="Schedule New Event"
          onClose={() => setIsModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleSubmit()} isLoading={isSubmitting}>
                Schedule
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Input
              label="Event Title"
              name="title"
              placeholder="e.g. Midterm Examination"
              value={values.title}
              onChange={handleChange}
              error={errors.title as string}
            />
            <Select
              label="Event Type"
              name="event_type"
              options={[
                { value: 'exam', label: 'Exam' },
                { value: 'holiday', label: 'Holiday' },
                { value: 'event', label: 'General Event' }
              ]}
              value={values.event_type}
              onChange={handleChange}
            />
            <Input
              label="Date"
              name="event_date"
              type="date"
              value={values.event_date}
              onChange={handleChange}
              error={errors.event_date as string}
            />
            <Textarea
              label="Description"
              name="description"
              placeholder="Add details, instructions, or agenda..."
              value={values.description}
              onChange={handleChange}
            />
            
            <label className="flex items-center gap-2 text-sm p-1 cursor-pointer">
              <input
                type="checkbox"
                checked={values.send_email}
                onChange={(e) => setFieldValue('send_email', e.target.checked)}
                className="rounded accent-primary"
              />
              <span className="flex items-center gap-1">
                <Mail size={14} /> Send automated email alert to all students
              </span>
            </label>
          </form>
        </Modal>

        {loading ? (
          <div className="space-y-4">
            <Skeleton count={3} className="h-28" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      event.event_type === 'exam' 
                        ? 'bg-red/10 text-red border border-red/20' 
                        : event.event_type === 'holiday' 
                        ? 'bg-green/10 text-green border border-green/20' 
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {event.event_type}
                    </span>
                    {event.email_sent === 1 && (
                      <span className="text-xs text-muted flex items-center gap-1" title="Email notification sent">
                        <Mail size={12} className="text-green" /> E-mailed
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted mb-4">{event.description || 'No description provided.'}</p>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between text-xs text-muted">
                  <span>Scheduled date:</span>
                  <span className="font-semibold">{format(new Date(event.event_date + 'T00:00:00'), 'PPP')}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No events scheduled yet</p>
          </div>
        )}
      </div>
    </main>
  )
}
export default EventsPage
