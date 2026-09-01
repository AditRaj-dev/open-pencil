import { groupBy } from 'es-toolkit/array'
import Fuse from 'fuse.js'
import { computed, ref, type MaybeRefOrGetter, toValue } from 'vue'

import type { CommandPaletteGroup, CommandPaletteItem, UseCommandPaletteOptions } from './types'

function searchItems(
  items: CommandPaletteItem[],
  query: string,
  resultLimit: number
): CommandPaletteItem[] {
  if (!query) return items.slice(0, resultLimit)

  return new Fuse(items, {
    keys: ['label', 'description', 'keywords'],
    threshold: 0.35,
    ignoreLocation: true
  })
    .search(query)
    .slice(0, resultLimit)
    .map((result) => result.item)
}

function filterGroups(
  groups: CommandPaletteGroup[],
  results: CommandPaletteItem[]
): CommandPaletteGroup[] {
  const resultSet = new Set(results)
  const itemsWithGroups = groups.flatMap((group) =>
    group.items.filter((item) => resultSet.has(item)).map((item) => ({ groupId: group.id, item }))
  )
  const groupedResults = groupBy(itemsWithGroups, ({ groupId }) => groupId)

  return groups
    .map((group) => ({
      ...group,
      items: groupedResults[group.id]?.map(({ item }) => item) ?? []
    }))
    .filter((group) => group.items.length > 0)
}

export function useCommandPalette(options: MaybeRefOrGetter<UseCommandPaletteOptions>) {
  const open = ref(false)
  const searchTerm = ref('')
  const selectedId = ref<string>()

  const groups = computed(() => toValue(options).groups)
  const resultLimit = computed(() => toValue(options).resultLimit ?? 12)
  const items = computed(() => groups.value.flatMap((group) => group.items))

  const filteredGroups = computed<CommandPaletteGroup[]>(() => {
    const results = searchItems(items.value, searchTerm.value.trim(), resultLimit.value)
    return filterGroups(groups.value, results)
  })

  function close() {
    open.value = false
    searchTerm.value = ''
    selectedId.value = undefined
  }

  function select(item: CommandPaletteItem) {
    if (item.disabled) return
    if (item.children?.length) return
    selectedId.value = item.id
    item.onSelect?.()
    close()
  }

  return { open, searchTerm, selectedId, filteredGroups, close, select }
}
