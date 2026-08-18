---
title: FontPickerRoot
description: Font picker con Search basato su Reka UI Combobox.
---

# FontPickerRoot

`FontPickerRoot` fornisce un Font picker con elenco asincrono di Font families e Search. Usa Reka UI Combobox; Trigger, Search input, Items, Selection indicator ed Empty state possono essere sostituiti tramite Slots.

```vue
<FontPickerRoot v-model="fontFamily" :list-families="listFamilies">
  <template #trigger="{ value }">
    <button class="w-full truncate">{{ value }}</button>
  </template>
</FontPickerRoot>
```

## Vedi anche

- [useTypography](../composables/use-typography)
