/**
 * API Service Layer
 * All communication with Flask backend goes through here
 */

import axios, { AxiosInstance } from 'axios'
import type { ApiResponse, Session } from '@/types'

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || 'http://localhost:5000/api'

export class ApiClient {
  public client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    // Error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('session')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async register(
    name: string,
    email: string,
    password: string,
    role: 'student' | 'teacher',
    staffIdOrUsn: string,
    classCode?: string,
    className?: string
  ): Promise<ApiResponse> {
    return this.client.post('/register', {
      name,
      email,
      password,
      role,
      staff_id: role === 'teacher' ? staffIdOrUsn : undefined,
      usn: role === 'student' ? staffIdOrUsn : undefined,
      class_code: classCode,
      class_name: className,
    })
  }

  async login(email: string, password: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post('/login', { email, password })
    return response.data
  }

  async logout(): Promise<ApiResponse> {
    return this.client.post('/logout')
  }

  async getSession(): Promise<ApiResponse<Session>> {
    return this.client.get('/session')
  }

  // Dashboard/Data endpoints
  async getStudentDashboard(): Promise<ApiResponse> {
    return this.client.get('/student/dashboard')
  }

  async getTeacherDashboard(): Promise<ApiResponse> {
    return this.client.get('/teacher/dashboard')
  }

  // Class endpoints
  async getClass(): Promise<ApiResponse> {
    return this.client.get('/class')
  }

  // Notes endpoints
  async getNotes(): Promise<ApiResponse> {
    return this.client.get('/notes')
  }

  async createNote(title: string, content: string): Promise<ApiResponse> {
    return this.client.post('/notes', { title, content })
  }

  async deleteNote(noteId: number): Promise<ApiResponse> {
    return this.client.delete(`/notes/${noteId}`)
  }

  // Assignments endpoints
  async getAssignments(): Promise<ApiResponse> {
    return this.client.get('/assignments')
  }

  async createAssignment(
    title: string,
    description: string,
    deadline: string
  ): Promise<ApiResponse> {
    return this.client.post('/assignments', {
      title,
      description,
      deadline,
    })
  }

  async submitAssignment(
    assignmentId: number,
    filePath: string
  ): Promise<ApiResponse> {
    return this.client.post(`/assignments/${assignmentId}/submit`, {
      file_path: filePath,
    })
  }

  // Groups endpoints
  async getGroups(): Promise<ApiResponse> {
    return this.client.get('/groups')
  }

  async createGroup(name: string, members: number[]): Promise<ApiResponse> {
    return this.client.post('/groups', { name, members })
  }

  // Attendance endpoints
  async getAttendance(): Promise<ApiResponse> {
    return this.client.get('/attendance')
  }

  async markAttendance(studentId: number, status: string): Promise<ApiResponse> {
    return this.client.post('/attendance', { student_id: studentId, status })
  }

  // Progress endpoints
  async getProgress(): Promise<ApiResponse> {
    return this.client.get('/progress')
  }

  // Events endpoints
  async getEvents(): Promise<ApiResponse> {
    return this.client.get('/events')
  }

  async createEvent(
    title: string,
    eventDate: string,
    eventType: string
  ): Promise<ApiResponse> {
    return this.client.post('/events', { title, event_date: eventDate, event_type: eventType })
  }

  // Notifications endpoints
  async getNotifications(): Promise<ApiResponse> {
    return this.client.get('/notifications')
  }

  async markNotificationRead(notificationId: number): Promise<ApiResponse> {
    return this.client.put(`/notifications/${notificationId}/read`)
  }

  // Submissions endpoints (teacher only)
  async getSubmissions(): Promise<ApiResponse> {
    return this.client.get('/teacher/submissions')
  }

  async gradeSubmission(
    submissionId: number,
    grade: number,
    feedback?: string
  ): Promise<ApiResponse> {
    return this.client.put(`/submissions/${submissionId}/grade`, {
      grade,
      feedback,
    })
  }

  // Settings endpoints
  async getSettings(): Promise<ApiResponse> {
    return this.client.get('/settings')
  }

  async updateSettings(settings: Record<string, any>): Promise<ApiResponse> {
    return this.client.put('/settings', settings)
  }
}

export const apiClient = new ApiClient()
