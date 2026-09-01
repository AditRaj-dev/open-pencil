import type { InjectionKey, Ref } from 'vue'

import type {
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteLabels,
  CommandPaletteUI
} from './types'

export interface CommandPaletteContext {
  groups: Ref<CommandPaletteGroup[]>
  searchTerm: Ref<string>
  isNested: Ref<boolean>
  labels: CommandPaletteLabels
  ui?: CommandPaletteUI
  navigate: (item: CommandPaletteItem) => boolean
  navigateBack: () => boolean
  select: (item: CommandPaletteItem) => void
}

export const COMMAND_PALETTE_KEY: InjectionKey<CommandPaletteContext> = Symbol('command-palette')
