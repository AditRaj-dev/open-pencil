---
title: useEffectsControls
description: Gestire Shadows e Blur effects in un pannello Effects.
---

# useEffectsControls

`useEffectsControls()` fornisce Default values, configurazione Shadows/Blur, State degli Items espansi, Preview durante Scrubbing, Commit del Value finale e modifica di Type e Color.

```ts
const { effectOptions, createDefaultEffect, toggleExpand, scrubEffect, commitEffect } = useEffectsControls()

const effect = createDefaultEffect()
scrubEffect(node, index, { radius: 12 })
commitEffect(node, index, { radius: 12 })
```

## Vedi anche

- [PropertyListRoot](../components/property-list-root)
