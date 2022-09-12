import { App, createApp, StyleValue } from 'vue'
import AssertionsMenu from './AssertionsMenu.ce.vue'
import { getOrCreateHelperDom, getSelectorHighlightStyles } from '../dom'

function getStudioAssertionsMenuDom (body) {
  return getOrCreateHelperDom({
    body,
    className: '__cypress-studio-assertions-menu',
    css: window.UnifiedRunner.studioAssertionsMenu.css,
  })
}

export function openStudioAssertionsMenu ({ $el, $body, props }) {
  const { vueContainer } = getStudioAssertionsMenuDom($body.get(0))

  vueContainerListeners(vueContainer)

  const selectorHighlightStyles = getSelectorHighlightStyles([$el.get(0)])[0]

  mountAssertionsMenu(vueContainer, $el, props.possibleAssertions, props.addAssertion, props.closeMenu, selectorHighlightStyles, window.UnifiedRunner.studioAssertionsMenu.renderAssertionTypes)
}

// TODO: remove this function.
// For some reason, the root div of our AssertionsMenu app usually gets
// all the events and does not distribute the events to the children.
// So, we're manually distributing the events.
// But it causes duplicated events are sent to the same object, so we're filtering them.
// I failed to prove it's our problem or Vue's problem.
function vueContainerListeners (vueContainer) {
  vueContainer.addEventListener('click', (e) => {
    const paths = e.composedPath()

    for (let i = 0; i < paths.length; i++) {
      const el = paths[i] as HTMLElement

      if (el.className?.includes('single-assertion') ||
        el.className?.includes('assertion-option')) {
        el.dispatchEvent(new MouseEvent('click', e))
        break
      }
    }
  })

  vueContainer.addEventListener('mouseover', (e) => {
    const paths = e.composedPath()

    for (let i = 0; i < paths.length; i++) {
      const el = paths[i] as HTMLElement

      if (el.className?.includes('assertion-type')) {
        el.dispatchEvent(new MouseEvent('mouseover', e))
        break
      }
    }
  })
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
  renderAssertionTypes: any,
) => {
  app = createApp(AssertionsMenu, {
    jqueryElement,
    possibleAssertions,
    addAssertion,
    closeMenu,
    highlightStyle,
    renderAssertionTypes,
  })

  app.mount(container)
}

const unmountAssertionsMenu = () => {
  if (app) {
    app.unmount()
    app = null
  }
}
