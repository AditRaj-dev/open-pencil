---
title: ColorPickerRoot
description: Headless component per creare un Color picker.
---

<script setup lang="ts">
import { data } from '#docs-api/components/color-picker-root.data'
</script>

# ColorPickerRoot

`ColorPickerRoot` fornisce gli Slots necessari a un Color picker: `trigger` con Style del Color swatch, un Default trigger e `default` con `color` e `update()`.

```vue
<ColorPickerRoot :color="color" @update="color = $event">
  <template #trigger="{ style }"><button :style="style" /></template>
  <template #default="{ color, update }">
    <MyColorEditor :color="color" @change="update" />
  </template>
</ColorPickerRoot>
```

<SdkComponentAPI :components="data.components" />

## Vedi anche

- [ColorInputRoot](./color-input-root)
