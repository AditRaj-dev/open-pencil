---
title: useExport
description: Gestire Scale e Format dell’Export della Selection corrente.
---

# useExport

`useExport()` fornisce State e Actions per Export settings, IDs degli oggetti selezionati, Name del Output file, Scales e Formats disponibili.

```ts
const {
  settings,
  nodeName,
  scales,
  formats,
  addSetting,
  updateScale,
  updateFormat,
} = useExport()

addSetting()
updateScale(0, 2)
updateFormat(0, 'WEBP')
```

## Vedi anche

- [useSelectionState](./use-selection-state)
- [useEditor](./use-editor)
