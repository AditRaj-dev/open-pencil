<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloudAdminAPI, type CloudUser } from '#admin/api/client'
import ConfirmDialog from '#admin/components/ConfirmDialog.vue'
const users = ref<CloudUser[]>([])
const search = ref('')
const error = ref('')
const busy = ref('')
const selected = ref<{ user: CloudUser; action: 'ban' | 'remove-admin' } | null>(null)
async function load() {
  error.value = ''
  try {
    users.value = (await cloudAdminAPI.users(search.value || undefined)).users
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load users'
  }
}
async function action(user: CloudUser, name: 'unban' | 'revoke-sessions') {
  busy.value = user.id
  try {
    await cloudAdminAPI.userAction(name, user.id)
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Action failed'
  } finally {
    busy.value = ''
  }
}
async function makeAdmin(user: CloudUser) {
  busy.value = user.id
  try {
    await cloudAdminAPI.setAdmin(user.id, true)
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Action failed'
  } finally {
    busy.value = ''
  }
}
async function confirm(reason: string | undefined) {
  if (!selected.value) return
  const { user, action: name } = selected.value
  busy.value = user.id
  try {
    if (name === 'ban') await cloudAdminAPI.userAction('ban', user.id, reason)
    else await cloudAdminAPI.setAdmin(user.id, false)
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Action failed'
  } finally {
    busy.value = ''
    selected.value = null
  }
}
onMounted(load)
</script>
<template>
  <section>
    <h1 class="text-2xl font-semibold">Users</h1>
    <form class="my-5 flex gap-2" @submit.prevent="load">
      <input
        v-model="search"
        aria-label="Search users by email"
        placeholder="Search email"
        class="border-cloud-line bg-cloud-panel rounded-lg border px-3 py-2"
      /><button class="rounded-lg bg-white/10 px-3">Search</button>
    </form>
    <p v-if="error" role="alert" class="text-sm text-cloud-danger">{{ error }}</p>
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
          <button
            :disabled="busy === user.id"
            class="rounded bg-white/10 px-2 py-1"
            @click="
              user.role === 'admin'
                ? (selected = { user, action: 'remove-admin' })
                : makeAdmin(user)
            "
          >
            {{ user.role === 'admin' ? 'Remove admin' : 'Make admin' }}</button
          ><button
            :disabled="busy === user.id"
            class="rounded bg-white/10 px-2 py-1"
            @click="action(user, 'revoke-sessions')"
          >
            Revoke sessions</button
          ><button
            v-if="user.banned"
            :disabled="busy === user.id"
            class="rounded bg-white/10 px-2 py-1"
            @click="action(user, 'unban')"
          >
            Unban</button
          ><button
            v-else
            :disabled="busy === user.id"
            class="rounded bg-cloud-danger/20 px-2 py-1 text-cloud-danger"
            @click="selected = { user, action: 'ban' }"
          >
            Ban
          </button>
        </div>
      </article>
    </div>
    <ConfirmDialog
      :open="Boolean(selected)"
      :title="selected?.action === 'ban' ? 'Ban user?' : 'Remove deployment admin?'"
      :description="selected?.user.email ?? ''"
      :confirm-label="selected?.action === 'ban' ? 'Ban' : 'Remove admin'"
      :require-reason="selected?.action === 'ban'"
      @update:open="
        (open) => {
          if (!open) selected = null
        }
      "
      @confirm="confirm"
    />
  </section>
</template>
