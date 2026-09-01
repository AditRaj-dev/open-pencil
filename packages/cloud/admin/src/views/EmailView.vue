<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type EmailMessage } from '#admin/api/client'
const messages = ref<EmailMessage[]>([])
async function load() {
  messages.value = (await cloudAdminAPI.email()).messages
}
async function retry(message: EmailMessage) {
  await cloudAdminAPI.retryEmail(message.id)
  await load()
}
onMounted(load)
</script>
<template>
  <section>
    <h1 class="text-2xl font-semibold">Email</h1>
    <p class="text-sm text-cloud-muted">
      Transport acceptance and retry state. Sensitive payloads are never displayed.
    </p>
    <div class="mt-6 grid gap-3">
      <article
        v-for="message in messages"
        :key="message.id"
        class="border-cloud-line bg-cloud-panel rounded-xl border p-4"
      >
        <div class="flex justify-between">
          <strong>{{ message.kind }}</strong
          ><span>{{ message.status }}</span>
        </div>
        <div class="mt-1 text-sm text-cloud-muted">
          {{ message.recipientEmailNormalized }} · {{ message.attemptCount }} attempts ·
          {{ message.lastErrorCode ?? 'no error' }}
        </div>
        <button
          v-if="message.status === 'failed'"
          class="mt-3 rounded bg-white/10 px-2 py-1 text-sm"
          @click="retry(message)"
        >
          Retry
        </button>
      </article>
    </div>
  </section>
</template>
