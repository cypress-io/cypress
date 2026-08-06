import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import type { ResolveSelectorMatch, ResolveSelectorResult } from '../contract'

// A shadow-scoped selector is unique only within its own shadow root, so it can't
// be passed back to a command that resolves selectors against the document —
// report the match as having none rather than suggest one that would resolve to
// nothing.
const isDocumentScoped = (selector: string): boolean => !selector.startsWith(':host')

// Deriving a unique selector walks up from the element testing each candidate
// against the whole document, so deriving one per match for a selector as broad
// as `*` would hold the app's main thread for the size of the page. Past this
// many matches the list is no longer one a caller picks out of anyway.
export const MAX_DERIVED_SELECTORS = 10

export const resolveSelectorCommand = defineCommand('resolve-selector', async ({ selector }): Promise<ResolveSelectorResult> => {
  const source = tapManagerDataSource.getElementSelectorSource()

  if (!source) {
    throw new TapCommandError('NO_AUT', 'no app under test is loaded — run a spec first')
  }

  let matched: ReturnType<typeof source.find>

  try {
    matched = source.find(selector)
  } catch {
    throw new TapCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  const selectors: ResolveSelectorMatch[] = []
  const derivable = Math.min(matched.length, MAX_DERIVED_SELECTORS)

  for (let index = 0; index < derivable; index++) {
    const uniqueSelector = source.getSelector(matched.item(index))

    selectors.push({ index, selector: uniqueSelector && isDocumentScoped(uniqueSelector) ? uniqueSelector : null })
  }

  return { selectors }
})
