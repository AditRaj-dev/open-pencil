---
layout: doc
title: AI e automazione
description: Automatizzare OpenPencil con AI Chat, CLI, JSX, MCP e APIs.
---

# AI e automazione

OpenPencil tratta i file di design come dati strutturati. Le operazioni dell’editor — creare Shapes, modificare Fills, configurare Auto layout o esportare Assets — sono disponibili anche da CLI, AI agents e APIs.

Interfaccia e automazione usano lo stesso Core. Un’operazione si comporta quindi allo stesso modo se avviata dalla UI, da uno Script o da un Agent.

## AI Chat

L’Assistant integrato può eseguire più di 90 Tools. Un’istruzione può modificare le Shadows di più Buttons, creare un Component con Dark variant oppure esportare tutti i Frames di una Page a Scale 2×.

[AI Chat →](./ai-chat)

## Collaboration

OpenPencil sincronizza i documenti P2P tramite WebRTC. È sufficiente condividere il Room link; non servono account o server centrale. Live cursors e Follow mode mostrano gli altri partecipanti. Yjs CRDT unisce le modifiche simultanee.

[Collaboration →](./collaboration)

## JSX renderer

Una UI può essere descritta in modo dichiarativo con JSX. Una singola chiamata crea un Tree completo di Frames, Text, Auto layout, Fills e Strokes.

Nella direzione opposta, OpenPencil esporta una Selection come JSX oppure HTML con Tailwind classes. Il risultato può diventare la base per Implementation, Code review o un ulteriore passaggio AI.

[JSX renderer →](./jsx-renderer)

## CLI

La CLI esamina, esporta e analizza file `.fig` senza aprire l’editor. Elenca Pages e Nodes, cerca oggetti, estrae Design tokens e renderizza PNG. Per l’automazione offre JSON output.

Tramite RPC può anche controllare il documento aperto nell’applicazione desktop.

[Esaminare file](./cli/inspecting) · [Export](./cli/exporting) · [Analizzare design](./cli/analyzing) · [Scripts](./cli/scripting)

## Server MCP

Claude Code, Cursor, Windsurf e altri MCP clients possono usare gli stessi 90 Tools di AI Chat. Il server supporta stdio e HTTP con Sessions.

[Server MCP →](/programmable/mcp-server)

## Piattaforma aperta

OpenPencil è pubblicato con licenza MIT, salva i documenti localmente e fornisce accesso programmatico alle proprie operazioni. I file `.fig` possono essere esaminati, trasformati, elaborati nella CI o forniti come Context a un LLM senza dipendere da uno specifico Hosting provider.
