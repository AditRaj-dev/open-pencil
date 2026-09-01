<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type CloudUser } from '#admin/api/client'
const users = ref<CloudUser[]>([])
const search = ref('')
async function load() {
  users.value = (await cloudAdminAPI.users(search.value || undefined)).users
}
async function action(user: CloudUser, name: 'ban' | 'unban' | 'revoke-sessions') {
  await cloudAdminAPI.userAction(name, user.id)
  await load()
}
onMounted(load)
</script>
<template>
  <section>
    <h1 class="text-2xl font-semibold">Users</h1>
    <form class="my-5 flex gap-2" @submit.prevent="load">
      <input
        v-model="search"
        placeholder="Search email"
        class="border-cloud-line bg-cloud-panel rounded-lg border px-3 py-2"
      /><button class="rounded-lg bg-white/10 px-3">Search</button>
    </form>
    <div class="grid gap-3">
      <article
        v-for="user in users"
        :key="user.id"
        class="border-cloud-line bg-cloud-panel flex items-center justify-between rounded-xl border p-4"
      >
        <div>
          <div>{{ user.name }}</div>
          <div class="text-sm text-cloud-muted">{{ user.email }} · {{ user.role ?? 'user' }}</div>
        </div>
        <div class="space-x-2">
          <button class="rounded bg-white/10 px-2 py-1" @click="action(user, 'revoke-sessions')">
            Revoke sessions</button
          ><button
            v-if="user.banned"
            class="rounded bg-white/10 px-2 py-1"
            @click="action(user, 'unban')"
          >
            Unban</button
          ><button
            v-else
            class="rounded bg-cloud-danger/20 px-2 py-1 text-cloud-danger"
            @click="action(user, 'ban')"
          >
            Ban
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
