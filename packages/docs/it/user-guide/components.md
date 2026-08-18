---
title: Components
description: Components riutilizzabili, Instances, Component sets, Overrides e Libraries in OpenPencil.
---

# Components

I Components sono oggetti di design riutilizzabili. Le modifiche al Main component si propagano automaticamente alle sue Instances.

## Esplorare i Components

La scheda **Assets** del pannello sinistro mostra Components locali e Libraries abilitate. Include Search e viste Grid/List. Puoi inserire un Component con Click, <kbd>Enter</kbd> oppure Drag and drop. Le Library revisions scaricate restano disponibili Offline.

## Creare un Component

Seleziona un Frame o Group e premi <kbd>⌥</kbd><kbd>⌘</kbd><kbd>K</kbd>; su Windows e Linux, <kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>K</kbd>. OpenPencil converte l’oggetto in un Component.

I Components mostrano una Label viola con Diamond icon.

## Component sets e Variants

Seleziona almeno due Components e premi <kbd>⇧</kbd><kbd>⌘</kbd><kbd>K</kbd> per creare un Component set con bordo viola tratteggiato.

I Variants possono avere più Dimensions, per esempio `Size=Small`, `State=Hover` e `Theme=Dark`. Non tutte le combinazioni sono obbligatorie. Il Variant in alto a sinistra funge da Default e da Fallback quando un Update non contiene più una corrispondenza esatta.

Il pannello Properties consente di aggiungere, rinominare, ordinare e rimuovere Dimensions e Values. Le combinazioni duplicate non sono consentite.

## Component properties

OpenPencil supporta Properties Text, Boolean visibility e Instance swap. Una Property può essere collegata al Field di un Child. L’Instance può quindi modificare il Value senza separarsi dal Main component. Definitions e Assignments vengono conservati in `.fig`.

## Libraries

Una Library pubblica i Components come Revisions immutabili. In **Assets → Manage libraries → Publish library**, la prima pubblicazione definisce una Library ID permanente e un Name. Ogni Revision può includere solo le modifiche selezionate; le altre restano in sospeso.

Le Libraries abilitate compaiono in Assets insieme ai Components locali. Le loro Definitions sono Read-only nel documento che le utilizza, mentre Instances e Overrides restano modificabili.

La sezione **Updates** confronta l’Instance corrente e quella nuova. L’Update può essere applicato a una Instance, a tutte le Instances di un Asset, alla Page corrente o a tutte le Pages. Le Properties compatibili vengono mantenute. Se manca un Variant, il Fallback viene mostrato prima della conferma. Gli Updates supportano Undo e Redo.

Le Libraries possono essere locali o archiviate tramite uno Storage provider configurato. OpenPencil memorizza nella cache le Revisions scaricate. I Bindings abilitati e le Definitions necessarie vengono materializzati in `.fig`, così il documento può aprirsi anche senza accesso alla Remote library.

## Creare una Instance

Fai Right-click su un Component e scegli **Create instance**. La nuova Instance appare 40 px a destra del Source component.

## Detach instance

Seleziona una Instance e premi <kbd>⌥</kbd><kbd>⌘</kbd><kbd>B</kbd>; su Windows e Linux, <kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>B</kbd>. Diventa un Frame senza collegamento al Component.

## Go to main component

Fai Right-click su una Instance e scegli **Go to main component**. L’editor cambia Page quando necessario e seleziona il Source component.

## Sincronizzazione

Le modifiche al Main component aggiornano:

- Width e Height;
- Fills, Strokes ed Effects;
- Opacity e Corner radii;
- Layout properties;
- Clip content.

## Overrides

Una Instance può sostituire alcune Properties senza perdere il collegamento. Questi Values vengono mantenuti durante la sincronizzazione.

Name, Text, Font size, Font style, Font family e le Properties visuali e di Layout possono essere sostituiti.

Quando si aggiunge un Child al Main component, OpenPencil aggiunge il Child corrispondente alle Instances.

## Selection

Components e Instances si comportano come contenitori chiusi. Un Click seleziona il contenitore; un Double-click permette di entrare e selezionare un Child.

## Aspetto

| Elemento | Aspetto |
|----------|---------|
| Component label | Viola con Diamond icon |
| Instance label | Viola con Diamond icon |
| Bordo del Component set | Viola e tratteggiato |

## Scorciatoie

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Create component | <kbd>⌥</kbd><kbd>⌘</kbd><kbd>K</kbd> | <kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>K</kbd> |
| Create component set | <kbd>⇧</kbd><kbd>⌘</kbd><kbd>K</kbd> | <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>K</kbd> |
| Detach instance | <kbd>⌥</kbd><kbd>⌘</kbd><kbd>B</kbd> | <kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>B</kbd> |

## Suggerimenti

- Modificare Text in una Instance crea un Override.
- I Component sets sono adatti ai Variants, per esempio gli States di un Button.
- Fai Double-click prima di modificare un Child di un Component.
