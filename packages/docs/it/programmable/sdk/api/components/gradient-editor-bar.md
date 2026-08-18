---
title: GradientEditorBar
description: Gradient bar interattivo per selezionare e trascinare Stops.
---

# GradientEditorBar

`GradientEditorBar` fornisce State e Pointer handlers per renderizzare un Gradient bar. Il Component gestisce Selection e Drag degli Stops.

```vue
<GradientEditorBar
  :stops="stops"
  :active-stop-index="activeStopIndex"
  :bar-background="barBackground"
  @select-stop="selectStop"
  @drag-stop="dragStop"
  v-slot="ctx"
>
  <MyGradientBar v-bind="ctx" />
</GradientEditorBar>
```

## Vedi anche

- [GradientEditorRoot](./gradient-editor-root)
- [GradientEditorStop](./gradient-editor-stop)
