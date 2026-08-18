---
title: useAppearance
description: Gestire Visibility, Opacity e Corner radius della Selection corrente.
---

# useAppearance

`useAppearance()` fornisce State e Actions per l’Appearance degli oggetti selezionati: Visibility, Opacity, Corner radius e Corner radii indipendenti.

```ts
const {
  visibilityState,
  opacityPercent,
  cornerRadiusValue,
  toggleVisibility,
  toggleIndependentCorners,
} = useAppearance()
```

```ts
appearance.updateCornerProp('topLeftRadius', 12)
appearance.commitCornerProp('topLeftRadius', 12, 8)
```

## Vedi anche

- [useLayout](./use-layout)
- [useTypography](./use-typography)
