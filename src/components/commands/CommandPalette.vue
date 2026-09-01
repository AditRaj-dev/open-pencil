<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { CommandPaletteRoot, useCommandMessages } from '@open-pencil/vue'
import { DialogDescription, DialogTitle, VisuallyHidden } from 'reka-ui'

import { useAppMenu } from '@/app/shell/menu/app-menu'
import AppDialogRoot from '@/components/ui/dialog/AppDialogRoot.vue'

const { commandGroups: groups } = useAppMenu()
const commands = useCommandMessages()
const open = defineModel<boolean>('open', { default: false })

function close() {
  open.value = false
}

useEventListener(window, 'keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.code !== 'KeyK')
    return
  event.preventDefault()
  open.value = true
})
</script>

<template>
  <AppDialogRoot
    v-model:open="open"
    size="md"
    :ui="{
      content: 'w-[min(40rem,94vw)] p-0',
      overlay: 'bg-black/40'
    }"
    @escape-key-down="close"
  >
    <VisuallyHidden>
      <DialogTitle>{{ commands.paletteAriaLabel }}</DialogTitle>
      <DialogDescription>{{ commands.paletteDescription }}</DialogDescription>
    </VisuallyHidden>
    <CommandPaletteRoot
      :groups="groups"
      :aria-label="commands.paletteSearchAriaLabel"
      :ui="{
        root: 'flex max-h-[min(70vh,32rem)] flex-col overflow-hidden',
        search:
          'h-8 flex-1 rounded-none border-0 bg-transparent px-0 text-[13px] outline-none placeholder:text-muted',
        content:
          'min-h-0 max-h-[min(56vh,28rem)] overflow-y-auto px-2 pb-2 pt-1 [scrollbar-color:theme(colors.muted)_transparent]',
        label: 'px-2 py-1 text-[11px] font-medium text-muted',
        group: 'mb-2 last:mb-0',
        item: 'mx-0 flex h-8 cursor-pointer items-center gap-2 rounded-md p-1 text-[13px] leading-6 text-surface outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-hover',
        itemIcon: 'flex size-6 shrink-0 items-center justify-center text-muted',
        itemLabel: 'min-w-0 flex-1 truncate',
        shortcut: 'flex shrink-0 items-center gap-1 text-xs text-muted',
        key: 'inline-flex min-w-5 items-center justify-center rounded border border-border bg-panel px-1.5 py-1 font-mono leading-none'
      }"
      @select="open = false"
    >
      <template #item-icon="{ item }">
        <component :is="item.icon" v-if="item.icon" class="size-4" />
      </template>
    </CommandPaletteRoot>
  </AppDialogRoot>
</template>
