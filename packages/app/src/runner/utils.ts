import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { AutIframe } from './aut-iframe'

export const RUNNER_ID = 'unified-runner'

export const REPORTER_ID = 'unified-reporter'

function getElementById (id: string) {
  const el = document.querySelector<HTMLElement>(`#${id}`)

  if (!el) {
    throw Error(`Expected element with #${id} but did not find it.`)
  }

  return el
}

export function getRunnerElement () {
  return getElementById(RUNNER_ID)
}

export function getReporterElement () {
  return getElementById(REPORTER_ID)
}

export function empty (el: HTMLElement) {
  while (el.lastChild) {
    if (el && el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }
}

export const togglePlayground = (autIframe: AutIframe) => {
  const selectorPlaygroundStore = useSelectorPlaygroundStore()

  if (selectorPlaygroundStore.show) {
    selectorPlaygroundStore.setShow(false)
    autIframe.toggleSelectorPlayground(false)
    selectorPlaygroundStore.setEnabled(false)
  } else {
    selectorPlaygroundStore.setShow(true)
    autIframe.toggleSelectorPlayground(true)
    selectorPlaygroundStore.setEnabled(true)
  }
}
