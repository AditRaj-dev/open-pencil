<script setup lang="ts">
import {
  ListboxContent,
  ListboxFilter,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxRoot
} from 'reka-ui'
import { useCommandMessages } from '#vue/i18n'
import { useCommandPalette } from './useCommandPalette'
import type { CommandPaletteGroup, CommandPaletteItem, CommandPaletteUI } from './types'

const { groups, ui, placeholder, resultLimit } = defineProps<{
  groups: CommandPaletteGroup[]
  ui?: CommandPaletteUI
  placeholder?: string
  resultLimit?: number
  backLabel?: string
}>()
const emit = defineEmits<{ select: [item: CommandPaletteItem] }>()
const commands = useCommandMessages()
const palette = useCommandPalette(() => ({ groups, resultLimit }))

function select(item: CommandPaletteItem) {
  palette.select(item)
  emit('select', item)
}
</script>

<template>
  <ListboxRoot
    v-model="palette.selectedId.value"
    :class="ui?.root"
    :aria-label="commands.paletteAriaLabel"
  >
    <div v-if="palette.isNested.value" :class="ui?.back">
      <button type="button" @click="palette.navigateBack()">
        {{ backLabel ?? commands.paletteBack }}
      </button>
    </div>
    <ListboxFilter v-model="palette.searchTerm.value" as-child>
      <input
        type="search"
        :value="palette.searchTerm.value"
        :placeholder="placeholder ?? commands.paletteSearchPlaceholder"
        :aria-label="commands.paletteSearchAriaLabel"
        :class="ui?.search"
        autocomplete="off"
        @input="palette.searchTerm.value = ($event.target as HTMLInputElement).value"
      />
    </ListboxFilter>
    <ListboxContent :class="ui?.content">
      <template v-if="palette.filteredGroups.value.length">
        <ListboxGroup
          v-for="group in palette.filteredGroups.value"
          :key="group.id"
          :class="ui?.group"
        >
          <ListboxGroupLabel v-if="group.label" :class="ui?.label">{{
            group.label
          }}</ListboxGroupLabel>
          <template v-for="item in group.items" :key="item.id">
            <button
              v-if="item.children?.length"
              type="button"
              :class="ui?.item"
              :disabled="item.disabled"
              @click="palette.navigate(item)"
            >
              <span :class="ui?.itemIcon"><slot name="item-icon" :item="item" /></span>
              <span :class="ui?.itemLabel">{{ item.label }}</span>
            </button>
            <ListboxItem
              v-else
              :value="item.id"
              :disabled="item.disabled"
              :class="ui?.item"
              @select="select(item)"
            >
              <span :class="ui?.itemIcon"><slot name="item-icon" :item="item" /></span>
              <span :class="ui?.itemLabel">{{ item.label }}</span>
              <span v-if="item.description" :class="ui?.itemDescription">{{
                item.description
              }}</span>
              <span v-if="item.shortcut" :class="ui?.shortcut">
                <kbd v-for="key in item.shortcut.keys" :key="key" :class="ui?.key">{{ key }}</kbd>
              </span>
            </ListboxItem>
          </template>
        </ListboxGroup>
      </template>
      <slot v-else name="empty">{{ commands.paletteNoCommands }}</slot>
    </ListboxContent>
  </ListboxRoot>
</template>
