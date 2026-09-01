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
  const navigation = ref<CommandPaletteGroup[]>()
  const currentGroups = computed(() => navigation.value ?? groups.value)
  const items = computed(() => currentGroups.value.flatMap((group) => group.items))

  const filteredGroups = computed<CommandPaletteGroup[]>(() => {
    const results = searchItems(items.value, searchTerm.value.trim(), resultLimit.value)
    return filterGroups(currentGroups.value, results)
  })

  function close() {
    open.value = false
    searchTerm.value = ''
    navigation.value = undefined
    selectedId.value = undefined
  }

  function navigate(item: CommandPaletteItem) {
    if (!item.children?.length) return false
    navigation.value = [{ id: item.id, label: item.label, items: item.children }]
    searchTerm.value = ''
    selectedId.value = undefined
    return true
  }

  function navigateBack() {
    if (!navigation.value) return false
    navigation.value = undefined
    searchTerm.value = ''
    selectedId.value = undefined
    return true
  }

  function select(item: CommandPaletteItem) {
    if (item.disabled) return
    if (navigate(item)) return
    selectedId.value = item.id
    item.onSelect?.()
    close()
  }

  return {
    open,
    searchTerm,
    selectedId,
    filteredGroups,
    isNested: computed(() => navigation.value !== undefined),
    close,
    navigate,
    navigateBack,
    select
  }
}
