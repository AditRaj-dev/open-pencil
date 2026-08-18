---
title: Disegnare Shapes
description: Creare Rectangles, Ellipses, Lines, Frames, Sections, Polygons e Stars in OpenPencil.
---

# Disegnare Shapes

La Toolbar inferiore contiene i Tools per creare Shapes, Frames e Sections. Seleziona un Tool e trascina sul canvas.

## Tools

| Tool | Scorciatoia | Funzione |
|------|-------------|----------|
| Rectangle | <kbd>R</kbd> | Crea un Rectangle |
| Ellipse | <kbd>O</kbd> | Crea un’Ellipse |
| Line | <kbd>L</kbd> | Crea una Line |
| Frame | <kbd>F</kbd> | Crea un Frame che funge da contenitore |
| Section | <kbd>S</kbd> | Crea una Section e integra gli oggetti sovrapposti |

## Menu Shapes

Include anche:

- **Polygon:** tre lati per impostazione predefinita;
- **Star:** cinque punte per impostazione predefinita.

## Mantenere le proporzioni

Tieni premuto <kbd>Shift</kbd> durante il Drag:

- Rectangle diventa un quadrato;
- Ellipse diventa un cerchio;
- Line si allinea a 0°, 45° e 90°.

## Properties

### Fill

Uno Shape può usare Solid color, Gradient linear/radial/angular/diamond oppure Image fill.

### Stroke

- **Weight:** uniforme o indipendente per Top, Right, Bottom e Left
- **Color:** Solid color con Opacity
- **Alignment:** Inside, Center oppure Outside con Clipping compatibile con Figma
- **Cap:** None, Round, Square oppure Arrow
- **Join:** Miter, Bevel oppure Round
- **Dash:** alternanza di lunghezze Dash e Gap

### Corner radius

Rectangles, Frames, Components e Instances supportano un Radius comune o indipendente per ogni angolo.

### Effects

- **Drop shadow:** Offset, Blur radius, Spread e Color
- **Inner shadow:** le stesse impostazioni all’interno dello Shape
- **Layer blur:** sfoca l’intero oggetto
- **Background blur:** sfoca il contenuto dietro l’oggetto
- **Foreground blur:** sfoca il contenuto davanti all’oggetto

## Frames e Sections

I **Frames** sono contenitori. Gli Shapes trascinati al loro interno diventano Children. Supportano anche [Auto layout](./auto-layout).

Le **Sections** organizzano gli oggetti al livello superiore e integrano automaticamente i Siblings sovrapposti.

## Scorciatoie

| Azione | macOS | Windows / Linux |
|--------|-------|-----------------|
| Rectangle | <kbd>R</kbd> | <kbd>R</kbd> |
| Ellipse | <kbd>O</kbd> | <kbd>O</kbd> |
| Line | <kbd>L</kbd> | <kbd>L</kbd> |
| Frame | <kbd>F</kbd> | <kbd>F</kbd> |
| Section | <kbd>S</kbd> | <kbd>S</kbd> |
| Quadrato o cerchio | <kbd>Shift</kbd> + Drag | <kbd>Shift</kbd> + Drag |
