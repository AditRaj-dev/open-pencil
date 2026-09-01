<script setup lang="ts">
import { ref } from 'vue'
import { signIn } from '#admin/auth'
const error = ref('')
const busy = ref(false)
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
      <div class="mt-6 grid gap-3">
        <button
          :disabled="busy"
          class="rounded-lg bg-white px-4 py-2.5 font-medium text-black"
          @click="start('google')"
        >
          Continue with Google</button
        ><button
          :disabled="busy"
          class="rounded-lg bg-white/10 px-4 py-2.5"
          @click="start('apple')"
        >
          Continue with Apple
        </button>
      </div>
      <p v-if="error" role="alert" class="mt-4 text-sm text-cloud-danger">{{ error }}</p>
    </section>
  </main>
</template>
