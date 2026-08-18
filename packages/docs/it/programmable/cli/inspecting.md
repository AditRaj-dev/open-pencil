---
title: Esaminare file
description: Leggere Document tree, Nodes, Pages e Variables tramite CLI.
---

# Esaminare file

La CLI legge i file `.fig` senza aprire l’editor. Quando l’applicazione desktop è attiva, la maggior parte delle Commands consente di omettere il file e usare RPC con il documento aperto.

::: tip Installazione
```sh
npm install -g @open-pencil/cli
# oppure
bun add -g @open-pencil/cli
# oppure
brew install open-pencil/tap/open-pencil
```
:::

## Informazioni sul documento

Mostra Pages, numero di Nodes, Fonts usati e dimensione del file:

```sh
openpencil info design.fig
```

## Document tree

```sh
openpencil tree design.fig
```

```text
[0] [page] "Getting started" (0:46566)
  [0] [section] "" (0:46567)
    [0] [frame] "Body" (0:46568)
      [0] [frame] "Introduction" (0:46569)
        [0] [frame] "Introduction Card" (0:46570)
          [0] [frame] "Guidance" (0:46571)
```

## Cercare Nodes

Per Type:

```sh
openpencil find design.fig --type TEXT
```

Per Name:

```sh
openpencil find design.fig --name "Button"
```

I due Flags possono essere combinati.

## Node details

```sh
openpencil node design.fig --id 1:23
```

Mostra le Properties del Node indicato.

## Pages

```sh
openpencil pages design.fig
```

## Variables

```sh
openpencil variables design.fig
```

## Documento aperto

Con l’applicazione desktop attiva:

```sh
openpencil tree           # Documento aperto
openpencil eval -c "..." # Query tramite Figma Plugin API
```

## JSON output

Le Commands di Inspection supportano `--json`. L’output può essere elaborato con `jq`, CI o altri Tools:

```sh
openpencil tree design.fig --json | jq '.[] | .name'
```
