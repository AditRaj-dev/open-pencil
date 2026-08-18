---
title: Variables
description: Design variables, Collections, Modes e Color bindings in OpenPencil.
---

# Variables

Le Variables memorizzano Design tokens riutilizzabili, come Colors e valori di Spacing. Le Properties degli oggetti possono essere collegate alle Variables. Quando una Variable cambia, tutti gli oggetti associati vengono aggiornati.

## Aprire Variables

Quando non è selezionato alcun oggetto, la scheda Design mostra le Page properties. Il Settings icon della sezione Variables apre il Variables dialog.

## Collections

Le Variables sono organizzate in Collections. Ogni Collection compare in una scheda.

- Click cambia Collection.
- Double-click sul Name avvia la modifica del nome.

## Modes

Una Collection può contenere più Modes, per esempio Light e Dark. Vengono mostrati come Columns nella Variables table.

## Modificare Variables

- **Crea:** scegli **Create variable**.
- **Name:** fai Click sulla Name cell.
- **Value:** fai Click sulla Cell del Mode corrispondente.
- **Search:** filtra l’elenco tramite la Search bar.

### Color variables

I Color values si modificano direttamente nella tabella con un Color input e un Picker.

I Types `FLOAT`, `STRING` e `BOOLEAN` esistono nel modello dati, ma non dispongono ancora di una Editing UI completa.

## Bindings di Fill e Stroke

Il Variable picker delle sezioni Fill e Stroke collega una Color variable alla relativa Color property.

- Seleziona una Variable per creare il Binding. Il Field mostra un Badge viola con il Name.
- Rimuovi il Binding tramite l’Action dedicata nel Picker.

Aprire il Field o il Picker non modifica il Binding. Solo una variazione reale del Value può, in base al Control, scollegare il Binding o modificare la Variable stessa.

## Suggerimenti

- Usa Collections per raggruppare Tokens correlati, per esempio `Primitives` per i Colors di base e `Semantic` per i Tokens funzionali.
- I Modes permettono di definire Themes Light e Dark nella stessa Collection.
- Gli Aliases permettono a una Variable di fare riferimento a un’altra Variable, anche in un’altra Collection.
