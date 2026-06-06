/**
 * Notes Page Component
 */

import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Modal, Skeleton } from '@/components/ui'
import { useAsync, useForm } from '@/hooks'
import { apiClient } from '@/utils/api'
import { useAuth } from '@/utils/store'
import { FileText, Plus, Trash2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface NoteData {
  id: number
  title: string
  content: string
  created_at: string
  tname?: string
}

export const NotesPage: React.FC = () => {
  const { session } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const isTeacher = session?.role === 'teacher'

  const { data: notes, loading, error } = useAsync<NoteData[]>(() =>
    apiClient.getNotes().then((res) => res.data || []),
    [refreshKey]
  )

  const refreshNotes = () => setRefreshKey(prev => prev + 1)

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { title: '', content: '' },
    async (values) => {
      await apiClient.createNote(values.title, values.content)
      setIsModalOpen(false)
      refreshNotes()
    }
  )

  const handleDelete = async (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await apiClient.deleteNote(noteId)
      refreshNotes()
    }
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-2 text-red" />
        <p className="text-red">Failed to load notes</p>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto animate-fadeInUp">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">📄 Class Notes</h2>
            <p className="text-muted">
              {isTeacher ? 'Post study materials and notices for your class' : 'Reference files and study notes posted by your teacher'}
            </p>
          </div>
          {isTeacher && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              New Note
            </Button>
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          title="New Note"
          onClose={() => setIsModalOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleSubmit()} isLoading={isSubmitting}>
                Post
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Input
              label="Title"
              name="title"
              placeholder="Note title"
              value={values.title}
              onChange={handleChange}
              error={errors.title as string}
            />
            <Textarea
              label="Content"
              name="content"
              placeholder="Write the notes contents here..."
              value={values.content}
              onChange={handleChange}
              error={errors.content as string}
            />
          </form>
        </Modal>

        {loading ? (
          <div className="space-y-4">
            <Skeleton count={3} className="h-28" />
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-all relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      {note.title}
                    </h3>
                    {isTeacher && (
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red hover:text-red-dark transition-colors p-1"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-muted text-sm whitespace-pre-wrap mb-4">{note.content}</p>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between text-xs text-muted">
                  <span>Posted by: {note.tname || 'Teacher'}</span>
                  <span>{format(new Date(note.created_at), 'PPP')}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No notes posted yet</p>
          </div>
        )}
      </div>
    </main>
  )
}
export default NotesPage
