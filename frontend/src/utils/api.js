/**
 * API Service Layer
 * All communication with Flask backend goes through here
 */
import axios from 'axios';
const API_BASE_URL = (import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
export class ApiClient {
    constructor() {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        // Error interceptor
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('session');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }
    // Auth endpoints
    async register(name, email, password, role, staffIdOrUsn, classCode, className) {
        return this.client.post('/register', {
            name,
            email,
            password,
            role,
            staff_id: role === 'teacher' ? staffIdOrUsn : undefined,
            usn: role === 'student' ? staffIdOrUsn : undefined,
            class_code: classCode,
            class_name: className,
        });
    }
    async login(email, password) {
        const response = await this.client.post('/login', { email, password });
        return response.data;
    }
    async logout() {
        return this.client.post('/logout');
    }
    async getSession() {
        return this.client.get('/session');
    }
    // Dashboard/Data endpoints
    async getStudentDashboard() {
        return this.client.get('/student/dashboard');
    }
    async getTeacherDashboard() {
        return this.client.get('/teacher/dashboard');
    }
    // Class endpoints
    async getClass() {
        return this.client.get('/class');
    }
    // Notes endpoints
    async getNotes() {
        return this.client.get('/notes');
    }
    async createNote(title, content) {
        return this.client.post('/notes', { title, content });
    }
    async deleteNote(noteId) {
        return this.client.delete(`/notes/${noteId}`);
    }
    // Assignments endpoints
    async getAssignments() {
        return this.client.get('/assignments');
    }
    async createAssignment(title, description, deadline) {
        return this.client.post('/assignments', {
            title,
            description,
            deadline,
        });
    }
    async submitAssignment(assignmentId, filePath) {
        return this.client.post(`/assignments/${assignmentId}/submit`, {
            file_path: filePath,
        });
    }
    // Groups endpoints
    async getGroups() {
        return this.client.get('/groups');
    }
    async createGroup(name, members) {
        return this.client.post('/groups', { name, members });
    }
    // Attendance endpoints
    async getAttendance() {
        return this.client.get('/attendance');
    }
    async markAttendance(studentId, status) {
        return this.client.post('/attendance', { student_id: studentId, status });
    }
    // Progress endpoints
    async getProgress() {
        return this.client.get('/progress');
    }
    // Events endpoints
    async getEvents() {
        return this.client.get('/events');
    }
    async createEvent(title, eventDate, eventType) {
        return this.client.post('/events', { title, event_date: eventDate, event_type: eventType });
    }
    // Notifications endpoints
    async getNotifications() {
        return this.client.get('/notifications');
    }
    async markNotificationRead(notificationId) {
        return this.client.put(`/notifications/${notificationId}/read`);
    }
    // Submissions endpoints (teacher only)
    async getSubmissions() {
        return this.client.get('/teacher/submissions');
    }
    async gradeSubmission(submissionId, grade, feedback) {
        return this.client.put(`/submissions/${submissionId}/grade`, {
            grade,
            feedback,
        });
    }
    // Settings endpoints
    async getSettings() {
        return this.client.get('/settings');
    }
    async updateSettings(settings) {
        return this.client.put('/settings', settings);
    }
}
export const apiClient = new ApiClient();
