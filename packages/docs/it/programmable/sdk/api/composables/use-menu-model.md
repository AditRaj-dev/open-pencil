---
title: useMenuModel
description: Creare modelli di Menu per Application e canvas dall’Editor state.
---

# useMenuModel

`useMenuModel()` crea Menu pronti da renderizzare usando Editor commands e Selection.

```ts
const { appMenu, canvasMenu, selectionLabelMenu } = useMenuModel()
```

- `appMenu` raggruppa Edit, View, Object e Arrange.
- `canvasMenu` include Options dipendenti dallo State, come Move to page.
- `selectionLabelMenu` restituisce Labels Hide/Show e Lock/Unlock appropriati.

## Vedi anche

- [useEditorCommands](./use-editor-commands)
- [useSelectionState](./use-selection-state)
- [useSelectionCapabilities](./use-selection-capabilities)
