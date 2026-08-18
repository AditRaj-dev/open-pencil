---
title: GradientEditorStop
description: State e Actions di un Gradient stop.
---

<script setup lang="ts">
import { data } from '#docs-api/components/gradient-editor-stop.data'
</script>

# GradientEditorStop

`GradientEditorStop` fornisce Position, Opacity, Color e Active state di un Gradient stop, oltre alle Actions per aggiornarlo ed eliminarlo.

```vue
<GradientEditorStop :stop="stop" :index="index" :active="active" v-slot="ctx">
  <MyGradientStopRow v-bind="ctx" />
</GradientEditorStop>
```

<SdkComponentAPI :components="data.components" />

## Vedi anche

- [GradientEditorRoot](./gradient-editor-root)
- [GradientEditorBar](./gradient-editor-bar)
