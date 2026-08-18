---
title: AI Chat
description: AI Assistant integrato con oltre 90 Tools per creare e modificare design.
---

# AI Chat

Premi <kbd>⌘</kbd><kbd>J</kbd> oppure <kbd>Ctrl</kbd><kbd>J</kbd>. L’Assistant può creare Shapes, modificare Styles, configurare Layout, lavorare con Components e analizzare il documento.

## Configurazione

1. Apri AI Chat.
2. Seleziona il Settings icon.
3. Aggiungi un Model e configura Provider, Model ID, Credentials e Capabilities.
4. Salva il Model e assegnalo a **Design agent**.

Puoi salvare più Models e assegnarli separatamente a Design, Reviews, Tasks rapide e Image input. I Models che condividono una Provider connection riutilizzano lo stesso Credential archiviato in modo sicuro.

### Providers

| Provider | Esempi | Configurazione |
|----------|--------|----------------|
| **OpenRouter** | Claude, GPT, Gemini, DeepSeek, Qwen e altri | API key da [openrouter.ai](https://openrouter.ai) |
| **Anthropic** | Claude Sonnet 4.6, Claude Opus 4.6 | API key da [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | GPT-5.3 Codex, GPT-4.1, o3, o4-mini | API key da [platform.openai.com](https://platform.openai.com) |
| **Google AI** | Gemini 3.1 Pro, Gemini 3 Flash | API key da [aistudio.google.dev](https://aistudio.google.dev) |
| **Z.ai** | GLM-5.1, GLM-5, GLM-4.7 e famiglia GLM-4.5 | API key secondo la [documentazione Z.ai](https://docs.z.ai/devpack/quick-start) |
| **MiniMax** | MiniMax M3, M2.7, M2.7-highspeed, M2.5 e M2.1 | API key da [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **OpenAI-compatible** | Endpoint nel formato OpenAI API | Base URL e Key proprie; Completions oppure Responses API |
| **Anthropic-compatible** | Endpoint nel formato Anthropic API | Base URL e Key proprie |

OpenPencil non usa un Backend intermedio per queste connessioni. Le Requests vengono inviate direttamente al Provider. Nel Browser si applicano le relative CORS policies. L’affidabilità degli Streaming tool calls varia anche tra i Model deployments. Consulta [Compatibilità BYOK](/programmable/byok-provider-compatibility) per misurazioni e passaggi di riproduzione.

### Connessioni MCP esterne

Gli ACP agents dell’applicazione desktop possono usare server [Model Context Protocol](https://modelcontextprotocol.io/) remoti e attendibili. In **Settings → MCP connections**, aggiungi uno Streamable HTTP endpoint con Name, salva facoltativamente un Bearer token e abilita la Connection.

Il Token viene conservato nel Credential backend configurato, non nelle normali Settings, e viene risolto solo all’avvio dell’ACP session.

I Remote servers devono usare HTTPS. I Loopback HTTP endpoints sono accettati per lo sviluppo locale. Abilita solo Server attendibili: i loro Tools possono leggere dati esterni o eseguire Actions con le Credentials fornite. Il Design MCP server integrato viene collegato automaticamente e non deve essere aggiunto qui.

## Tools

AI Chat dispone di oltre 90 Tools:

- **Create:** Frames, Shapes, Text, Components e Pages; JSX per Layouts complessi;
- **Style:** Fills, Strokes, Effects, Opacity, Corner radius e Blend modes;
- **Layout:** Auto layout, Grid, Alignment, Spacing e Sizing;
- **Components:** Components, Instances, Component sets e Overrides;
- **Variables:** Variables, Collections, Modes e Fill bindings;
- **Query:** cercare Nodes e XPath selectors, leggere Properties, Pages, Fonts e Selection;
- **Inspect:** `get_jsx`, `diff_jsx` e `describe` per Structure, Role e Design issues;
- **Analyze:** Color palette, Typography, Spacing e Clusters;
- **Export:** PNG, SVG e JSX con Tailwind classes, oltre a `export_image` per la verifica visiva;
- **Vector:** Boolean operations e Path manipulation.

## Verifica visiva

Dopo una modifica, l’Assistant può renderizzare il risultato con `export_image` e confrontarlo con la richiesta. In questo modo rileva errori di Layout, elementi mancanti e Colors errati.

## Esempi

- «Crea una Card con titolo, descrizione e un Button blu.»
- «Usa lo stesso Corner radius per tutti i Buttons di questa Page.»
- «Quali Fonts usa questo file?»
- «Sostituisci il Background del Frame selezionato con un Gradient blu e viola.»
- «Esporta il Frame selezionato come SVG.»
- «Trova tutti gli oggetti di testo con Font size inferiore a 12.»
- «Descrivi la funzione del Component selezionato.»
- «Mostra il JSX di questo Frame.»

## Suggerimenti

- Seleziona gli oggetti prima della richiesta; l’Assistant conosce la Selection.
- Specifica con precisione Colors, Sizes e Positions.
- Un singolo messaggio può modificare più oggetti.
- Le modifiche AI possono essere annullate con Undo.
- Il Layout viene ricalcolato dopo ogni Tool call.
