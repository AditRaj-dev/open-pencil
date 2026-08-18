---
title: GradientEditorRoot
description: State e Actions per modificare Gradient stops.
---

# GradientEditorRoot

`GradientEditorRoot` gestisce Active gradient stop, Gradient subtype, creazione/rimozione/aggiornamento degli Stops, Color dell’Active stop e Background del Gradient bar.

```vue
<GradientEditorRoot :fill="fill" @update="fill = $event" v-slot="ctx">
  <MyGradientUI v-bind="ctx" />
</GradientEditorRoot>
```

## Vedi anche

- [GradientEditorBar](./gradient-editor-bar)
- [GradientEditorStop](./gradient-editor-stop)
