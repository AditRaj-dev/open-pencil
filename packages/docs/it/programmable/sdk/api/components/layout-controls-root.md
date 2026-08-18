---
title: LayoutControlsRoot
description: Headless component per Auto layout e Sizing.
---

<script setup lang="ts">
import { data } from '#docs-api/components/layout-controls-root.data'
</script>

# LayoutControlsRoot

`LayoutControlsRoot` fornisce tramite Slot l’API restituita da `useLayout()`.

L’applicazione può renderizzare un pannello Auto layout e Sizing personalizzato mentre il SDK fornisce State e Actions.

<SdkComponentAPI :components="data.components" />

## Vedi anche

- [useLayout](../composables/use-layout)
- [Pannelli Properties](../../guides/property-panels)
