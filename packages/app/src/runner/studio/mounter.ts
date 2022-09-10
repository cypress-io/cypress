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

  const selectorHighlightStyles = getSelectorHighlightStyles([$el.get(0)])[0]

  // window.UnifiedRunner.studioAssertionsMenu.render(vueContainer, {
  //   $el,
  //   selectorHighlightStyles,
  //   ...props,
  // })

  mountAssertionsMenu(vueContainer, $el, props.possibleAssertions, props.addAssertion, props.closeMenu, selectorHighlightStyles, window.UnifiedRunner.studioAssertionsMenu.renderAssertionTypes)

  // window.UnifiedRunner.studioAssertionsMenu.retargetEvents(vueContainer)
}

export function closeStudioAssertionsMenu ($body) {
  const { container, vueContainer } = getStudioAssertionsMenuDom($body.get(0))

  window.UnifiedRunner.studioAssertionsMenu.unmount(vueContainer)
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
  if (app) {
    app.unmount()
  }

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
