---
title: useEditor
description: Accedere all’istanza OpenPencil fornita da provideEditor.
---

# useEditor

`useEditor()` restituisce l’istanza Editor del Context `provideEditor()` più vicino.

Composables e Headless components lo usano come accesso principale all’Editor.

## Utilizzo

```ts
import { useEditor } from '@open-pencil/vue'
const editor = useEditor()
```

Chiamalo in un Component tree dove è stato eseguito `provideEditor(editor)`.

## Selection

```ts
const selected = editor.getSelectedNodes()
```

## Actions

```ts
editor.zoomToFit()
editor.undoAction()
```

## Context assente

Fuori da un Provider tree valido, la Function genera un errore chiaro, così un’integrazione incompleta dell’Editor viene rilevata subito.

## Vedi anche

- [provideEditor](./provide-editor)
- [useCanvas](./use-canvas)
- [useSelectionState](./use-selection-state)
- [useEditorCommands](./use-editor-commands)

## Tipo

```ts
function useEditor(): Editor
```
