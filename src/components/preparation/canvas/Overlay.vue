<script setup lang="ts">
import { computed } from 'vue'

import type { EditorPreparation } from '@/app/editor/preparation/types'
import { preparationLabel, preparationPercent } from '@/components/preparation/presentation'

const { preparation } = defineProps<{
  preparation: EditorPreparation
}>()

const label = computed(() => preparationLabel(preparation))
const progressValue = computed(() => preparationPercent(preparation.progress))
</script>

<template>
  <Transition leave-active-class="transition-opacity duration-300" leave-to-class="opacity-0">
    <div
      data-test-id="canvas-loading"
      role="status"
      aria-live="polite"
      :aria-label="label"
      class="absolute inset-0 z-50 flex items-center justify-center bg-canvas"
    >
      <div class="flex w-72 flex-col items-center gap-3 text-center">
        <icon-lucide-pencil-line class="size-8 text-surface opacity-45" />
        <div class="space-y-1">
          <p class="text-sm font-medium text-surface/80">{{ label }}</p>
          <p v-if="preparation.detail" class="truncate text-xs text-surface/45">
            {{ preparation.detail }}
          </p>
        </div>
        <div
          class="h-0.5 w-25 overflow-hidden rounded-full bg-surface/8"
          :role="progressValue === null ? undefined : 'progressbar'"
          :aria-valuemin="progressValue === null ? undefined : 0"
          :aria-valuemax="progressValue === null ? undefined : 100"
          :aria-valuenow="progressValue ?? undefined"
        >
          <div
            v-if="progressValue === null"
            class="h-full w-2/5 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-surface/25"
          />
          <div
            v-else
            class="h-full rounded-full bg-surface/35 transition-[width] duration-150"
            :style="{ width: `${progressValue}%` }"
          />
        </div>
        <p v-if="progressValue !== null" class="text-xs tabular-nums text-surface/45">
          {{ preparation.progress?.completed }} of {{ preparation.progress?.total }}
        </p>
      </div>
    </div>
  </Transition>
</template>
