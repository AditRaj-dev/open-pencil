---
title: Modificare il testo
description: Creare e modificare testo direttamente nel canvas, applicare Formatting e gestire Fonts.
---

# Modificare il testo

OpenPencil crea oggetti di testo e permette di modificarli direttamente nel canvas con Rich text.

## Creare testo

Premi <kbd>T</kbd> e fai Click nel canvas. Compare un oggetto di testo vuoto con il Caret attivo.

## Edit mode

Double-click su un oggetto di testo apre l’Edit mode. Un Outline blu lo segnala. Fai Click all’esterno per applicare la modifica e uscire.

Il testo viene renderizzato nel canvas senza un Input overlay separato.

## Spostare il Caret

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Carattere precedente/successivo | <kbd>←</kbd>/<kbd>→</kbd> | <kbd>←</kbd>/<kbd>→</kbd> |
| Riga precedente/successiva | <kbd>↑</kbd>/<kbd>↓</kbd> | <kbd>↑</kbd>/<kbd>↓</kbd> |
| Parola precedente/successiva | <kbd>⌥</kbd><kbd>←</kbd>/<kbd>⌥</kbd><kbd>→</kbd> | <kbd>Ctrl</kbd><kbd>←</kbd>/<kbd>Ctrl</kbd><kbd>→</kbd> |
| Inizio/fine riga | <kbd>⌘</kbd><kbd>←</kbd>/<kbd>⌘</kbd><kbd>→</kbd> | <kbd>Home</kbd>/<kbd>End</kbd> |

Tieni premuto <kbd>Shift</kbd> per estendere la Selection.

## Selezionare il testo

- Click posiziona il Caret.
- Drag seleziona un intervallo.
- Double-click seleziona una parola.
- Triple-click seleziona tutto il testo.

## Formatting

Il Formatting viene applicato alla Selection di testo. Senza un intervallo selezionato, modifica lo Style dell’intero oggetto.

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Bold | <kbd>⌘</kbd><kbd>B</kbd> | <kbd>Ctrl</kbd><kbd>B</kbd> |
| Italic | <kbd>⌘</kbd><kbd>I</kbd> | <kbd>Ctrl</kbd><kbd>I</kbd> |
| Underline | <kbd>⌘</kbd><kbd>U</kbd> | <kbd>Ctrl</kbd><kbd>U</kbd> |

Strikethrough è disponibile tramite il Button **S** di Typography. Non ha una scorciatoia perché <kbd>⌘</kbd><kbd>S</kbd> corrisponde a Save. Anche i Buttons **B / I / U / S** modificano il Formatting.

Lo Style viene salvato per carattere. Il nuovo testo inserito tra intervalli con Styles diversi eredita lo Style dell’intervallo precedente.

## Operazioni di editing

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Elimina parola precedente | <kbd>⌥</kbd><kbd>⌫</kbd> | <kbd>Ctrl</kbd> + Backspace |
| Elimina fino all’inizio della riga | <kbd>⌘</kbd><kbd>⌫</kbd> | — |
| Cut | <kbd>⌘</kbd><kbd>X</kbd> | <kbd>Ctrl</kbd><kbd>X</kbd> |
| Copy | <kbd>⌘</kbd><kbd>C</kbd> | <kbd>Ctrl</kbd><kbd>C</kbd> |
| Paste | <kbd>⌘</kbd><kbd>V</kbd> | <kbd>Ctrl</kbd><kbd>V</kbd> |

## Font picker

Il Font picker di Typography consente di:

- filtrare per Name;
- mostrare ogni Family con il proprio Font;
- scorrere elenchi lunghi con Virtual scroll;
- posizionarsi sul Font corrente all’apertura.

## Font style

Gli Styles disponibili dipendono dalla Family, per esempio Regular, Medium, Bold o Black.

## Font sources

- **Predefinito:** Inter viene caricato automaticamente.
- **Applicazione desktop:** System fonts e cataloghi abilitati di Google Fonts, Fontsource, Bunny Fonts e Fontshare.
- **Browser:** Chrome ed Edge consentono di usare System fonts; i cataloghi online richiedono l’applicazione desktop.
- **Fonts scaricati:** l’applicazione conserva le Faces scaricate sullo stesso dispositivo.

## Fonts mancanti

Se una Family o uno Style non può essere caricato, OpenPencil mostra un avviso sopra l’editor invece di presentare il Fallback come fedele al design.

Espandi l’avviso per vedere le Faces interessate e i relativi sostituti. **Select layers** individua gli oggetti di testo. **Retry fonts** avvia un nuovo tentativo dopo la modifica dell’accesso alla rete, dei permessi dei Fonts locali o delle impostazioni dei Providers.

Se manca uno Style, OpenPencil può sintetizzarlo da un’altra Face caricata della stessa Family. Se manca l’intera Family, Inter viene usato come Fallback quando disponibile.

## Suggerimenti

- L’elenco dei Fonts viene precaricato all’avvio.
- Gli IME cinese, giapponese e coreano sono supportati.
- Il Rich-text formatting viene conservato durante apertura e salvataggio dei file `.fig`.
- Consulta [Components](./components) per i Text overrides nelle Instances.
