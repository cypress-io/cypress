import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { MAX_DERIVED_SELECTORS, TapError } from '../contract'
import type { ResolveSelectorMatch, ResolveSelectorResult } from '../contract'

// A shadow-scoped selector is unique only within its own shadow root, so it can't
// be passed back to a command that resolves selectors against the document —
// report the match as having none rather than suggest one that would resolve to
// nothing.
const isDocumentScoped = (selector: string): boolean => !selector.startsWith(':host')

export const resolveSelectorCommand = defineCommand('resolve-selector', async ({ selector }): Promise<ResolveSelectorResult> => {
  const source = tapManagerDataSource.getElementSelectorSource()

  if (!source) {
    throw new TapError('NO_AUT')
  }

  let matched: ReturnType<typeof source.find>

  try {
    matched = source.find(selector)
  } catch {
    throw new TapError('INVALID_SELECTOR', { detail: `The selector was "${selector}".` })
  }

  const selectors: ResolveSelectorMatch[] = []
  const derivable = Math.min(matched.length, MAX_DERIVED_SELECTORS)

  for (let index = 0; index < derivable; index++) {
    const uniqueSelector = source.getSelector(matched.item(index))

    selectors.push({ index, selector: uniqueSelector && isDocumentScoped(uniqueSelector) ? uniqueSelector : null })
  }

  return { selectors }
})
