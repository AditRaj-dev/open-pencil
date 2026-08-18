---
title: useCanvasInput
description: Collegare Pointer input, Drag, Selection, Resize, Rotation e Tools al canvas.
---

# useCanvasInput

`useCanvasInput()` collega Pointer e Mouse interactions al canvas dell’Editor.

Gestisce Selection, Drag, Resize, Rotation, Pan, Pen tool, Text edit mode e Hit testing che considera il Viewport.

## Utilizzo

```ts
useCanvasInput(
  canvasRef,
  editor,
  hitTestSectionTitle,
  hitTestComponentLabel,
  hitTestFrameTitle,
)
```

Può anche ricevere un Callback con la Position del Pointer nelle Coordinates del canvas.

## Note

Questo Low-level composable è rivolto soprattutto ai Components che contengono il canvas di un’interfaccia di editing personalizzata.

## Vedi anche

- [useCanvas](./use-canvas)
- [useEditor](./use-editor)
