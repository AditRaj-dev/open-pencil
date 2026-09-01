import { inject } from 'vue'

import { COMMAND_PALETTE_KEY } from './context'

export function useCommandPaletteContext() {
  const context = inject(COMMAND_PALETTE_KEY)
  if (!context) throw new Error('CommandPalette components must be used inside CommandPaletteRoot')
  return context
}
