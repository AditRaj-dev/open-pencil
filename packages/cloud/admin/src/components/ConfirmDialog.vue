<script setup lang="ts">
import { ref } from 'vue'
const open = defineModel<boolean>('open', { required: true })
const {
  title,
  description,
  confirmLabel,
  requireReason = false
} = defineProps<{
  title: string
  description: string
  confirmLabel: string
  requireReason?: boolean
}>()
const emit = defineEmits<{ confirm: [reason: string | undefined] }>()
const reason = ref('')
function confirm() {
  if (requireReason && !reason.value.trim()) return
  emit('confirm', reason.value.trim() || undefined)
  open.value = false
  reason.value = ''
}
</script>
<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    role="presentation"
    @click.self="open = false"
  >
    <section
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${title}-title`"
      class="border-cloud-line bg-cloud-panel w-full max-w-md rounded-2xl border p-6"
    >
      <h2 :id="`${title}-title`" class="text-xl font-semibold">{{ title }}</h2>
      <p class="text-sm text-cloud-muted">{{ description }}</p>
      <label v-if="requireReason" class="mt-4 grid gap-1 text-sm"
        >Reason<textarea
          v-model="reason"
          rows="3"
          class="border-cloud-line bg-cloud-bg rounded-lg border px-3 py-2"
        />
      </label>
      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-lg bg-white/10 px-3 py-2" @click="open = false">Cancel</button
        ><button
          :disabled="requireReason && !reason.trim()"
          class="rounded-lg bg-cloud-danger px-3 py-2 disabled:opacity-50"
          @click="confirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>
