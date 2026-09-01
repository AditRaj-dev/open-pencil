<script setup lang="ts">
import { signOut } from '#admin/auth'
const links = [
  ['/admin/enrollment', 'Enrollment'],
  ['/admin/users', 'Users'],
  ['/admin/email', 'Email'],
  ['/admin/audit', 'Audit'],
  ['/admin/operations', 'Operations']
] as const
</script>
<template>
  <div class="min-h-screen md:grid md:grid-cols-[220px_1fr]">
    <aside class="border-cloud-line bg-cloud-panel border-r p-5">
      <div class="mb-8 flex items-center justify-between text-sm font-semibold">
        <span>OpenPencil Cloud</span
        ><button class="text-xs text-cloud-muted hover:text-white" @click="signOut">
          Sign out
        </button>
      </div>
      <nav class="flex gap-2 md:flex-col">
        <RouterLink
          v-for="[to, label] in links"
          :key="to"
          :to="to"
          class="rounded-lg px-3 py-2 text-sm text-cloud-muted hover:bg-white/5 hover:text-white"
          active-class="!bg-cloud-brand/15 !text-white"
          >{{ label }}</RouterLink
        >
      </nav>
    </aside>
    <main class="mx-auto w-full max-w-6xl p-6 md:p-10"><RouterView /></main>
  </div>
</template>
