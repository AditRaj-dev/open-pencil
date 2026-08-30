import { wcagContrast } from 'culori'

import type { Color } from '@open-pencil/scene-graph'

import { BLACK } from '#core/constants'

const WHITE: Color = { r: 1, g: 1, b: 1, a: 1 }

export function canvasLabelForeground(background: Color): Color {
  const color = { mode: 'rgb' as const, r: background.r, g: background.g, b: background.b }
  const blackContrast = wcagContrast(color, {
    mode: 'rgb',
    r: BLACK.r,
    g: BLACK.g,
    b: BLACK.b
  })
  const whiteContrast = wcagContrast(color, {
    mode: 'rgb',
    r: WHITE.r,
    g: WHITE.g,
    b: WHITE.b
  })
  return blackContrast >= whiteContrast ? BLACK : WHITE
}
