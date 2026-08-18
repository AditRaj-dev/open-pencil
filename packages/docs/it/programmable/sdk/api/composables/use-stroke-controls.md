---
title: useStrokeControls
description: Gestire Stroke alignment, Sides e Weights nel pannello Properties.
---

# useStrokeControls

`useStrokeControls()` fornisce Options di Stroke alignment, selezione All/Top/Bottom/Left/Right o combinazioni libere, Default value e Functions per Stroke weights indipendenti.

```ts
const { alignOptions, sideOptions, currentAlign, currentSides, selectSide } = useStrokeControls()

strokes.updateAlign('INSIDE', activeNode)
strokes.selectSide('TOP', activeNode)
```

## Vedi anche

- [PropertyListRoot](../components/property-list-root)
