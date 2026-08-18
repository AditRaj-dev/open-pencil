# Compatibilità con Figma

Confronto tra le funzioni di Figma Design e lo stato attuale di OpenPencil.

::: tip Stato
✅ Supportato — funziona completamente · 🟡 Parziale — il comportamento principale esiste, ma mancano alcune funzioni · 🔲 Non implementato
:::

**Copertura:** considerate 94 funzioni su 158 — 76 ✅ complete, 18 🟡 parziali e 64 🔲 assenti. Aggiornato: 2026-03-07.

## Interfaccia e navigazione

| Funzione | Stato | Note |
|----------|-------|------|
| Barra degli strumenti | ✅ | Barra inferiore in stile UI3: Selezione, Frame, Sezione, Rettangolo, Ellisse, Linea, Testo, Mano e Penna |
| Pannello livelli | ✅ | Albero con espansione, trascinamento, visibilità e larghezza regolabile |
| Pannello pagine | ✅ | Creazione, eliminazione e modifica del nome; stato della vista indipendente |
| Pannello proprietà | ✅ | Aspetto, Riempimento, Contorno, Effetti, Tipografia, Layout e Posizione |
| Zoom e spostamento | ✅ | <kbd>Ctrl</kbd> + scorrimento, pizzico, <kbd>⌘</kbd><kbd>+</kbd>/<kbd>−</kbd>, <kbd>⌘</kbd><kbd>0</kbd>, <kbd>⌘</kbd><kbd>1</kbd>, <kbd>⌘</kbd><kbd>2</kbd>, <kbd>Space</kbd> + trascinamento, pulsante centrale e strumento Mano |
| Righelli | ✅ | Righelli superiore e sinistro con intervallo della selezione e coordinate |
| Sfondo del canvas | ✅ | Colore indipendente per ogni pagina |
| Guide | 🔲 | Nessuna guida trascinabile dai righelli |
| Tavolozza dei comandi | 🔲 | Nessuna ricerca rapida delle azioni |
| Menu contestuale | ✅ | Appunti, ordine, gruppi, componenti, visibilità, blocco e spostamento tra pagine |
| Scorciatoie | 🟡 | Comandi principali, componenti, ordine, visibilità e blocco; mancano alcuni strumenti e parte della formattazione del testo |
| Cerca e sostituisci | 🔲 | Nessuna ricerca e sostituzione globale del testo |
| Contorni dei livelli | 🔲 | Nessuna vista wireframe di tutti i livelli |
| Miniatura personalizzata | 🔲 | Generata all’esportazione, ma non personalizzabile |
| Passo di spostamento | 🔲 | Valori 1 px e 10 px; nessun valore personalizzato |
| Menu applicazione | ✅ | File, Modifica, Visualizza, Oggetto, Testo e Disponi nel browser; menu nativi in Tauri |
| Strumenti AI | 🟡 | 90 strumenti tramite provider e server MCP; nessuna generazione immagini o ricerca AI |

## Livelli e forme

