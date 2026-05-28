import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import type { AutIframe } from '../aut-iframe'
import { closeStudioAssertionsMenu } from '../studio/mounter'
import { useStudioStore } from '../../store/studio-store'

export type SelectorMethod = 'get' | 'contains'

export const SELECTOR_METHODS = [
  {
    display: 'cy.get',
    value: 'get' as SelectorMethod,
  },
  {
    display: 'cy.contains',
    value: 'contains' as SelectorMethod,
  },
] as const

export const getMethodPrefix = (method: SelectorMethod): string => {
  return method === 'get' ? 'cy.get(‘' : 'cy.contains(’'
}

// Gets the length of the prefix text for a given selector method.
// Used for calculating input padding
export const getMethodPrefixLength = (method: SelectorMethod): number => {
  return getMethodPrefix(method).length + 1
}

export const closePlayground = (autIframe: AutIframe) => {
  const selectorPlaygroundStore = useSelectorPlaygroundStore()

  selectorPlaygroundStore.setShow(false)
  autIframe.toggleSelectorPlayground(false)
  selectorPlaygroundStore.setEnabled(false)
  selectorPlaygroundStore.setShowingHighlight(false)
  autIframe.toggleSelectorHighlight(false)
}

const _openPlaygroundCore = (autIframe: AutIframe) => {
  const selectorPlaygroundStore = useSelectorPlaygroundStore()

  selectorPlaygroundStore.setShow(true)
  autIframe.toggleSelectorPlayground(true)
  selectorPlaygroundStore.setEnabled(true)
  selectorPlaygroundStore.setShowingHighlight(true)
  autIframe.toggleSelectorHighlight(true)
}

export const openPlayground = (autIframe: AutIframe) => {
  const studioStore = useStudioStore()

  // Close assertions menu if Studio is active and menu is open
  if (studioStore.isActive) {
    const $body = autIframe._body()

    if ($body && $body.length > 0) {
      closeStudioAssertionsMenu($body)
    }
  }

  _openPlaygroundCore(autIframe)
}

export const togglePlayground = (autIframe: AutIframe) => {
  const selectorPlaygroundStore = useSelectorPlaygroundStore()

  if (selectorPlaygroundStore.show) {
    closePlayground(autIframe)
  } else {
    openPlayground(autIframe)
  }
}
