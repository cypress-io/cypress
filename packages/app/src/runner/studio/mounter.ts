import { App, createApp, StyleValue } from 'vue'
import AssertionsMenu from './AssertionsMenu.ce.vue'
import AssertionType from './AssertionType.ce.vue'
import AssertionOptions from './AssertionOptions.ce.vue'
import { getOrCreateHelperDom, getSelectorHighlightStyles } from '../dom'
import type { PossibleAssertions, AddAssertion } from './types'

function getStudioAssertionsMenuDom (body) {
  return getOrCreateHelperDom({
    body,
    className: '__cypress-studio-assertions-menu',
    css: `${AssertionsMenu.styles}\n${AssertionType.styles}\n${AssertionOptions.styles}`,
  })
}

interface StudioAssertionsMenuArgs {
  $el: JQuery<HTMLElement>
  $body: JQuery<HTMLElement>
  props: {
    possibleAssertions: PossibleAssertions
    addAssertion: AddAssertion
    closeMenu: () => void
  }
}

export function openStudioAssertionsMenu ({ $el, $body, props }: StudioAssertionsMenuArgs) {
  const { vueContainer } = getStudioAssertionsMenuDom($body.get(0))

  vueContainerListeners(vueContainer)

  const selectorHighlightStyles = getSelectorHighlightStyles([$el.get(0)])[0]

  mountAssertionsMenu(vueContainer, $el, props.possibleAssertions, props.addAssertion, props.closeMenu, selectorHighlightStyles)
}

export function closeStudioAssertionsMenu ($body) {
  const { container } = getStudioAssertionsMenuDom($body.get(0))

  unmountAssertionsMenu()
  container.remove()
}

let app: App<Element> | null = null

const mountAssertionsMenu = (
  container: Element,
  jqueryElement: any,
  possibleAssertions: any[],
  addAssertion: any,
  closeMenu: any,
  highlightStyle: StyleValue,
) => {
  app = createApp(AssertionsMenu, {
    jqueryElement,
    possibleAssertions,
    addAssertion,
    closeMenu,
    highlightStyle,
  })

  app.mount(container)
}

const unmountAssertionsMenu = () => {
  if (app) {
    app.unmount()
    app = null
  }
}

// TODO: remove these.
// For some reason, the root div of our AssertionsMenu app usually gets
// all the events and does not distribute the events to the children.
// So, we're manually distributing the events.
// But it causes duplicated events are sent to the same object, so we're filtering them.
// I failed to prove it's our problem or Vue's problem.
let lastTarget = null
let lastTimeStamp = -1

function vueContainerListeners (vueContainer) {
  vueContainer.addEventListener('click', (e) => {
    const paths = e.composedPath()

    for (let i = 0; i < paths.length; i++) {
      const el = paths[i] as HTMLElement

      if (classIncludes(el, 'single-assertion') ||
        classIncludes(el, 'assertion-option') ||
        (el.tagName === 'A' && classIncludes(el, 'close'))) {
        el.dispatchEvent(new MouseEvent('click', e))
        break
      }
    }
  })

  vueContainer.addEventListener('mouseover', (e) => {
    const paths = e.composedPath()

    for (let i = 0; i < paths.length; i++) {
      const el = paths[i] as HTMLElement

      if (classIncludes(el, 'assertion-type')) {
        el.dispatchEvent(new MouseEvent('mouseover', e))
        break
      }
    }
  })

  vueContainer.addEventListener('mouseout', (e) => {
    // Sometimes, there is maximum call stack size exceeded error.
    if (lastTarget === e.target && lastTimeStamp - e.timeStamp < 100) {
      return
    }

    lastTarget = e.target
    lastTimeStamp = e.timeStamp

    const paths = e.composedPath()

    for (let i = 0; i < paths.length; i++) {
      const el = paths[i] as HTMLElement

      if (classIncludes(el, 'assertion-type')) {
        el.dispatchEvent(new MouseEvent('mouseout', e))
        break
      }
    }
  })
}

function classIncludes (el, className) {
  return typeof el.className === 'string' && el.className.includes(className)
}
