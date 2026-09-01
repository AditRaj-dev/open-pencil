<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type AuditEvent } from '#admin/api/client'
const events = ref<AuditEvent[]>([])
onMounted(async () => (events.value = (await cloudAdminAPI.audit()).events))
</script>
<template>
  <section>
    <h1 class="text-2xl font-semibold">Audit</h1>
    <div class="mt-6 grid gap-2">
      <article
        v-for="event in events"
        :key="event.id"
        class="border-cloud-line border-b py-3 text-sm"
      >
        <strong>{{ event.action }}</strong
        ><span class="ml-2 text-cloud-muted"
          >{{ event.subjectType }} {{ event.subjectId }} ·
          {{ new Date(event.createdAt).toLocaleString() }}</span
        >
      </article>
    </div>
  </section>
</template>
