<script setup lang="ts">
import type { ReferenceElement } from 'reka-ui'
import { PopoverContent, PopoverPortal, PopoverRoot } from 'reka-ui'

import { colorToCSS } from '@open-pencil/core/color'
import type { CanvasLabelEdit } from '@open-pencil/vue'

import InlineLabelEditor from '@/components/ui/inline-label-editor/InlineLabelEditor.vue'
import type { CanvasLabelPresentation } from '@/components/canvas/labels/presentation'

const { edit, reference } = defineProps<{
  edit: CanvasLabelEdit | null
  presentation: CanvasLabelPresentation
  reference: ReferenceElement | null
}>()

const emit = defineEmits<{
  update: [value: string]
  commit: []
  cancel: []
}>()
</script>

<template>
  <PopoverRoot :open="!!edit">
    <PopoverPortal>
      <PopoverContent
        v-if="edit && reference"
        :reference="reference"
        side="top"
        align="start"
        :side-offset="6"
        :collision-padding="8"
        :data-label-kind="edit.kind"
        :style="{
          backgroundColor: colorToCSS(presentation.background),
          color: colorToCSS(presentation.foreground)
        }"
        class="z-50 h-6 rounded-[5px] shadow-sm ring-1 ring-accent"
        @open-auto-focus.prevent
        @escape-key-down.prevent="emit('cancel')"
        @pointer-down-outside="emit('commit')"
      >
        <InlineLabelEditor
          :model-value="edit.value"
          label="Layer name"
          @update:model-value="emit('update', $event)"
          @commit="emit('commit')"
          @cancel="emit('cancel')"
        />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
