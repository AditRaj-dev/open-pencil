---
title: PageListRoot
description: Headless component per Pages e Actions di una Page list.
---

# PageListRoot

`PageListRoot` fornisce tramite Slot Pages, ID della Page corrente, informazioni sui Separators e Actions per creare, cambiare, rinominare ed eliminare Pages.

L’applicazione renderizza la List e definisce gli Styles.

```vue
<PageListRoot v-slot="{ pages, currentPageId, switchPage }">
  <button v-for="page in pages" :key="page.id" @click="switchPage(page.id)">
    {{ page.name }}
  </button>
</PageListRoot>
```

## Vedi anche

- [usePageList](../composables/use-page-list)
