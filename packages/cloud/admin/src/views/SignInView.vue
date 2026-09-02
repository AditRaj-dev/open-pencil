<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { signIn } from '#admin/auth'
const error = ref('')
const busy = ref(false)
const loading = ref(true)
const providers = ref<Array<'google' | 'apple'>>([])
onMounted(async () => {
  try {
    const response = await fetch('/.well-known/openpencil')
    if (!response.ok) throw new Error('Cloud discovery request failed')
    const discovery = (await response.json()) as {
      authentication: { socialProviders: Array<'google' | 'apple'> }
    }
    providers.value = discovery.authentication.socialProviders
  } catch {
    error.value = 'Cloud discovery is unavailable.'
  } finally {
    loading.value = false
  }
})
async function start(provider: 'google' | 'apple') {
  busy.value = true
  error.value = ''
  try {
    await signIn(provider)
  } catch {
    error.value = 'Unable to start sign in.'
    busy.value = false
  }
}
</script>
<template>
  <main class="grid min-h-screen place-items-center p-6">
    <section class="border-cloud-line bg-cloud-panel w-full max-w-md rounded-2xl border p-8">
      <p class="text-sm font-medium text-cloud-brand">OpenPencil Cloud</p>
      <h1 class="text-3xl font-semibold">Admin sign in</h1>
      <p class="text-sm leading-6 text-cloud-muted">
        Use an approved deployment-administrator account.
      </p>
      <p v-if="loading" class="text-sm text-cloud-muted">Loading sign-in providers…</p>
      <div v-else-if="providers.length" class="mt-6 grid gap-3">
        <button
          v-for="provider in providers"
          :key="provider"
          :disabled="busy"
          class="rounded-lg bg-white px-4 py-2.5 font-medium text-black"
          @click="start(provider)"
        >
          Continue with {{ provider === 'google' ? 'Google' : 'Apple' }}
        </button>
      </div>
      <p v-else-if="!error" role="alert" class="mt-4 text-sm text-cloud-danger">
        No social sign-in provider is configured for this Cloud instance.
      </p>
      <p v-if="error" role="alert" class="mt-4 text-sm text-cloud-danger">{{ error }}</p>
    </section>
  </main>
</template>
