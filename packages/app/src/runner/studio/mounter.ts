import { getOrCreateHelperDom, getSelectorHighlightStyles } from '../dom'

function getStudioAssertionsMenuDom (body) {
  return getOrCreateHelperDom({
    body,
    className: '__cypress-studio-assertions-menu',
    css: window.UnifiedRunner.studioAssertionsMenu.css,
  })
}

export function openStudioAssertionsMenu ({ $el, $body, props }) {
  const { container, vueContainer } = getStudioAssertionsMenuDom($body.get(0))

  const selectorHighlightStyles = getSelectorHighlightStyles([$el.get(0)])[0]

  window.UnifiedRunner.studioAssertionsMenu.render(vueContainer, {
    $el,
    selectorHighlightStyles,
    ...props,
  })

  window.UnifiedRunner.studioAssertionsMenu.retargetEvents(container.shadowRoot)
}

export function closeStudioAssertionsMenu ($body) {
  const { container, vueContainer } = getStudioAssertionsMenuDom($body.get(0))

  window.UnifiedRunner.studioAssertionsMenu.unmount(vueContainer)
  container.remove()
}
