// Real API client for MySQL backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Store auth token
let authToken: string | null = null;

// Initialize auth token safely
if (typeof window !== 'undefined' && window.localStorage) {
    authToken = localStorage.getItem('authToken');
}

// Helper to set auth token
export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }
};

// Helper to get auth headers
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
});

// Generic API request handler
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// Auth API
export const authApi = {
    async login(email: string, password: string) {
        const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setAuthToken(data.token);
        return data;
    },

    async register(email: string, password: string, name: string, phone?: string, department?: string, year?: number) {
        const data = await apiRequest<{ message: string; userId: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, phone, department, year }),
        });
        return data;
    },

    async changePassword(email: string, oldPassword: string, newPassword: string) {
        const data = await apiRequest<{ message: string }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ email, oldPassword, newPassword }),
        });
        return data;
    },

    async checkPasswordSecurity(password: string, email?: string) {
        const data = await apiRequest<{
            isLeaked: boolean;
            leakCount: number;
            usedBefore: boolean;
            error?: string;
        }>('/auth/check-password-security', {
            method: 'POST',
            body: JSON.stringify({ password, email }),
        });
        return data;
    },

    async generatePassword(count: number = 3, length: number = 16) {
        const data = await apiRequest<{ suggestions: string[] }>(
            `/auth/generate-password?count=${count}&length=${length}`
        );
        return data;
    },

    logout() {
        setAuthToken(null);
    }
};

