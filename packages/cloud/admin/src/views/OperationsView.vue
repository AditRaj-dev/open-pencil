<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type Operations } from '#admin/api/client'
const state = ref<Operations | null>(null)
onMounted(async () => (state.value = await cloudAdminAPI.operations()))
</script>
<template>
  <section>
    <h1 class="text-2xl font-semibold">Operations</h1>
    <div v-if="state" class="mt-6 grid gap-3 sm:grid-cols-3">
      <article
        v-for="[label, value] in Object.entries(state)"
        :key="label"
        class="border-cloud-line bg-cloud-panel rounded-xl border p-4"
      >
        <div class="text-xs uppercase text-cloud-muted">{{ label }}</div>
        <div class="mt-2 text-xl">{{ value }}</div>
      </article>
    </div>
  </section>
</template>
