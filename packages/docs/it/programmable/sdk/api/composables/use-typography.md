---
title: useTypography
description: Leggere e modificare Font family, Style, Size, Alignment e Formatting degli oggetti di testo.
---

# useTypography

`useTypography()` fornisce Font family, Font style, Font size, Formatting attivo, informazioni sui Fonts mancanti e Functions per modificare Family, Style, Alignment e Decoration.

```ts
const {
  fontFamily,
  fontWeight,
  fontSize,
  activeFormatting,
  setFamily,
  setWeight,
  setAlign,
} = useTypography()

typography.toggleBold()
typography.toggleItalic()
typography.toggleDecoration('UNDERLINE')
```

## Vedi anche

- [useTextEdit](./use-text-edit)
- [useSelectionState](./use-selection-state)
