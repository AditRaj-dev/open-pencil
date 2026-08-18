---
title: Analizzare design
description: Esaminare Colors, Typography, Spacing e Structures ripetute nei file `.fig`.
---

# Analizzare design

Le Commands `analyze` esaminano un documento completo dal terminale. Mostrano Colors e Text styles, differenze di Spacing e Structures ripetute che potrebbero diventare Components.

## Colors

```sh
openpencil analyze colors design.fig
```

Conta ogni Color nel documento e mostra un Histogram:

```text
#1d1b20  ██████████████████████████████ 17155×
#49454f  ██████████████████████████████ 9814×
#ffffff  ██████████████████████████████ 8620×
#6750a4  ██████████████████████████████ 3967×
```

## Typography

```sh
openpencil analyze typography design.fig
```

Elenca le combinazioni Font family, Size e Style con la relativa frequenza, così da individuare Text styles isolati.

## Spacing

```sh
openpencil analyze spacing design.fig
```

Esamina Gap e Padding degli Auto-layout Frames. Un valore `13px` in una scala `8/16/24` diventa così visibile.

## Clusters

```sh
openpencil analyze clusters design.fig
```

Cerca Node structures ripetute che potrebbero essere raggruppate come Components:

```text
3771× frame "container" (100% match)
     size: 40×40, structure: Frame > [Frame]

2982× instance "Checkboxes" (100% match)
     size: 48×48, structure: Instance > [Frame]
```

## JSON output

```sh
openpencil analyze colors design.fig --json
```

Tutte le Analyze commands supportano `--json`. L’output può essere elaborato con `jq`, verificato nella CI o usato in Scripts che applicano regole sui Design tokens.
