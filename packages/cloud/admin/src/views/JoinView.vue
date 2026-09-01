<script setup lang="ts">
import { ref } from 'vue'
import { cloudAdminAPI } from '#admin/api/client'
const email = ref('')
const name = ref('')
const reason = ref('')
const sent = ref(false)
const error = ref('')
const busy = ref(false)
async function submit() {
  busy.value = true
  error.value = ''
  try {
    await cloudAdminAPI.requestEnrollment({
      email: email.value,
      name: name.value || undefined,
      reason: reason.value || undefined
    })
    sent.value = true
  } catch {
    error.value = 'Unable to submit your request. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <main class="grid min-h-screen place-items-center p-6">
    <section
      class="border-cloud-line bg-cloud-panel w-full max-w-lg rounded-2xl border p-8 shadow-2xl"
    >
      <p class="mb-2 text-sm font-medium text-cloud-brand">OpenPencil Cloud</p>
      <h1 class="m-0 text-3xl font-semibold">Request access</h1>
      <p class="mt-3 text-sm leading-6 text-cloud-muted">
        Cloud is currently available by approval. Local editing remains available without an
        account.
      </p>
      <div
        v-if="sent"
        class="mt-8 rounded-xl border border-cloud-brand/40 bg-cloud-brand/10 p-4 text-sm"
      >
        Your request was received. We will email you after review.
      </div>
      <form v-else class="mt-8 grid gap-4" @submit.prevent="submit">
        <label class="grid gap-1 text-sm"
          >Email<input
            v-model="email"
            required
            type="email"
            class="border-cloud-line bg-cloud-bg rounded-lg border px-3 py-2"
        /></label>
        <label class="grid gap-1 text-sm"
          >Name <span class="text-cloud-muted">(optional)</span
          ><input
            v-model="name"
            maxlength="120"
            class="border-cloud-line bg-cloud-bg rounded-lg border px-3 py-2"
        /></label>
        <label class="grid gap-1 text-sm"
          >What would you like to use Cloud for? <span class="text-cloud-muted">(optional)</span
          ><textarea
            v-model="reason"
            maxlength="1000"
            rows="4"
            class="border-cloud-line bg-cloud-bg rounded-lg border px-3 py-2"
          />
        </label>
        <p v-if="error" role="alert" class="m-0 text-sm text-cloud-danger">{{ error }}</p>
        <button
          :disabled="busy"
          class="rounded-lg bg-cloud-brand px-4 py-2.5 font-medium disabled:opacity-50"
        >
          {{ busy ? 'Submitting…' : 'Request access' }}
        </button>
      </form>
    </section>
  </main>
</template>
