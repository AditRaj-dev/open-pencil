<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type Enrollment } from '#admin/api/client'
const records = ref<Enrollment[]>([])
const loading = ref(true)
const error = ref('')
const busy = ref('')
const status = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    records.value = (await cloudAdminAPI.enrollments(status.value || undefined)).enrollments
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load enrollments'
  } finally {
    loading.value = false
  }
}
async function review(record: Enrollment, action: 'approve' | 'reject' | 'revoke') {
  const note =
    action === 'approve'
      ? undefined
      : (globalThis.prompt('Internal review note (optional)') ?? undefined)
  busy.value = record.id
  try {
    await cloudAdminAPI.reviewEnrollment(record.id, action, note)
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Review failed'
  } finally {
    busy.value = ''
  }
}
onMounted(load)
</script>
<template>
  <section>
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Enrollment</h1>
        <p class="text-sm text-cloud-muted">
          Review access requests. Approval controls account provisioning.
        </p>
      </div>
      <select
        v-model="status"
        aria-label="Filter enrollment status"
        class="border-cloud-line bg-cloud-panel rounded-lg border px-3 py-2"
        @change="load"
      >
        <option value="">All</option>
        <option>pending</option>
        <option>approved</option>
        <option>rejected</option>
        <option>revoked</option>
      </select>
    </div>
    <p v-if="error" role="alert" class="text-sm text-cloud-danger">{{ error }}</p>
    <div class="mt-6 overflow-x-auto rounded-xl border border-cloud-line">
      <table class="w-full min-w-[700px] text-left text-sm">
        <thead class="bg-white/5 text-cloud-muted">
          <tr>
            <th class="p-3">Email</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Reason</th>
            <th class="text-right pr-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="p-4">Loading…</td>
          </tr>
          <tr v-else-if="records.length === 0">
            <td colspan="5" class="p-4 text-cloud-muted">No enrollment requests.</td>
          </tr>
          <tr v-for="record in records" :key="record.id" class="border-t border-cloud-line">
            <td class="p-3">
              <div>{{ record.email }}</div>
              <div class="text-xs text-cloud-muted">{{ record.name }}</div>
            </td>
            <td>{{ record.status }}</td>
            <td>{{ new Date(record.requestedAt).toLocaleString() }}</td>
            <td class="max-w-64 truncate text-cloud-muted">{{ record.reason }}</td>
            <td class="space-x-2 pr-3 text-right">
              <button
                v-if="record.status !== 'approved'"
                :disabled="busy === record.id"
                class="rounded bg-cloud-brand px-2 py-1"
                @click="review(record, 'approve')"
              >
                Approve</button
              ><button
                v-if="record.status === 'pending'"
                :disabled="busy === record.id"
                class="rounded bg-white/10 px-2 py-1"
                @click="review(record, 'reject')"
              >
                Reject</button
              ><button
                v-if="record.status === 'approved'"
                :disabled="busy === record.id"
                class="rounded bg-cloud-danger/20 px-2 py-1 text-cloud-danger"
                @click="review(record, 'revoke')"
              >
                Revoke
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
