import { BLACK } from '@open-pencil/core/constants'
import type { Editor } from '@open-pencil/core/editor'
import type { Color, SceneNode } from '@open-pencil/scene-graph'

export interface CanvasLabelPresentation {
  background: Color
  foreground: Color
}

const DEFAULT_LABEL_BACKGROUND: Color = { r: 0.37, g: 0.37, b: 0.37, a: 1 }
const WHITE: Color = { r: 1, g: 1, b: 1, a: 1 }

export function canvasLabelPresentation(
  editor: Editor,
  node: SceneNode | null
): CanvasLabelPresentation {
  const fill = node?.fills[0]
  const background =
    node && fill?.visible
      ? (editor.renderer?.resolveFillColor(fill, 0, node, editor.graph) ?? fill.color)
      : DEFAULT_LABEL_BACKGROUND
  const luminance = 0.299 * background.r + 0.587 * background.g + 0.114 * background.b
  return { background, foreground: luminance > 0.5 ? BLACK : WHITE }
}
