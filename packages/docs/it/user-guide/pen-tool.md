---
title: Pen tool
description: Disegnare Vector paths e Bezier curves con Pen tool.
---

# Pen tool

Pen tool crea Vector paths con il modello Vector network compatibile con Figma.

## Attivare

Premi <kbd>P</kbd>.

## Creare Anchors

- Click crea un Corner anchor e un Segment dritto.
- Click e Drag crea un Anchor con Bezier handles.
- Tieni premuto <kbd>Space</kbd> durante il Drag per spostare l’Anchor senza rilasciare il Button.

Ogni Anchor aggiuntivo estende il Path con un nuovo Segment. Una Preview line collega l’ultimo Anchor al Pointer.

## Chiudere un Path

Fai Click sul primo Anchor per chiudere il Path. Un Path chiuso può avere un Fill.

## Path aperto

Premi <kbd>Escape</kbd> per terminare senza chiudere. I Paths aperti vengono visualizzati solo tramite Strokes.

## Vector networks

OpenPencil memorizza i Vectors come Vector networks invece che come semplici elenchi di punti. Questo modello consente Topologies ramificate e salva la geometria in `.fig` senza conversioni.

## Continuare in Edit mode

Con Pen tool attivo:

- Click sull’Endpoint di un Path aperto riprende il disegno;
- Click su un Segment inserisce un Anchor;
- <kbd>Option</kbd>/<kbd>Alt</kbd> + Click elimina un Anchor se la Topology lo consente.

Consulta [Modificare Vectors](./vector-edit) per l’Edit mode.

## Scorciatoie

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Pen tool | <kbd>P</kbd> | <kbd>P</kbd> |
| Termina Path aperto | <kbd>Escape</kbd> | <kbd>Escape</kbd> |

## Suggerimenti

- Un Drag più lungo produce Bezier handles più lunghi.
- Fill, Stroke ed Effects possono essere modificati nel pannello Properties.
