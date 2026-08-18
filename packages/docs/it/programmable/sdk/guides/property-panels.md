---
title: Pannelli Properties
description: Creare pannelli Properties con composables e Headless list components.
---

# Pannelli Properties

`@open-pencil/vue` fornisce principalmente composables per i pannelli Properties.

Se un pannello usa Values calcolati dalla Selection e Actions per modificarli, scegli un composable. Per una Structure riutilizzabile di Array o List, usa un Headless component come `PropertyListRoot`.

## Composables

Per le sezioni comuni:

- `usePosition()`
- `useLayout()`
- `useAppearance()`
- `useTypography()`
- `useExport()`

Per le Array properties:

- `useFillControls()`
- `useStrokeControls()`
- `useEffectsControls()`

## Variable bindings

Quando un Field può essere collegato a una Variable o a un Design token esterno, inseriscilo in `BindableValueRoot`.

- Fuori dall’editing, mostra il Name della Variable; il Value calcolato può apparire in un Tooltip.
- Il Focus e l’apertura del Variable picker non devono rimuovere un Binding esistente.
- Applica `detach-on-edit`, `readonly-when-bound` oppure `edit-variable` solo dopo una modifica reale.
- È preferibile inserire un’Action esplicita per rimuovere il Binding nel Picker, invece di un Button facile da attivare accidentalmente accanto al Field.
- Raggruppa Binding changes, Detach durante l’editing e Multi-selection updates in una sola Provider batch operation.

L’applicazione OpenPencil mostra il Name della Variable in viola quando il Field è inattivo. All’inizio dell’editing, `NumberField` mostra il Value numerico calcolato. Un’interfaccia personalizzata può presentare lo stesso Headless state in modo diverso.

## Esempio: Position e Size

```vue
<script setup lang="ts">
import { usePosition } from '@open-pencil/vue'

const { x, y, width, height, updateProp, commitProp } = usePosition()
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <input :value="x" @input="updateProp('x', Number(($event.target as HTMLInputElement).value))" />
    <input :value="y" @input="updateProp('y', Number(($event.target as HTMLInputElement).value))" />
    <input :value="width" @input="updateProp('width', Number(($event.target as HTMLInputElement).value))" />
    <input :value="height" @input="updateProp('height', Number(($event.target as HTMLInputElement).value))" />
  </div>
</template>
```

## Esempio: Fills

```vue
<script setup lang="ts">
import {
  PropertyListRoot,
  useEditorPropertyList,
  useFillControls
} from '@open-pencil/vue'

const fillControls = useFillControls()
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
    <div v-for="(fill, index) in items" :key="index">
      {{ fill.type }}
      <button @click="actions.remove(index)">Rimuovi</button>
    </div>

    <button @click="actions.add(fillControls.defaultFill)">Aggiungi Fill</button>
  </PropertyListRoot>
</template>
```

## Scegliere l’API

- Composables per State e Actions.
- Headless structural components quando il lavoro principale è coordinare Lists, Trees o Slots ripetuti.

## Vedi anche

- [usePosition](../api/composables/use-position)
- [useLayout](../api/composables/use-layout)
- [useAppearance](../api/composables/use-appearance)
- [useTypography](../api/composables/use-typography)
- [useFillControls](../api/composables/use-fill-controls)
- [useStrokeControls](../api/composables/use-stroke-controls)
- [useEffectsControls](../api/composables/use-effects-controls)
- [PropertyListRoot](../api/components/property-list-root)