| Funzione | Stato | Note |
|----------|-------|------|
| Rettangolo, Ellisse, Linea, Poligono e Stella | ✅ | Forme principali; lati del poligono e raggio interno della stella configurabili |
| Frame | ✅ | Ritaglio del contenuto, sistema di coordinate proprio e modelli di creazione/ridimensionamento simili a Figma |
| Gruppi | ✅ | <kbd>⌘</kbd><kbd>G</kbd> e <kbd>⇧</kbd><kbd>⌘</kbd><kbd>G</kbd> |
| Sezioni | ✅ | Etichette, integrazione automatica degli oggetti sovrapposti e testo adattato alla luminanza |
| Arco | ✅ | `arcData` con angolo iniziale, finale e raggio interno |
| Matita | 🔲 | Nessuno strumento a mano libera |
| Maschere | 🔲 | Nessuna maschera forma per ritagliare i livelli |
| Tipi e gerarchia | ✅ | 17 tipi di oggetto, Map piatta e albero genitore-figlio |
| Selezione | ✅ | Clic, Shift + clic e selezione rettangolare |
| Allineamento e posizione | ✅ | Posizione, rotazione e dimensioni nel pannello proprietà |
| Copia e incolla | ✅ | Appunti standard, binario Kiwi Figma e copia come testo/SVG/PNG/JSX |
| Ridimensionamento proporzionale | 🟡 | Shift conserva le proporzioni; nessuno strumento Scala dedicato |
| Blocco | ✅ | <kbd>⇧</kbd><kbd>⌘</kbd><kbd>L</kbd>; gli oggetti bloccati non sono selezionabili o spostabili nel canvas |
| Visibilità | ✅ | Icona occhio e <kbd>⇧</kbd><kbd>⌘</kbd><kbd>H</kbd> |
| Rinomina | ✅ | Doppio clic nel pannello livelli; Invio, Esc o perdita del focus termina la modifica |
| Primo piano / sfondo | ✅ | ] e [ oltre al menu contestuale |
| Sposta in pagina | ✅ | Spostamento della selezione tra pagine |
| Vincoli | 🔲 | Nessun fissaggio di bordi o centro durante il ridimensionamento del genitore |
| Selezione intelligente | 🔲 | Nessuna distribuzione o allineamento uniforme della selezione multipla |
| Guide layout | 🔲 | Nessuna sovrapposizione di colonne, righe o griglie nei frame |
| Misurazione distanze | 🔲 | Nessuna misura con Alt + passaggio del mouse |
| Modifica multipla | ✅ | Posizione, dimensione, aspetto, riempimento, contorno ed effetti; valori diversi indicati come `Mixed` |
| Oggetti simili | 🔲 | Nessuna ricerca di oggetti corrispondenti |
| Copia proprietà | 🔲 | Nessuna copia di riempimento, contorno o effetti tra livelli |
| Relazioni genitore-figlio | ✅ | Gerarchia completa tramite `parentIndex` e cambio genitore con trascinamento |

## Strumenti vettoriali

| Funzione | Stato | Note |
|----------|-------|------|
| Reti vettoriali | ✅ | Modello compatibile con Figma, non solo percorsi semplici |
| Penna | ✅ | Punti angolari, curve di Bézier e percorsi aperti/chiusi |
| Modifica vettori | 🟡 | Creazione e modifica di base; operazioni avanzate sui vertici limitate |
| Operazioni booleane | 🔲 | Nessuna unione, sottrazione, intersezione o esclusione |
| Appiattimento | 🔲 | Nessuna fusione dei percorsi |
| Converti contorno | 🔲 | Nessuna conversione del contorno in percorso |
| Converti testo | 🔲 | Nessuna conversione del testo in contorni vettoriali |
| Shape builder | 🔲 | Nessuno strumento booleano interattivo |
| Scostamento percorso | 🔲 | Nessuno scostamento interno o esterno |
| Semplificazione | 🔲 | Nessuna riduzione dei punti |

## Testo e tipografia

| Funzione | Stato | Note |
|----------|-------|------|
| Testo e modifica diretta | ✅ | `textarea` nascosta, cursore, selezione, parola, trascinamento, doppio/triplo clic e intervalli di stile |
| Rendering testo | ✅ | CanvasKit Paragraph per composizione, righe e metriche |
| Font di sistema | ✅ | Inter, font-kit in Tauri e `queryLocalFonts` nel browser |
| Famiglia e stile | ✅ | FontPicker con ricerca, scorrimento virtuale e anteprima CSS |
| Dimensione e interlinea | ✅ | Modificabili nella sezione Tipografia |
| Allineamento | 🟡 | Allineamento di base; mancano allineamento verticale e tutte le modalità automatiche |
| Stili testo | 🟡 | Grassetto, corsivo, sottolineato e barrato; nessuno stile riutilizzabile con nome |
| Modalità dimensione testo | 🔲 | Nessuna larghezza automatica, altezza automatica o dimensione fissa |
| Elenchi | 🔲 | Nessun elenco puntato o numerato |
| Collegamenti | 🔲 | Nessun collegamento nel testo |
| Emoji e simboli | 🔲 | Supporto incompleto |
| OpenType | 🔲 | Nessuna legatura, alternativa stilistica o cifra tabellare |
| Font variabili | 🔲 | Nessuna regolazione degli assi |
| CJK | 🔲 | Supporto incompleto per cinese, giapponese e coreano |
| RTL | 🔲 | Nessun layout da destra a sinistra |
| Font icona | 🔲 | Nessuna gestione speciale dei glifi |

## Colori, gradienti e immagini

| Funzione | Stato | Note |
|----------|-------|------|
| Selettore HSV | ✅ | Campo HSV, cursori tonalità e alfa, input esadecimale |
| Riempimenti solidi | ✅ | Colore e opacità |
| Gradiente lineare | ✅ | Punti e maniglie di trasformazione |
| Gradiente radiale | ✅ | Shader CanvasKit |
| Gradiente angolare | ✅ | Sweep/conico |
| Gradiente diamante | ✅ | Gradiente a quattro punti |
| Riempimenti immagine | ✅ | Dati Blob e modalità Riempi, Adatta, Ritaglia e Ripeti |
| Riempimenti a motivo | 🔲 | Nessun motivo ripetuto |
| Metodi di fusione | 🔲 | Nessun metodo di fusione di livelli o riempimenti |
| Immagini e video | 🟡 | Riempimenti visibili; nessuna importazione tramite trascinamento e nessun video |
| Regolazioni immagine | 🔲 | Nessuna esposizione, contrasto o saturazione |
| Ritaglio | 🔲 | Nessun ritaglio interattivo |
| Contagocce | 🔲 | Nessun prelievo del colore dal canvas |
| Colori di selezione mista | 🔲 | Nessuna modifica comune dei colori di una selezione eterogenea |
| Modelli colore | 🟡 | HSV ed Hex; nessuna modalità HSL o RGB |

## Effetti e proprietà

| Funzione | Stato | Note |
|----------|-------|------|
| Ombra esterna | ✅ | Spostamento, sfocatura e colore tramite filtri CanvasKit |
| Ombra interna | ✅ | Ombra interna |
| Sfocatura livello | ✅ | Sfocatura gaussiana |
| Sfocatura sfondo | ✅ | Sfocatura del contenuto dietro l’oggetto |
| Sfocatura primo piano | ✅ | Sfocatura davanti all’oggetto |
| Spessore contorno | ✅ | Configurabile nel pannello proprietà |
| Estremità contorno | ✅ | `NONE`, `ROUND`, `SQUARE`, `ARROW_LINES`, `ARROW_EQUILATERAL` |
| Giunzioni contorno | ✅ | A punta, smussate e tonde |
| Tratteggio | ✅ | Alternanza tratto e spazio |
| Allineamento contorno | ✅ | Interno, centro ed esterno con ritaglio compatibile Figma |
| Spessori per lato | ✅ | Alto, destra, basso e sinistra |
| Raggio angoli | ✅ | Comune o indipendente |
| Smussatura continua | 🔲 | Nessun arrotondamento continuo |
| Più riempimenti/contorni | 🔲 | Nessuna sovrapposizione multipla sullo stesso livello |

## Disposizione automatica

| Funzione | Stato | Note |
|----------|-------|------|
| Flusso orizzontale e verticale | ✅ | Flexbox Yoga WASM |
| <kbd>⇧</kbd><kbd>A</kbd> | ✅ | Attivazione sul frame o avvolgimento della selezione |
| Intervallo | ✅ | Configurabile nelle proprietà |
| Rientri | ✅ | Comuni o separati per quattro lati |
| Distribuzione | ✅ | Inizio, centro, fine e spazio tra |
| Allineamento trasversale | ✅ | Inizio, centro, fine ed estensione |
| Dimensionamento | ✅ | Fisso, Riempi e Adatta per asse |
| A capo | ✅ | Flex wrap |
| Grid | ✅ | CSS Grid tramite variante Yoga: tracce, intervalli e celle estese |
| Flussi annidati | ✅ | Frame annidati con direzioni diverse |
| Riordino | ✅ | Indicatore visivo di inserimento |
| Dimensioni min/max | 🔲 | Nessun vincolo sui figli |

## Componenti e sistemi di design

| Funzione | Stato | Note |
|----------|-------|------|
| Creazione componenti | ✅ | Da frame, gruppo o più oggetti; proprietà testo, visibilità, sostituzione istanza e varianti |
| Set di componenti | ✅ | Varianti multidimensionali incomplete, convalida duplicati e variante in alto a sinistra predefinita |
| Istanze | ✅ | Assets, inserimento, proprietà, override, cambio variante, sincronizzazione e aggiornamenti |
| Varianti | ✅ | Creazione, cambio, combinazioni incomplete e ripiego sulla variante in alto a sinistra |
| Proprietà componente | ✅ | Visibilità booleana, testo e sostituzione istanza |
| Propagazione modifiche | ✅ | Il componente principale aggiorna le istanze preservando gli override |
| Variabili | 🟡 | Interfaccia completa per `COLOR`; `FLOAT`, `STRING` e `BOOLEAN` senza interfaccia di modifica |
| Collezioni e modalità | 🟡 | Collezioni, modalità e `activeMode`; nessuna interfaccia temi basata su variabili |
| Stili | 🔲 | Nessuno stile riutilizzabile con nome |
| Librerie | ✅ | Revisioni locali/remoto immutabili, pubblicazione selettiva, aggiornamenti, uso offline e persistenza `.fig` |
| Separa istanza | ✅ | <kbd>⌥</kbd><kbd>⌘</kbd><kbd>B</kbd> trasforma l’istanza in frame |
| Vai al componente principale | ✅ | Navigazione al componente sorgente anche tra pagine |

## Prototipazione

| Funzione | Stato | Note |
|----------|-------|------|
| Collegamenti | 🔲 | Non supportati |
| Trigger | 🔲 | Clic, passaggio, trascinamento e altri eventi |
| Azioni | 🔲 | Navigazione, sovrapposizione, scorrimento e altre azioni |
| Animazioni | 🔲 | Transizioni e animazioni |
| Smart animate | 🔲 | Nessuna animazione automatica dei livelli corrispondenti |
| Sovrapposizioni | 🔲 | Nessun prototipo modale o popover |
| Scorrimento | 🔲 | Nessun frame scorrevole nei prototipi |
| Flussi | 🔲 | Nessun punto iniziale con nome |
| Variabili | 🔲 | Nessuna logica condizionale |
| Curve e molle | 🔲 | Nessuna curva di animazione personalizzata |
| Presentazione | 🔲 | Nessuna vista prototipo a schermo intero |

## Import ed export

| Funzione | Stato | Note |
|----------|-------|------|
| Import `.fig` | ✅ | Codec Kiwi con 194 definizioni e circa 390 campi in `NodeChange` |
| Export `.fig` | ✅ | Kiwi, Zstd e miniatura; `COMPONENT` e `COMPONENT_SET` convertiti in `SYMBOL` |
| Salvataggio | ✅ | Finestre native in Tauri, File System Access API in Chrome/Edge e download in Safari |
| Incolla da Figma | ✅ | Decodifica del Kiwi binario dagli appunti Figma |
| Copia in Figma | ✅ | Produzione di Kiwi binario leggibile da Figma |
| Import Sketch | 🔲 | Nessuna lettura `.sketch` |
| Export immagini, SVG e PDF | 🟡 | PNG, JPG, WEBP e SVG supportati; PDF assente |
| Cronologia versioni | 🔲 | Nessuna consultazione o ripristino |
| Scambio risorse | ✅ | Appunti Figma e copia come testo, SVG, PNG o JSX |

## Plugin API e script

| Funzione | Stato | Note |
|----------|-------|------|
| `eval` con Figma Plugin API | ✅ | JavaScript headless con oggetto globale `figma` compatibile |

## Collaborazione e modalità sviluppatore

| Funzione | Stato | Note |
|----------|-------|------|
| Commenti | 🔲 | Nessun pin, discussione o risoluzione |
| Collaborazione in tempo reale | ✅ | P2P tramite Trystero e Yjs CRDT, cursori e modalità seguito senza server |
| Chat al cursore | 🔲 | Nessun messaggio vicino al cursore |
| Ramificazione e fusione | 🔲 | Nessun ramo di versione |
| Modalità sviluppatore | 🟡 | La scheda Codice mostra JSX; nessuna proprietà CSS o specifica di consegna |
| Code Connect | 🔲 | Nessun collegamento tra componenti e codice |
| Frammenti di codice | 🟡 | JSX con evidenziazione e copia; niente Swift/Kotlin |
| Tailwind CSS v4 | ✅ | HTML con classi dal pannello Codice, CLI o API |
| Figma for VS Code | 🔲 | Nessuna integrazione con editor di codice |
| Server MCP | ✅ | `@open-pencil/mcp`, stdio e HTTP; 87 strumenti principali e 3 per file |
| CLI | ✅ | `info`, `tree`, `find`, `export`, `analyze`, `node`, `pages`, `variables`, `eval` e JSON |

## Figma Draw

| Funzione | Stato | Note |
|----------|-------|------|
| Strumenti di illustrazione | 🔲 | Nessuno strumento specializzato di Figma Draw |
| Trasformazioni motivo | 🔲 | Nessun motivo ripetuto con trasformazioni |
