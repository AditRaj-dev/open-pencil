---
title: useI18n
description: Leggere Labels localizzati di OpenPencil e cambiare il Locale attivo del SDK.
---

# useI18n

`useI18n()` restituisce Translations reattive e Functions per cambiare Locale. Fornisce Labels per Menu, Commands, Tools, Pannelli, Pages e Dialogs e consente di creare un Locale picker personalizzato.

```ts
const {
  menu,
  commands,
  tools,
  panels,
  pages,
  dialogs,
  locale,
  availableLocales,
  localeLabels,
  setLocale,
} = useI18n()
```

Un cambio di Locale aggiorna reattivamente tutti i Translation groups. Il SDK esporta anche una Low-level Locale API.

## Vedi anche

- [useMenuModel](./use-menu-model)
- [Locale API](../advanced/locale-apis)
