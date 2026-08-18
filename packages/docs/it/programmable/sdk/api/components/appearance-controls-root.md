---
title: AppearanceControlsRoot
description: Headless component per Opacity, Visibility e Corner radius.
---

<script setup lang="ts">
import { data } from '#docs-api/components/appearance-controls-root.data'
</script>

# AppearanceControlsRoot

`AppearanceControlsRoot` fornisce tramite Slot l’API restituita da `useAppearance()`.

Fields personalizzati per Opacity, Visibility e Corner radius possono riutilizzare State e Actions del SDK.

<SdkComponentAPI :components="data.components" />

## Vedi anche

- [useAppearance](../composables/use-appearance)
- [Pannelli Properties](../../guides/property-panels)
