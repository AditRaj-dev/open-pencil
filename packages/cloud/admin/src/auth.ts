import { createAuthClient } from 'better-auth/client'
import { ref } from 'vue'

export const adminSession = ref<{ id: string; email: string; name: string } | null>(null)

const auth = createAuthClient({
  baseURL: `${globalThis.location.origin}/api/auth`,
  fetchOptions: { credentials: 'include' }
})

export async function loadAdminSession(): Promise<boolean> {
  const result = await auth.getSession()
  if (!result.data?.user) {
    adminSession.value = null
    return false
  }
  adminSession.value = {
    id: result.data.user.id,
    email: result.data.user.email,
    name: result.data.user.name
  }
  return true
}

export async function signIn(provider: 'google' | 'apple'): Promise<void> {
  const callbackURL = `${globalThis.location.origin}/admin/enrollment`
  const result = await auth.signIn.social({
    provider,
    callbackURL,
    errorCallbackURL: `${globalThis.location.origin}/admin/sign-in`,
    disableRedirect: true
  })
  if (result.error || !result.data.url) throw new Error('Unable to start sign in')
  globalThis.location.assign(result.data.url)
}

export async function signOut(): Promise<void> {
  await auth.signOut()
  globalThis.location.assign('/admin/sign-in')
}
