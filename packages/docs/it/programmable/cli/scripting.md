---
title: Scripts
description: Eseguire JavaScript con una Figma-compatible Plugin API per leggere, modificare e generare design.
---

# Scripts

`openpencil eval` esegue JavaScript su un documento OpenPencil e fornisce un oggetto globale `figma` compatibile con Figma. La Command è adatta a Batch edits, Inspection, Fixtures e automazione senza Editor UI.

## Utilizzo

```sh
openpencil eval design.fig -c "return figma.currentPage.children.length"
```

`-c` accetta JavaScript. Se il Code non inizia con `return`, OpenPencil lo esegue in una Async function e restituisce il risultato quando presente.

```sh
openpencil eval design.fig -c "
  const frame = figma.createFrame()
  frame.name = 'Card'
  frame.resize(300, 200)
  frame.layoutMode = 'VERTICAL'
  frame.itemSpacing = 12
  return { id: frame.id, name: frame.name }
"
```

## Interrogare Nodes

```sh
openpencil eval design.fig -c "
  return figma.currentPage
    .findAll((node) => node.type === 'FRAME' && node.name.includes('Button'))
    .map((button) => ({
      id: button.id,
      name: button.name,
      width: button.width,
      height: button.height
    }))
"
```

## Modificare e salvare

`--write` oppure `-w` scrive nel file di input:

```sh
openpencil eval design.fig -c "
  figma.currentPage.children.forEach((node) => {
    node.opacity = 0.5
  })
" --write
```

`--output` oppure `-o` crea un altro file:

```sh
openpencil eval design.fig -c "figma.currentPage.name = 'Updated'" -o updated.fig
```

## Script tramite stdin

```sh
cat transform.js | openpencil eval design.fig --stdin --write
```

## Documento aperto

Ometti il percorso per eseguire lo Script sul documento aperto nell’applicazione desktop:

```sh
openpencil eval -c "return figma.currentPage.name"
```

L’applicazione deve essere attiva e contenere un documento.

## Output

In un ambiente non interattivo, `eval` usa JSON per impostazione predefinita. `--json` forza esplicitamente il formato:

```sh
openpencil eval design.fig -c "return figma.currentPage.children.map((n) => n.name)" --json
```

`--quiet` oppure `-q` nasconde l’Output quando serve solo scrivere un file.

## API compatibile

L’API si ispira a Figma Plugin API, ma lavora con SceneGraph e il formato OpenPencil.

### Documento e Pages

- `figma.root`
- `figma.currentPage`
- `figma.currentPage.selection`
- `figma.getNodeById(id)`
- `figma.createPage()`

### Creare Nodes

- `figma.createFrame()`
- `figma.createRectangle()`
- `figma.createEllipse()`
- `figma.createText()`
- `figma.createLine()`
- `figma.createPolygon()`
- `figma.createStar()`
- `figma.createVector()`
- `figma.createComponent()`
- `figma.createSection()`

### Tree operations

- `node.children`
- `node.parent`
- `node.appendChild(child)`
- `node.insertChild(index, child)`
- `node.clone()`
- `node.remove()`
- `node.findAll(callback?)`
- `node.findOne(callback)`
- `node.findChild(callback)`
- `node.findChildren(callback?)`
- `figma.group(nodes, parent)`
- `figma.ungroup(node)`

### Components

- `figma.createComponentFromNode(node)`
- `component.createInstance()`
- `instance.mainComponent`

### Variables

- `figma.getLocalVariables(type?)`
- `figma.getVariableById(id)`
- `figma.getLocalVariableCollections()`
- `figma.getVariableCollectionById(id)`
- `figma.createVariable(name, type, collectionId, value?)`
- `figma.setVariableValue(variableId, modeId, value)`
- `figma.deleteVariable(id)`
- `figma.createVariableCollection(name)`
- `figma.deleteVariableCollection(id)`
- `figma.bindVariable(nodeId, field, variableId)`
- `figma.unbindVariable(nodeId, field)`

### Properties

Le Properties comuni possono essere lette e modificate tramite il Proxy:

- Geometry: `x`, `y`, `width`, `height`, `rotation`, `resize(width, height)`;
- Appearance: `fills`, `strokes`, `effects`, `opacity`, `visible`, `locked`, `blendMode`, `clipsContent`;
- Radius: `cornerRadius`, `topLeftRadius`, `topRightRadius`, `bottomRightRadius`, `bottomLeftRadius`;
- Text: `characters`, `fontSize`, `fontName`, `fontWeight`, Alignment, Line height, Letter spacing e Style-run helpers;
- Auto layout: `layoutMode`, Alignment dei due Axes, `itemSpacing`, Padding, Sizing e Layout position;
- Stroke: `strokeWeight`, `strokeAlign`, `dashPattern`.

### Utilities

- `figma.mixed`
- `figma.createImage(data)`
- `figma.loadFontAsync(fontName)` è un No-op perché OpenPencil non blocca i Text edits durante il caricamento del Font da parte di un Plugin
- `figma.listAvailableFontsAsync()` restituisce gli Host fonts disponibili
- `figma.notify(message)` scrive una Warning in Headless mode
- `figma.viewport`

## Non ancora compatibile

Queste APIs Figma non sono ancora disponibili come Helpers compatibili:

- `node.exportAsync()`
- `node.setBoundVariable(field, variable)`
- `node.detachInstance()`
- `figma.combineAsVariants(components, parent)`
- Style APIs come `figma.createPaintStyle()` e `figma.createTextStyle()`
- parità completa per le Vector boolean operations

In base al caso, usa CLI export, Core tools o Helpers diretti di SceneGraph.
