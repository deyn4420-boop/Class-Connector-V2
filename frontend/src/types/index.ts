/**
 * Core domain types for ClassConnect
 */

export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'teacher'
  staffId?: string
  usn?: string
  createdAt: string
}

export interface Class {
  id: number
  name: string
  teacherId: number
  classCode: string
  createdAt: string
}

export interface Enrollment {
  id: number
  classId: number
  studentId: number
  enrolledAt: string
}

export interface Assignment {
  id: number
  classId: number
  title: string
  description: string
  deadline: string
  createdAt: string
  createdBy: number
}

export interface Submission {
  id: number
  assignmentId: number
  studentId: number
  filePath: string
  submittedAt: string
  grade?: number
  feedback?: string
}

export interface Note {
  id: number
  classId: number
  title: string
  content: string
  createdAt: string
  createdBy: number
}

export interface Attendance {
  id: number
  classId: number
  studentId: number
  date: string
  status: 'present' | 'absent' | 'late'
}

export interface Progress {
  id: number
  classId: number
  studentId: number
  subject: string
  grade: number
  percentage: number
  updatedAt: string
}

export interface Group {
  id: number
  classId: number
  name: string
  members: number[]
  createdAt: string
}

export interface Event {
  id: number
  classId: number
  title: string
  eventDate: string
  eventType: 'holiday' | 'exam' | 'event'
  description?: string
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  message: string
  read: boolean
  createdAt: string
}

export interface Session {
  userId: number
  name: string
  email: string
  role: 'student' | 'teacher'
  usn?: string
  staffId?: string
  classId?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