// Hostels API
export const hostelsApi = {
    async getAll() {
        return apiRequest<any[]>('/hostels');
    },

    async getById(id: string) {
        return apiRequest<any>(`/hostels/${id}`);
    },

    async create(hostelData: any) {
        return apiRequest<{ message: string; id: string }>('/hostels', {
            method: 'POST',
            body: JSON.stringify(hostelData),
        });
    },

    async update(id: string, hostelData: any) {
        return apiRequest<{ message: string }>(`/hostels/${id}`, {
            method: 'PUT',
            body: JSON.stringify(hostelData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/hostels/${id}`, {
            method: 'DELETE',
        });
    }
};

// Books API
export const booksApi = {
    async getAll() {
        return apiRequest<any[]>('/books');
    },

    async getById(id: string) {
        return apiRequest<any>(`/books/${id}`);
    },

    async create(bookData: any) {
        return apiRequest<{ message: string; id: string }>('/books', {
            method: 'POST',
            body: JSON.stringify(bookData),
        });
    },

    async update(id: string, bookData: any) {
        return apiRequest<{ message: string }>(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/books/${id}`, {
            method: 'DELETE',
        });
    }
};

// Courses API
export const coursesApi = {
    async getAll() {
        return apiRequest<any[]>('/courses');
    },

    async getById(id: string) {
        return apiRequest<any>(`/courses/${id}`);
    },

    async create(courseData: any) {
        return apiRequest<{ message: string; id: string }>('/courses', {
            method: 'POST',
            body: JSON.stringify(courseData),
        });
    },

    async update(id: string, courseData: any) {
        return apiRequest<{ message: string }>(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(courseData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/courses/${id}`, {
            method: 'DELETE',
        });
    }
};

// Students API
export const studentsApi = {
    async getAll() {
        return apiRequest<any[]>('/students');
    },

    async getById(id: string) {
        return apiRequest<any>(`/students/${id}`);
    },

    async create(studentData: any) {
        return apiRequest<{ message: string; id: string }>('/students', {
            method: 'POST',
            body: JSON.stringify(studentData),
        });
    },

    async update(id: string, studentData: any) {
        return apiRequest<{ message: string }>(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/students/${id}`, {
            method: 'DELETE',
        });
    }
};

// Health check
export const healthCheck = async () => {
    return apiRequest<{ status: string; message: string }>('/health');
};

// Borrowings API
export const borrowingsApi = {
    async getAll() {
        return apiRequest<any[]>('/borrowings');
    },

    async getByStudentId(studentId: string) {
        return apiRequest<any[]>(`/borrowings/student/${studentId}`);
    },

    async create(borrowingData: any) {
        return apiRequest<{ message: string; id: string }>('/borrowings', {
            method: 'POST',
            body: JSON.stringify(borrowingData),
        });
    },

    async update(id: string, borrowingData: any) {
        return apiRequest<{ message: string }>(`/borrowings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(borrowingData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/borrowings/${id}`, {
            method: 'DELETE',
        });
    }
};

// Enrollments API
export const enrollmentsApi = {
    async getAll() {
        return apiRequest<any[]>('/enrollments');
    },

    async getByStudentId(studentId: string) {
        return apiRequest<any[]>(`/enrollments/student/${studentId}`);
    },

    async getByCourseCode(courseCode: string) {
        return apiRequest<any[]>(`/enrollments/course/${courseCode}`);
    },

    async create(enrollmentData: any) {
        return apiRequest<{ message: string; id: string }>('/enrollments', {
            method: 'POST',
            body: JSON.stringify(enrollmentData),
        });
    },

    async update(id: string, enrollmentData: any) {
        return apiRequest<{ message: string }>(`/enrollments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(enrollmentData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/enrollments/${id}`, {
            method: 'DELETE',
        });
    }
};

// Rooms API
export const roomsApi = {
    async getAll() {
        return apiRequest<any[]>('/rooms');
    },

    async getById(id: string) {
        return apiRequest<any>(`/rooms/${id}`);
    },

    async getByHostelId(hostelId: string) {
        return apiRequest<any[]>(`/rooms/hostel/${hostelId}`);
    },

    async create(roomData: any) {
        return apiRequest<{ message: string; id: string }>('/rooms', {
            method: 'POST',
            body: JSON.stringify(roomData),
        });
    },

    async update(id: string, roomData: any) {
        return apiRequest<{ message: string }>(`/rooms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(roomData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/rooms/${id}`, {
            method: 'DELETE',
        });
    },

    async addResident(id: string, residentData: any) {
        return apiRequest<{ message: string }>(`/rooms/${id}/residents`, {
            method: 'POST',
            body: JSON.stringify(residentData),
        });
    },

    async updateResident(id: string, residentId: string, residentData: any) {
        return apiRequest<{ message: string }>(`/rooms/${id}/residents/${residentId}`, {
            method: 'PUT',
            body: JSON.stringify(residentData),
        });
    },

    async removeResident(id: string, residentId: string) {
        return apiRequest<{ message: string }>(`/rooms/${id}/residents/${residentId}`, {
            method: 'DELETE',
        });
    },

    async addWarning(id: string, warningData: any) {
        return apiRequest<{ message: string }>(`/rooms/${id}/warnings`, {
            method: 'POST',
            body: JSON.stringify(warningData),
        });
    }
};

// Requests API
export const requestsApi = {
    async getAll() {
        return apiRequest<any[]>('/requests');
    },

    async getPending() {
        return apiRequest<any[]>('/requests/pending');
    },

    async getByStudentId(studentId: string) {
        return apiRequest<any[]>(`/requests/student/${studentId}`);
    },

    async create(requestData: any) {
        return apiRequest<{ message: string; id: string }>('/requests', {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
    },

    async updateStatus(id: string, status: string, adminNote?: string) {
        return apiRequest<{ message: string }>(`/requests/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, adminNote }),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/requests/${id}`, {
            method: 'DELETE',
        });
    }
};

// Notifications API
export const notificationsApi = {
    async getAll() {
        return apiRequest<any[]>('/notifications');
    },

    async getByEmail(email: string) {
        return apiRequest<any[]>(`/notifications/email/${email}`);
    },

    async getUnread() {
        return apiRequest<any[]>('/notifications/unread');
    },

    async getUnreadCount(email: string) {
        return apiRequest<{ count: number }>(`/notifications/unread/count/${email}`);
    },

    async markAsRead(id: string) {
        return apiRequest<{ message: string }>(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },

    async markAllAsRead() {
        return apiRequest<{ message: string }>('/notifications/read-all', {
            method: 'PUT',
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/notifications/${id}`, {
            method: 'DELETE',
        });
    }
};

// Announcements API
export const announcementsApi = {
    async getAll() {
        return apiRequest<any[]>('/announcements');
    },

    async getById(id: string) {
        return apiRequest<any>(`/announcements/${id}`);
    },

    async getByType(type: string) {
        return apiRequest<any[]>(`/announcements/type/${type}`);
    },

    async create(announcementData: any) {
        return apiRequest<{ message: string; id: string }>('/announcements', {
            method: 'POST',
            body: JSON.stringify(announcementData),
        });
    },

    async update(id: string, announcementData: any) {
        return apiRequest<{ message: string }>(`/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(announcementData),
        });
    },

    async delete(id: string) {
        return apiRequest<{ message: string }>(`/announcements/${id}`, {
            method: 'DELETE',
        });
    }
};
