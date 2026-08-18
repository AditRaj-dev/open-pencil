---
title: Export con la CLI
description: Esportare PNG, JPG, WEBP, SVG, `.fig`, JSX e HTML o convertire formati di documento.
---

# Export con la CLI

La CLI esporta Images, SVG, parti di un documento come `.fig`, JSX e HTML.

## Formati

```sh
openpencil export design.fig                           # PNG predefinito
openpencil export design.fig -f jpg -s 2 -q 90        # JPG a 2×, Quality 90
openpencil export design.fig -f webp -s 3             # WEBP a 3×
openpencil export design.fig -f svg                   # SVG
openpencil export design.fig -f fig --page "Page 1"   # una Page come .fig
openpencil export design.fig -f fig --node 1:23        # un Node come .fig
openpencil export design.fig -f html --css tailwind    # HTML fragment con Tailwind classes
```

Options:

- `-f`: `png`, `jpg`, `webp`, `svg`, `jsx`, `html` oppure `fig`;
- `-s`: Scale da 1 a 4;
- `-q`: Quality da 0 a 100, solo JPG e WEBP;
- `-o`: Output path;
- `--page`: Page name;
- `--node`: Node ID.

## JSX

```sh
openpencil export design.fig -f jsx --style tailwind
```

Output:

```html
<div className="flex flex-col gap-4 p-6 bg-white rounded-xl">
  <p className="text-2xl font-bold text-[#1D1B20]">Card Title</p>
  <p className="text-sm text-[#49454F]">Description text</p>
</div>
```

`--style openpencil` produce il formato JSX nativo del [JSX renderer](../jsx-renderer).

## HTML

Per impostazione predefinita, l’Export crea un HTML fragment con Inline styles. Può anche generare Tailwind utility classes:

```sh
openpencil export design.fig -f html
openpencil export design.fig -f html --css tailwind
```

`--html standalone` produce un documento completo apribile nel Browser, con Reset styles e Page wrapper:

```sh
openpencil export design.fig -f html --html standalone --css inline
openpencil export design.fig -f html --html standalone --css tailwind
openpencil export design.fig -f html --html standalone --css tailwind --assets external
```

Standalone Tailwind viene compilato durante l’Export e non richiede Tailwind browser runtime. `--assets external` scrive CSS e Images estratte accanto al file HTML. Con Assets esterni, `--fonts assets` risolve i Fonts rilevati in SceneGraph tramite i Web-font providers configurati e genera file `@font-face` locali.

Standalone HTML è pensato per Handoff, Inspection ed elaborazione successiva, non per sostituire il Canvas renderer pixel-perfect. HTML export è disponibile solo in File mode.

## Thumbnail

```sh
openpencil export design.fig --thumbnail --width 1920 --height 1080
```

## Documento aperto

Ometti il file per esportare dall’applicazione desktop:

```sh
openpencil export -f png    # Screenshot del canvas corrente
```
