---
title: provideEditor
description: Fornire un’istanza OpenPencil tramite Vue dependency injection.
---

# provideEditor

`provideEditor(editor)` rende l’Editor disponibile a composables e Headless components più in basso nel Vue component tree.

`useEditor()` usa questo Context.

## Utilizzo

```ts
import { provideEditor } from '@open-pencil/vue'

provideEditor(editor)
```

## Esempio

```vue
<script setup lang="ts">
import { provideEditor } from '@open-pencil/vue'
import type { Editor } from '@open-pencil/core/editor'

const props = defineProps<{ editor: Editor }>()
provideEditor(props.editor)
</script>

<template><slot /></template>
```

## Note

Il SDK corrente usa direttamente `provideEditor()` e `useEditor()`. Esempi e messaggi meno recenti citano ancora `OpenPencilProvider`, ma questo Component non fa parte dell’API pubblica corrente.

## Vedi anche

- [useEditor](./use-editor)
