---
title: useVariables
description: Leggere e modificare collezioni, variabili, modalità e valori.
---

# useVariables

`useVariables()` fornisce stato e azioni di basso livello per un editor di variabili.

Usalo per controllare direttamente collezioni, modalità attive, filtri e operazioni CRUD senza una tabella o finestra già pronta.

```ts
const variables = useVariables()
```

Tra i valori restituiti figurano `collections`, `activeCollection`, `activeModes`, `variables`, `searchTerm` e le azioni per creare, rinominare, eliminare e aggiornare variabili e collezioni.

## Vedi anche

- [useVariablesEditor](../composables/use-variables-editor)
- [useVariablesDialogState](./use-variables-dialog-state)
- [useVariablesTable](./use-variables-table)
