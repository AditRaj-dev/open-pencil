---
title: Auto layout
description: Layout Flex e Grid con Direction, Gap, Padding, Alignment, Child sizing e Grid tracks.
---

# Auto layout

Auto layout distribuisce automaticamente i Children di un Frame. Sono disponibili due modalità:

- **Flex:** Flow orizzontale o verticale;
- **Grid:** Rows e Columns con Tracks configurabili.

## Attivare Auto layout

- Seleziona un Frame e premi <kbd>⇧</kbd><kbd>A</kbd> per attivare o disattivare Auto layout.
- Seleziona più oggetti liberi e usa la stessa scorciatoia per racchiuderli in un nuovo Auto-layout Frame.

OpenPencil ordina prima gli oggetti in base alla loro Position visiva.

## Direction

- **Horizontal:** Children da sinistra a destra.
- **Vertical:** Children dall’alto verso il basso.
- **Wrap:** crea un’altra riga o colonna quando lo spazio termina.

## Spaziatura

### Gap

Gap definisce la distanza tra Children adiacenti.

### Padding

Padding definisce la distanza tra il bordo del Frame e i suoi Children. Può essere comune oppure indipendente per ogni lato.

## Alignment

### Main axis

- **Start:** Children all’inizio dell’Axis.
- **Center:** Children centrati.
- **End:** Children alla fine.
- **Space between:** spazio libero distribuito tra i Children.

### Cross axis

- **Start:** all’inizio del Cross axis.
- **Center:** al centro.
- **End:** alla fine.
- **Stretch:** occupa tutto il Cross axis.

## Child sizing

- **Fixed:** usa Width o Height espliciti;
- **Fill:** occupa lo spazio disponibile;
- **Hug:** adatta la dimensione al contenuto.

La prima modifica reale di Width o Height cambia solo quell’Axis da Hug o Fill a Fixed. Il semplice Focus di un Field non modifica il Sizing mode.

## Riordinare con Drag

I Children di un Auto-layout Frame possono essere spostati tra i Siblings. Un Indicator mostra la nuova Position.

## CSS Grid

Grid distribuisce i Children in Rows e Columns con Track sizes esplicite.

### Attivare Grid

Seleziona un Frame con Auto layout, quindi passa da Flex a Grid nei Layout controls.

### Track sizes

- **fr:** parte proporzionale dello spazio disponibile;
- **px:** dimensione fissa in pixel;
- **auto:** dimensione determinata dal contenuto.

### Row gap e Column gap

La spaziatura orizzontale e verticale tra le Cells può essere configurata separatamente.

### Placement

Per impostazione predefinita, i Children occupano le Cells libere nell’ordine delle Rows. Column start, Row start e Span si configurano nelle Layout properties del Child.

### Export JSX e Tailwind

I Grid layouts vengono esportati in JSX con Tailwind classes, per esempio `grid grid-cols-3`, `gap-x-4 gap-y-2` e `col-start-2 row-span-2`.

## Suggerimenti

- Annida più Auto-layout Frames per Layouts responsive complessi.
- Fill corrisponde approssimativamente a `flex-grow: 1` in molti Flex layouts.
- Grid è adatto a Dashboard, Gallerie, Form e altre strutture bidimensionali.
