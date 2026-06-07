/**
 * API Service Layer
 * All communication with Flask backend goes through here
 */

import axios, { AxiosInstance } from 'axios'
import type { ApiResponse, Session } from '@/types'

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || '/api'

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
    try {
      const response = await this.client.post('/register', {
        name,
        email,
        password,
        role,
        staff_id: role === 'teacher' ? staffIdOrUsn : undefined,
        usn: role === 'student' ? staffIdOrUsn : undefined,
        class_code: classCode,
        class_name: className,
      })
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw error
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post('/login', { email, password })
    return response.data
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.client.post('/logout')
    return response.data
  }

  async getSession(): Promise<ApiResponse<Session>> {
    const response = await this.client.get('/session')
    return response.data
  }

  // Dashboard/Data endpoints
  async getStudentDashboard(): Promise<ApiResponse> {
    const response = await this.client.get('/student/dashboard')
    return response.data
  }

  async getTeacherDashboard(): Promise<ApiResponse> {
    const response = await this.client.get('/teacher/dashboard')
    return response.data
  }

  // Class endpoints
  async getClass(): Promise<ApiResponse> {
    const response = await this.client.get('/class')
    return response.data
  }

  // Notes endpoints
  async getNotes(): Promise<ApiResponse> {
    const response = await this.client.get('/notes')
    return response.data
  }

  async createNote(title: string, content: string): Promise<ApiResponse> {
    const response = await this.client.post('/notes', { title, content })
    return response.data
  }

  async deleteNote(noteId: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/notes/${noteId}`)
    return response.data
  }

  // Assignments endpoints
  async getAssignments(): Promise<ApiResponse> {
    const response = await this.client.get('/assignments')
    return response.data
  }

  async createAssignment(
    title: string,
    description: string,
    deadline: string,
    file?: File
  ): Promise<ApiResponse> {
    if (file) {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('deadline', deadline)
      formData.append('file', file)

      const response = await this.client.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }

    const response = await this.client.post('/assignments', {
      title,
      description,
      deadline,
    })
    return response.data
  }

  async submitAssignment(
    assignmentId: number,
    filePath: string
  ): Promise<ApiResponse> {
    const response = await this.client.post(`/assignments/${assignmentId}/submit`, {
      file_path: filePath,
    })
    return response.data
  }

  // Groups endpoints
  async getGroups(): Promise<ApiResponse> {
    const response = await this.client.get('/groups')
    return response.data
  }

  async createGroup(name: string, members: number[]): Promise<ApiResponse> {
    const response = await this.client.post('/groups', { name, members })
    return response.data
  }

  // Attendance endpoints
  async getAttendance(): Promise<ApiResponse> {
    const response = await this.client.get('/attendance')
    return response.data
  }

  async markAttendance(studentId: number, status: string): Promise<ApiResponse> {
    const response = await this.client.post('/attendance', { student_id: studentId, status })
    return response.data
  }

  // Progress endpoints
  async getProgress(): Promise<ApiResponse> {
    const response = await this.client.get('/progress')
    return response.data
  }

  // Events endpoints
  async getEvents(): Promise<ApiResponse> {
    const response = await this.client.get('/events')
    return response.data
  }

  async createEvent(
    title: string,
    eventDate: string,
    eventType: string
  ): Promise<ApiResponse> {
    const response = await this.client.post('/events', { title, event_date: eventDate, event_type: eventType })
    return response.data
  }

  // Notifications endpoints
  async getNotifications(): Promise<ApiResponse> {
    const response = await this.client.get('/notifications')
    return response.data
  }

  async markNotificationRead(notificationId: number): Promise<ApiResponse> {
    const response = await this.client.put(`/notifications/${notificationId}/read`)
    return response.data
  }

  // Submissions endpoints (teacher only)
  async getSubmissions(): Promise<ApiResponse> {
    const response = await this.client.get('/teacher/submissions')
    return response.data
  }

  async gradeSubmission(
    submissionId: number,
    grade: number,
    feedback?: string
  ): Promise<ApiResponse> {
    const response = await this.client.put(`/submissions/${submissionId}/grade`, {
      grade,
      feedback,
    })
    return response.data
  }

  // Settings endpoints
  async getSettings(): Promise<ApiResponse> {
    const response = await this.client.get('/settings')
    return response.data
  }

  async updateSettings(settings: Record<string, any>): Promise<ApiResponse> {
    const response = await this.client.put('/settings', settings)
    return response.data
  }
}

export const apiClient = new ApiClient()
