---
title: PropertyListRoot
description: Controlled list per Fills, Strokes, Effects e altre Array properties.
---

<script setup lang="ts">
import { data } from '#docs-api/components/property-list.data'
</script>

# PropertyListRoot

`PropertyListRoot` coordina un’interfaccia per Properties memorizzate come Array, per esempio Fills, Strokes ed Effects. Riceve Values e Mixed state tramite Props ed emette le modifiche.

```vue
<script setup lang="ts">
import { PropertyListRoot, useEditorPropertyList } from '@open-pencil/vue'
const fills = useEditorPropertyList('fills')
</script>

<template>
  <PropertyListRoot
    prop-key="fills"
    :items="fills.items.value"
    :mixed="fills.isMixed.value"
    @add="fills.actions.add"
    @remove="fills.actions.remove"
    v-slot="{ items, actions }"
  >
    <button v-for="(_, index) in items" :key="index" @click="actions.remove(index)">Rimuovi</button>
  </PropertyListRoot>
</template>
```

<SdkComponentAPI :components="data.components" />
