---
title: useCanvas
description: Collegare il CanvasKit renderer a un elemento canvas e a un Editor OpenPencil.
---

# useCanvas

`useCanvas()` collega un’istanza Editor a un elemento `<canvas>`.

Gestisce inizializzazione CanvasKit, creazione della Surface, Rendering, Resize, Rulers opzionali e Callback quando il Renderer è pronto.

## Utilizzo

```ts
import { ref } from 'vue'
import { useCanvas, useEditor } from '@open-pencil/vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const editor = useEditor()
useCanvas(canvasRef, editor)
```

### Nascondere Rulers

```ts
useCanvas(canvasRef, editor, { showRulers: false })
```

### Conservare il Drawing buffer

```ts
useCanvas(canvasRef, editor, { preserveDrawingBuffer: true })
```

## Note

- `useCanvas()` integra il Renderer ed è pensato per Browser environments.
- Gestisce il canvas attivo, non apertura o salvataggio dei file.
- Di solito viene associato a `useCanvasInput()`.

## Tipo

```ts
interface UseCanvasOptions {
  showRulers?: boolean
  preserveDrawingBuffer?: boolean
  onReady?: () => void
}
```
