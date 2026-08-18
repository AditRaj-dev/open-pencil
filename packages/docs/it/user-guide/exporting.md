---
title: Export
description: Esportare la Selection in PNG, JPG, WEBP o SVG e aprire o salvare file `.fig`.
---

# Export

OpenPencil esporta oggetti come Images o SVG e salva documenti completi nel formato `.fig`.

## Images e SVG

Seleziona un oggetto e apri la sezione Export del pannello Properties.

### Impostazioni

- **Scale:** da 0,5× a 4×; nascosta per SVG perché indipendente dalla risoluzione;
- **Format:** PNG con Background trasparente, JPG con Background bianco, WEBP con Background trasparente oppure SVG;
- più Export settings per oggetto;
- Live preview su Checkerboard background.

### Avviare l’Export

| Metodo | macOS | Windows / Linux |
|--------|-------|-----------------|
| Scorciatoia | <kbd>⇧</kbd><kbd>⌘</kbd><kbd>E</kbd> | <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>E</kbd> |
| Menu contestuale | Right-click → Export… | Right-click → Export… |
| Pannello Properties | Button Export | Button Export |

## Copy as

Il menu contestuale può scrivere la Selection nel Clipboard:

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Copy as text | — | — |
| Copy as SVG | — | — |
| Copy as PNG | <kbd>⇧</kbd><kbd>⌘</kbd><kbd>C</kbd> | <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>C</kbd> |
| Copy as JSX | — | — |

## File `.fig`

OpenPencil usa il formato di Figma. I file salvati sono compressi e contengono una Thumbnail.

### Aprire e salvare

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Open file | <kbd>⌘</kbd><kbd>O</kbd> | <kbd>Ctrl</kbd><kbd>O</kbd> |
| Save | <kbd>⌘</kbd><kbd>S</kbd> | <kbd>Ctrl</kbd><kbd>S</kbd> |
| Save As | <kbd>⇧</kbd><kbd>⌘</kbd><kbd>S</kbd> | <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>S</kbd> |

**Save** sovrascrive il file corrente se OpenPencil dispone ancora del permesso di scrittura. **Save As** apre una finestra per scegliere un altro percorso.

Nel Browser, OpenPencil usa File System Access API quando disponibile in Chrome ed Edge. Gli altri Browsers, incluso Safari, scaricano il file.

### Compatibilità

I file `.fig` esportati possono essere riaperti in OpenPencil e Figma. OpenPencil importa anche i file creati da Figma.

## Suggerimenti

- Usa Scale 2× o 3× per gli schermi ad alta risoluzione.
- JPG usa sempre un Background bianco; scegli PNG o WEBP per mantenere Transparency.
- SVG è adatto all’editing successivo in Code editors o Vector tools.
