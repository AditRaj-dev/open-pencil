---
title: useSelectionCapabilities
description: Boolean values reattivi per le Actions disponibili con la Selection corrente.
---

# useSelectionCapabilities

`useSelectionCapabilities()` restituisce Boolean values che indicano se le comuni Editor actions sono disponibili. È adatto a Menu, Toolbars, scorciatoie, Action buttons e pannelli dipendenti dal Context.

```ts
const {
  canDelete,
  canDuplicate,
  canCreateComponent,
  canMoveToPage,
  canGoToMainComponent,
  canZoomToSelection,
} = useSelectionCapabilities()
```

## Vedi anche

- [useSelectionState](./use-selection-state)
- [useEditorCommands](./use-editor-commands)
