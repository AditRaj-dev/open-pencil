import { WriteBackError, type SourceEdit } from './edit'
import type { WebSourcePayload } from './types'

/**
 * Interaction states a component can be edited in.
 *
 * Only states expressible as a CSS pseudo-class, because those are the ones
 * that can be shown and written back without running the component. A state
 * held in React state (`isOpen`) has no static representation, so it is out of
 * scope rather than half-supported.
 */
export type UIState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'visited' | 'focus-visible'

export const UI_STATES: readonly UIState[] = [
  'default', 'hover', 'focus', 'focus-visible', 'active', 'disabled', 'visited'
]

const PSEUDO: Record<Exclude<UIState, 'default'>, string> = {
  hover: ':hover',
  focus: ':focus',
  'focus-visible': ':focus-visible',
  active: ':active',
  disabled: ':disabled',
  visited: ':visited'
}

export interface StateUsage {
  state: UIState
  /** Utilities carrying this state, e.g. ['hover:bg-blue-700']. */
  classes: string[]
  /** Selectors in the stylesheet that define it, e.g. ['.btn:hover']. */
  selectors: string[]
}

/** Split a class attribute, tolerating arbitrary whitespace. */
function splitClasses(value: string | null | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean)
}

/**
 * Which states an element actually defines.
 *
 * Reads both conventions: a variant prefix on a utility class
 * (`hover:bg-blue-700`) and a pseudo-class rule in the stylesheet
 * (`.btn:hover { ... }`). An element with neither has only a default state, and
 * offering it a hover tab would be inventing something to edit.
 */
export function detectStates(className: string | null, css: string | undefined): StateUsage[] {
  const classes = splitClasses(className)
  const usage = new Map<UIState, StateUsage>()

  const record = (state: UIState, cls?: string, selector?: string) => {
    const existing = usage.get(state) ?? { state, classes: [], selectors: [] }
    if (cls && !existing.classes.includes(cls)) existing.classes.push(cls)
    if (selector && !existing.selectors.includes(selector)) existing.selectors.push(selector)
    usage.set(state, existing)
  }

  for (const cls of classes) {
    // Tailwind variants stack: `md:hover:bg-x`. Any segment can be the state.
    const segments = cls.split(':')
    if (segments.length < 2) continue
    for (const seg of segments.slice(0, -1)) {
      if (seg in PSEUDO) record(seg as UIState, cls)
    }
  }

  if (css) {
    for (const [state, pseudo] of Object.entries(PSEUDO)) {
      // Match a selector that carries this pseudo-class, capturing the selector
      // so a caller can show where the state is defined.
      const re = new RegExp(`([^{}]*${pseudo}[^{}]*)\\{`, 'g')
      let match: RegExpExecArray | null
      while ((match = re.exec(css)) !== null) {
        const selector = (match[1] ?? '').trim()
        if (!selector) continue
        // Only report it when it could apply to this element.
        const applies =
          classes.length === 0 ||
          classes.some((c) => selector.includes(`.${c.split(':').pop()}`)) ||
          !selector.includes('.')
        if (applies) record(state as UIState, undefined, selector)
      }
    }
  }

  const found = [...usage.values()]
  found.sort((a, b) => UI_STATES.indexOf(a.state) - UI_STATES.indexOf(b.state))
  return found
}

/**
 * Rewrite a stylesheet so one state's rules apply at rest.
 *
 * A canvas cannot hover. To show what `:hover` looks like, its declarations
 * have to win in the resting state, which is done by dropping the pseudo-class
 * from matching selectors and appending the rule so it comes last in the
 * cascade. Rules for the other states are removed, so switching to `hover` does
 * not also show `:active`.
 */
