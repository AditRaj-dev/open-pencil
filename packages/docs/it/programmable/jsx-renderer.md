---
title: JSX renderer
description: Creare design in modo dichiarativo con JSX ed esportarli come JSX o HTML con Tailwind.
---

# JSX renderer

OpenPencil crea un Design tree da JSX. La sintassi dichiarativa e compatta è adatta ad AI agents, Scripts e generazione ripetibile dei design.

JSX serve anche come rappresentazione leggibile di un design esistente. Le modifiche appaiono come normali Code diff, facilitando Review e Version control.

## Creare un design

Il Tool `render`, disponibile in AI Chat, MCP e CLI `eval`, accetta JSX:

```jsx
<Frame name="Card" w={320} h="hug" flex="col" gap={16} p={24} bg="#FFF" rounded={16}>
  <Text size={18} weight="bold">Card Title</Text>
  <Text size={14} color="#666">Description text</Text>
</Frame>
```

In MCP e AI Chat, la JSX string viene passata direttamente a `render`. Per la direzione opposta, la CLI usa `export`: [Esportare un design in JSX](./cli/exporting).

## Elementi

| Elemento | Risultato | Alias |
|----------|-----------|-------|
| `<Frame>` | Frame con Auto layout opzionale | `<View>` |
| `<Rectangle>` | Rectangle | `<Rect>` |
| `<Ellipse>` | Ellipse o Circle | |
| `<Text>` | Oggetto di testo; i Children diventano il contenuto | |
| `<Line>` | Line | |
| `<Star>` | Star | |
| `<Polygon>` | Polygon | |
| `<Vector>` | Vector path | |
| `<Group>` | Group | |
| `<Section>` | Section | |

## Style props

Le forme abbreviate seguono le convenzioni Tailwind.

### Layout

| Prop | Significato |
|------|-------------|
| `flex` | `"row"` o `"col"`; attiva Auto layout |
| `gap` | Spazio tra Children |
| `wrap` | Posiziona i Children su altre righe |
| `rowGap` | Spazio tra righe con Wrap |
| `justify` | `"start"`, `"end"`, `"center"`, `"between"` |
| `items` | `"start"`, `"end"`, `"center"`, `"stretch"` |
| `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` | Padding |

### Size e Position

| Prop | Significato |
|------|-------------|
| `w`, `h` | Width o Height come numero, `"fill"` oppure `"hug"` |
| `minW`, `maxW`, `minH`, `maxH` | Limiti di dimensione |
| `x`, `y` | Position |

### Appearance

| Prop | Significato |
|------|-------------|
| `bg` | Background fill come Hex color |
| `fill` | Alias di `bg` |
| `stroke` | Stroke color |
| `strokeWidth` | Stroke weight, 1 per impostazione predefinita |
| `rounded` | Corner radius; angoli separati tramite `roundedTL`, `roundedTR`, `roundedBL`, `roundedBR` |
| `cornerSmoothing` | Continuous corner smoothing da 0 a 1 |
| `opacity` | Valore da 0 a 1 |
| `shadow` | Drop shadow, per esempio `"0 4 8 #00000040"` |
| `blur` | Layer blur radius |
| `rotate` | Rotation in gradi |
| `blendMode` | Blend mode |
| `overflow` | `"hidden"` oppure `"visible"` |

### Typography

| Prop | Significato |
|------|-------------|
| `size` / `fontSize` | Font size |
| `font` / `fontFamily` | Font family |
| `weight` / `fontWeight` | `"bold"`, `"medium"`, `"normal"` oppure numero |
| `color` | Text color |
| `textAlign` | `"left"`, `"center"`, `"right"`, `"justified"` |

## Esportare JSX

```sh
openpencil export design.fig -f jsx                   # JSX OpenPencil
openpencil export design.fig -f jsx --style tailwind  # HTML con Tailwind classes
```

Il design esportato può essere modificato come Code e renderizzato di nuovo.

## Diffs

```diff
 <Frame name="Card" w={320} flex="col" gap={16} p={24} bg="#FFF">
-  <Text size={18} weight="bold">Old Title</Text>
+  <Text size={24} weight="bold" color="#1D1B20">New Title</Text>
   <Text size={14} color="#666">Description</Text>
 </Frame>
```

Questa rappresentazione consente di rivedere le modifiche nelle Pull requests e conservarle in Version control.
