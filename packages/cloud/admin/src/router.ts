import { loadAdminSession } from '#admin/auth'
import AdminShell from '#admin/components/AdminShell.vue'
import JoinView from '#admin/views/JoinView.vue'
import SignInView from '#admin/views/SignInView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/join', component: JoinView },
  { path: '/admin/sign-in', component: SignInView },
  {
    path: '/admin',
    component: AdminShell,
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/enrollment' },
      { path: 'enrollment', component: () => import('#admin/views/EnrollmentView.vue') },
      { path: 'users', component: () => import('#admin/views/UsersView.vue') },
      { path: 'email', component: () => import('#admin/views/EmailView.vue') },
      { path: 'audit', component: () => import('#admin/views/AuditView.vue') },
      { path: 'operations', component: () => import('#admin/views/OperationsView.vue') }
    ]
  }
]

export const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach(async (to) => {
  if (!to.matched.some((record) => record.meta.requiresAdmin)) return true
  return (await loadAdminSession()) ? true : '/admin/sign-in'
})
