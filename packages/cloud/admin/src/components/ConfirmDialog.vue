<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'
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
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/70" />
      <DialogContent
        class="border-cloud-line bg-cloud-panel fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl"
      >
        <DialogTitle class="text-xl font-semibold">{{ title }}</DialogTitle>
        <DialogDescription class="mt-2 text-sm text-cloud-muted">{{
          description
        }}</DialogDescription>
        <label v-if="requireReason" class="mt-4 grid gap-1 text-sm"
          >Reason<textarea
            v-model="reason"
            rows="3"
            class="border-cloud-line bg-cloud-bg rounded-lg border px-3 py-2"
          />
        </label>
        <div class="mt-6 flex justify-end gap-2">
          <DialogClose class="rounded-lg bg-white/10 px-3 py-2">Cancel</DialogClose>
          <button
            :disabled="requireReason && !reason.trim()"
            class="rounded-lg bg-cloud-danger px-3 py-2 disabled:opacity-50"
            @click="confirm"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
