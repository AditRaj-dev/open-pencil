<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type Enrollment } from '#admin/api/client'
const records = ref<Enrollment[]>([])
const loading = ref(true)
async function load() {
  loading.value = true
  records.value = (await cloudAdminAPI.enrollments()).enrollments
  loading.value = false
}
async function review(record: Enrollment, action: 'approve' | 'reject' | 'revoke') {
  await cloudAdminAPI.reviewEnrollment(record.id, action)
  await load()
}
onMounted(load)
</script>
<template>
  <section>
    <h1 class="text-2xl font-semibold">Enrollment</h1>
    <p class="text-sm text-cloud-muted">
      Review access requests. Approval controls account provisioning.
    </p>
    <div class="mt-6 overflow-hidden rounded-xl border border-cloud-line">
      <table class="w-full text-left text-sm">
        <thead class="bg-white/5 text-cloud-muted">
          <tr>
            <th class="p-3">Email</th>
            <th>Status</th>
            <th>Requested</th>
            <th class="text-right pr-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="p-4">Loading…</td>
          </tr>
          <tr v-for="record in records" :key="record.id" class="border-t border-cloud-line">
            <td class="p-3">
              <div>{{ record.email }}</div>
              <div class="text-xs text-cloud-muted">{{ record.name }}</div>
            </td>
            <td>{{ record.status }}</td>
            <td>{{ new Date(record.requestedAt).toLocaleString() }}</td>
            <td class="space-x-2 pr-3 text-right">
              <button
                v-if="record.status !== 'approved'"
                class="rounded bg-cloud-brand px-2 py-1"
                @click="review(record, 'approve')"
              >
                Approve</button
              ><button
                v-if="record.status === 'pending'"
                class="rounded bg-white/10 px-2 py-1"
                @click="review(record, 'reject')"
              >
                Reject</button
              ><button
                v-if="record.status === 'approved'"
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
