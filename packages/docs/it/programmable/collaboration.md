---
title: Collaboration
description: Editing simultaneo P2P tramite WebRTC, senza server centrale.
---

# Collaboration

Più persone possono modificare lo stesso documento contemporaneamente. I Peers si collegano direttamente tramite WebRTC e non serve un account.

## Condividere una Room

1. Apri il Share button in alto a destra.
2. Copia il link `app.openpencil.dev/share/<room-id>`.
3. Invialo agli altri partecipanti.

Chiunque abbia il link può entrare. La Room rimane accessibile finché almeno un partecipante mantiene aperta la Page.

## Dati sincronizzati

- **Documento:** modifiche a Shapes, Text, Properties e Layout;
- **Cursors:** Position, Name e Color di ogni partecipante;
- **Selections:** oggetti selezionati dagli altri Peers.

## Follow mode

Fai Click su un Avatar nella barra superiore per seguire il Viewport di quel Peer. Pan e Zoom si adattano alla sua vista. Un altro Click interrompe Follow mode.

## Funzionamento

WebRTC trasmette i dati del design direttamente tra i Peers. Nessun Application server centrale inoltra le modifiche del documento.

Yjs sincronizza lo State come CRDT e unisce automaticamente le modifiche simultanee. IndexedDB salva lo stato locale, così un Reload della stessa Room può ripristinarlo.

## Suggerimenti

- Collaboration funziona nel Browser e nell’applicazione desktop.
- Le Room IDs vengono generate con valori casuali crittograficamente sicuri. Può entrare solo chi conosce il link.
- Cursors e Presence entries dei Peers disconnessi vengono rimossi automaticamente.
