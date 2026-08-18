---
title: usePosition
description: Leggere e modificare Position, Size, Rotation, Alignment e Flip degli oggetti selezionati.
---

# usePosition

`usePosition()` fornisce `x`, `y`, `width`, `height` e `rotation`, oltre ad Actions per Alignment, Flip, Rotation e Preview/Commit delle Properties numeriche.

```ts
const { x, y, width, height, rotation, updateProp, commitProp } = usePosition()

position.align('horizontal', 'center')
position.flip('horizontal')
position.rotate(90)
```

## Vedi anche

- [useLayout](./use-layout)
- [useAppearance](./use-appearance)
