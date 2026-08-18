---
title: Modificare Vectors
description: Modificare Anchors, Bezier handles e Segments e usare Pen tool in Edit mode.
---

# Modificare Vectors

Vector edit mode modifica la geometria di un Path: Position degli Anchors, forma dei Segments e Bezier handles. Non trasforma l’intero oggetto, ma il Path stesso.

## Aprire Edit mode

1. Seleziona un Vector object con Select tool.
2. Fai Double-click sulla Curve.

Premi <kbd>Escape</kbd> o cambia contesto per uscire.

## Comportamento

- Il normale Transform bounding box viene nascosto.
- Anchors, Segments e Handles possono essere selezionati e modificati.
- Gli angoli del Bounding box non attivano Resize o Rotation.

## Operazioni di base

### Spostare un Anchor

Trascina l’Anchor. I Segments collegati e la forma del Path vengono aggiornati durante il Drag.

### Modificare un Bezier handle

Trascina l’Handle di un Anchor. Il comportamento dipende dalla sua Handle composition corrente.

## Modifiers

| Comportamento | macOS | Windows / Linux |
|---------------|-------|-----------------|
| Continuous | <kbd>Cmd</kbd> + Drag | <kbd>Ctrl</kbd> + Drag |
| Corner, Handles indipendenti | <kbd>Option</kbd> + Drag | <kbd>Alt</kbd> + Drag |
| Mantieni Direction, modifica solo Length | <kbd>Shift</kbd> + Drag | <kbd>Shift</kbd> + Drag |

### Continuous

Con <kbd>Cmd</kbd> o <kbd>Ctrl</kbd>, l’Active handle rimane allineato all’Handle opposto. Cambia solo la sua Length e la Curve mantiene una transizione fluida.

### Corner

Con <kbd>Option</kbd> o <kbd>Alt</kbd>, l’Active handle viene modificato indipendentemente. L’Handle opposto resta fermo, consentendo un Corner netto.

### Mantieni Direction

Per Anchors con Composition **Continuous** o **Symmetric**, <kbd>Shift</kbd> conserva la Direction presente prima del Drag. Cambia solo la Length di uno o due Handles, in base alla Composition.

## Bend tramite Drag dell’Anchor

Quando un Anchor viene trascinato con <kbd>Cmd</kbd> o <kbd>Ctrl</kbd>, OpenPencil sceglie il Target handle in base alla Direction del Segment collegato, non alla distanza dal punto vicino.

Questo comportamento funziona anche sugli Anchors ramificati di un Vector network. Dopo la scelta, lo stesso Target handle resta attivo fino alla fine del Drag.

## Pen tool in Edit mode

Con Pen tool attivo:

- Click su un Segment inserisce un Anchor e divide il Segment;
- Click sull’Endpoint di un Path aperto riprende il disegno;
- <kbd>Option</kbd>/<kbd>Alt</kbd> + Click elimina un Anchor se la Topology lo consente.

Consulta [Pen tool](./pen-tool) per creare e chiudere Paths.

## Esempio

1. Disegna uno Shape con Pen tool.
2. Apri la Curve con Double-click.
3. Sposta gli Anchors per regolare il profilo.
4. Modifica gli Handles con <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>, <kbd>Option</kbd>/<kbd>Alt</kbd> o <kbd>Shift</kbd>.
5. Premi <kbd>Escape</kbd>.
