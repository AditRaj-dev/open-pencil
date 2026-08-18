---
title: useVariablesEditor
description: Preparare lo State di un Variables dialog e TanStack Table.
---

# useVariablesEditor

`useVariablesEditor()` collega Dialog state, Table columns, integrazione TanStack Vue Table e Functions per Collections e Modes.

```ts
const variables = useVariablesEditor({
  colorInput: ColorInput,
  icons,
  fallbackIcon,
  deleteIcon,
})
```

Il risultato include il Low-level state di Dialog e Table, oltre a `columns`, `table` e `hasCollections`.

Usalo quando un singolo composable deve fornire Table integration e Action handlers.

## Vedi anche

- [Riferimento API](../)
