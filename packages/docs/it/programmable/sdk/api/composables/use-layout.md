---
title: useLayout
description: Gestire Auto layout, Sizing, Padding, Alignment e Grid tracks.
---

# useLayout

`useLayout()` fornisce State e Actions per Flex o Grid, Width e Height sizing, Padding, Alignment e Grid template tracks.

```ts
const {
  isGrid,
  isFlex,
  widthSizing,
  heightSizing,
  setAxisSizing,
  updateAxisSize,
  commitAxisSize,
} = useLayout()
```

```ts
layout.toggleIndividualPadding()
layout.updateGridTrack('gridTemplateColumns', 0, { sizing: 'FIXED', value: 240 })
layout.addTrack('gridTemplateRows')
layout.setAlignment('CENTER', 'MAX')
```

## Vedi anche

- [usePosition](./use-position)
- [useEditor](./use-editor)
