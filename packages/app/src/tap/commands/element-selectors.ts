import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import type { ElementSelectorMatch, ElementSelectorsResult } from '../contract'

// A shadow-scoped selector is unique only within its own shadow root, so it can't
// be passed back to a command that resolves selectors against the document —
// omit it rather than suggest one that would resolve to nothing.
const isDocumentScoped = (selector: string): boolean => !selector.startsWith(':host')

export const elementSelectorsCommand = defineCommand('element-selectors', async ({ selector }): Promise<ElementSelectorsResult> => {
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

  const selectors: ElementSelectorMatch[] = []

  for (let index = 0; index < matched.length; index++) {
    const unique = source.getSelector(matched.item(index))

    if (unique && isDocumentScoped(unique)) {
      selectors.push({ index, selector: unique })
    }
  }

  return { selectors }
})
