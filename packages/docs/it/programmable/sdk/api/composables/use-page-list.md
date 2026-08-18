---
title: usePageList
description: Leggere, cambiare, creare, eliminare e rinominare Pages.
---

# usePageList

`usePageList()` fornisce State e Actions per una Page list:

- `pages`
- `currentPageId`
- `switchPage`
- `addPage`
- `deletePage`
- `renamePage`

```ts
const { pages, currentPageId, switchPage, addPage } = usePageList()
switchPage(pageId)
addPage()
```

## Vedi anche

- [PageListRoot](../components/page-list-root)
- [useMenuModel](./use-menu-model)
