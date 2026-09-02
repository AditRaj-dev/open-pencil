async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers
  })
  if (response.status === 401 && globalThis.location.pathname !== '/admin/sign-in') {
    globalThis.location.assign('/admin/sign-in')
    throw new Error('Authentication required')
  }
  if (response.status === 403) throw new Error('Deployment administrator access is required')
  if (!response.ok) throw new Error(`Cloud request failed: ${response.status}`)
  return response.json() as Promise<T>
}

export const cloudAdminAPI = {
  requestEnrollment(input: { email: string; name?: string; reason?: string }) {
    return request<{ accepted: true }>('/enrollment/request', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  },
  session() {
    return request<{ user: { userId: string; email: string; name: string } }>('/session')
  },
  enrollments(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return request<{ enrollments: Enrollment[] }>(`/admin/enrollments${query}`)
  },
  reviewEnrollment(id: string, action: 'approve' | 'reject' | 'revoke', note?: string) {
    return request<{ enrollment: Enrollment }>(`/admin/enrollments/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ note })
    })
  },
  users(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return request<{ users: CloudUser[]; total: number }>(`/admin/users${query}`)
  },
  userAction(action: 'ban' | 'unban' | 'revoke-sessions', userId: string, reason?: string) {
    return request<{ ok: true }>(`/admin/users/${action}`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    })
  },
  setAdmin(userId: string, enabled: boolean) {
    return request<{ ok: true }>('/admin/users/set-admin', {
      method: 'POST',
      body: JSON.stringify({ userId, enabled })
    })
  },
  email() {
    return request<{ messages: EmailMessage[] }>('/admin/email')
  },
  retryEmail(id: string) {
    return request<{ ok: true }>(`/admin/email/${id}/retry`, { method: 'POST' })
  },
  audit() {
    return request<{ events: AuditEvent[] }>('/admin/audit')
  },
  operations() {
    return request<Operations>('/admin/operations')
  }
}

export type Enrollment = {
  id: string
  email: string
  name: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'revoked'
  requestedAt: string
  reviewedAt: string | null
  reviewNote: string | null
}
export type CloudUser = {
  id: string
  name: string
  email: string
  role?: string
  banned: boolean | null
}
export type EmailMessage = {
  id: string
  kind: string
  recipientEmailNormalized: string
  status: string
  attemptCount: number
  lastErrorCode: string | null
  createdAt: string
}
export type AuditEvent = {
  id: string
  actorUserId: string
  action: string
  subjectType: string
  subjectId: string
  createdAt: string
}
export type Operations = {
  deployment: string
  enrollmentMode: string
  emailTransport: string
  pendingEnrollment: number
  pendingEmail: number
  failedEmail: number
}
