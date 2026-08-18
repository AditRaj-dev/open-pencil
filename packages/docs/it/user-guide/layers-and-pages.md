---
title: Layers e Pages
description: Gestire Layers, Pages e il pannello Properties di OpenPencil.
---

# Layers e Pages

L’interfaccia principale include il pannello Layers a sinistra, il canvas al centro e il pannello Properties a destra. I divisori consentono di ridimensionare i pannelli laterali.

## Pannello Layers

Il pannello Layers rappresenta la gerarchia del documento come Tree.

### Gerarchia

Frames, Groups e Components possono essere espansi per mostrare i Children.

### Ordine e Parent

Trascina una Layer per cambiarne l’ordine o inserirla in un altro contenitore. Le Layers più in alto vengono renderizzate davanti a quelle sottostanti.

### Visibility

L’Eye icon nasconde o mostra una Layer nel canvas.

### Rinominare

Double-click sul Name apre un Input. <kbd>Enter</kbd> o un Click esterno conferma; <kbd>Escape</kbd> annulla.

### Selection

Un Click su una Layer seleziona l’oggetto corrispondente nel canvas. La Selection del canvas viene riflessa anche nel Tree.

## Pages

- Click cambia Page.
- Il Button Add crea una Page.
- Delete elimina la Page corrente.
- Double-click avvia la modifica del Name.

Ogni Page mantiene il proprio Canvas background e Viewport state.

## Pannello Properties

### Design

Mostra le Properties della Selection:

- **Appearance:** Opacity, Corner radius e Visibility;
- **Fill:** Solid colors, Gradients, Images e Variable bindings;
- **Stroke:** Color, Weight, Alignment, Cap, Join e Dash;
- **Effects:** Drop shadow, Inner shadow e Blur;
- **Typography:** Font family, Style, Size e Buttons B/I/U/S;
- **Layout:** controlli di [Auto layout](./auto-layout);
- **Export:** Scale, Format e Action di export.

### Code

Mostra la Selection in JSX con Syntax highlighting e consente l’export HTML con Tailwind CSS v4.

### AI

Apre AI Chat. Può essere attivato anche con <kbd>⌘</kbd><kbd>J</kbd> oppure <kbd>Ctrl</kbd><kbd>J</kbd>.

## Interfaccia mobile

Sugli schermi piccoli, i pannelli laterali vengono sostituiti da un Bottom sheet con schede Layers, Properties, Design e Code.

## Scorciatoia

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Apri o chiudi AI Chat | <kbd>⌘</kbd><kbd>J</kbd> | <kbd>Ctrl</kbd><kbd>J</kbd> |