export function promoteStateCss(css: string, state: UIState): string {
  if (state === 'default') return stripAllStates(css)

  const pseudo = PSEUDO[state]
  const promoted: string[] = []
  const base = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector: string, body: string) => {
    if (!selector.includes(pseudo)) return whole
    promoted.push(`${selector.replaceAll(pseudo, '').trim()} { ${body.trim()} }`)
    return '' // the original pseudo rule is replaced by its promoted copy
  })

  return `${stripAllStates(base)}\n/* promoted ${state} */\n${promoted.join('\n')}`
}

/** Remove every pseudo-state rule, leaving the resting appearance. */
function stripAllStates(css: string): string {
  const pseudos = Object.values(PSEUDO)
  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector: string) =>
    pseudos.some((p) => selector.includes(p)) ? '' : whole
  )
}

/**
 * Rewrite class attributes so one state's utilities apply at rest.
 *
 * `hover:bg-blue-700` becomes `bg-blue-700`, and the other states' utilities
 * are dropped. Same reasoning as the stylesheet: the canvas has no pointer, so
 * the state has to be made unconditional to be visible.
 */
export function promoteStateClasses(html: string, state: UIState): string {
  return html.replace(/class="([^"]*)"/g, (_whole, value: string) => {
    const kept: string[] = []
    for (const cls of splitClasses(value)) {
      const segments = cls.split(':')
      if (segments.length < 2) {
        kept.push(cls)
        continue
      }
      const variants = segments.slice(0, -1)
      const utility = segments[segments.length - 1]!
      const stateVariants = variants.filter((v) => v in PSEUDO)

      if (stateVariants.length === 0) {
        kept.push(cls) // a non-state variant such as `md:`
        continue
      }
      if (state !== 'default' && stateVariants.includes(state)) {
        // Keep any non-state variants so `md:hover:x` stays responsive.
        const rest = variants.filter((v) => !(v in PSEUDO))
        kept.push([...rest, utility].join(':'))
      }
      // utilities for other states are dropped
    }
    return `class="${kept.join(' ')}"`
  })
}

/**
 * Write a state's utilities back into the class attribute.
 *
 * The utilities are stored prefixed (`hover:bg-blue-700`), so editing the hover
 * state replaces only the prefixed ones and leaves the resting classes intact.
 * Editing the default state does the reverse. Without that split, styling a
 * hover state would silently erase the element's normal appearance.
 */
export function editStateClasses(
  web: WebSourcePayload,
  state: UIState,
  utilities: readonly string[]
): SourceEdit {
  if (web.propsDynamic) {
    throw new WriteBackError(
      `<${web.tagName}> at ${web.filePath}:${web.startLine} has a spread or computed className; ` +
        `a written class could be overridden at run time`
    )
  }

  const existing = splitClasses(web.className)
  const isStateClass = (cls: string) => {
    const variants = cls.split(':').slice(0, -1)
    return variants.some((v) => v in PSEUDO)
  }
  const belongsToState = (cls: string) => cls.split(':').slice(0, -1).includes(state)

  const kept =
    state === 'default'
      ? existing.filter(isStateClass) // keep every state utility, replace the rest
      : existing.filter((c) => !belongsToState(c))

  const added =
    state === 'default'
      ? utilities.map((u) => u.trim()).filter(Boolean)
      : utilities
          .map((u) => u.trim())
          .filter(Boolean)
          .map((u) => (u.split(':').slice(0, -1).includes(state) ? u : `${state}:${u}`))

  const next = state === 'default' ? [...added, ...kept] : [...kept, ...added]

  if (web.classNameRange) {
    return {
      filePath: web.filePath,
      start: web.classNameRange.start,
      end: web.classNameRange.end,
      text: next.join(' '),
      anchor: web.className ?? undefined,
      label: `set ${state} classes on <${web.tagName}>`
    }
  }

  const attr = /\.[jt]sx$/.test(web.filePath) ? 'className' : 'class'
  const insertAt = web.start + 1 + web.tagName.length
  return {
    filePath: web.filePath,
    start: insertAt,
    end: insertAt,
    text: ` ${attr}="${next.join(' ')}"`,
    label: `add ${attr} to <${web.tagName}>`
  }
}
