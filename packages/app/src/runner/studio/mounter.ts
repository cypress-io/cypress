import { App, createApp, StyleValue } from 'vue'
import AssertionsMenu from './AssertionsMenu.ce.vue'
import AssertionType from './AssertionType.ce.vue'
import AssertionOptions from './AssertionOptions.ce.vue'
import { getOrCreateHelperDom, getSelectorHighlightStyles } from '../dom'
import type { PossibleAssertions, AddAssertion } from './types'

// Types
interface StudioAssertionsMenuArgs {
  $el: JQuery<HTMLElement>
  $body: JQuery<HTMLElement>
  props: {
    possibleAssertions: PossibleAssertions
    addAssertion: AddAssertion
    closeMenu: () => void
  }
}

interface EventTarget extends HTMLElement {
  className: string
}

// Constants
const EVENT_THROTTLE_MS = 100

// State
let app: App<Element> | null = null
let lastTarget: EventTarget | null = null
let lastTimeStamp = -1

// Helper functions
function getStudioAssertionsMenuDom (body: HTMLElement) {
  return getOrCreateHelperDom({
    body,
    className: '__cypress-studio-assertions-menu',
    css: `${AssertionsMenu.styles}\n${AssertionType.styles}\n${AssertionOptions.styles}`,
  })
}

function classIncludes (el: EventTarget, className: string): boolean {
  return typeof el.className === 'string' && el.className.includes(className)
}

function shouldThrottleEvent (e: MouseEvent): boolean {
  return lastTarget === e.target && lastTimeStamp - e.timeStamp < EVENT_THROTTLE_MS
}

function dispatchEventToTarget (e: MouseEvent, targetClass: string): void {
  const paths = e.composedPath()

  for (const el of paths) {
    if (classIncludes(el as EventTarget, targetClass)) {
      el.dispatchEvent(new MouseEvent(e.type, e))
      break
    }
  }
}

// Event handlers
function setupVueContainerListeners (vueContainer: HTMLElement): void {
  vueContainer.addEventListener('click', (e) => {
    const paths = e.composedPath()

    for (const el of paths) {
      if (classIncludes(el as EventTarget, 'single-assertion') ||
          classIncludes(el as EventTarget, 'assertion-option') ||
          (el instanceof HTMLElement && el.tagName === 'A' && classIncludes(el, 'close'))) {
        el.dispatchEvent(new MouseEvent('click', e))
        break
      }
    }
  })

  vueContainer.addEventListener('mouseover', (e) => {
    dispatchEventToTarget(e, 'assertion-type')
  })

  vueContainer.addEventListener('mouseout', (e) => {
    if (shouldThrottleEvent(e)) return

    lastTarget = e.target as EventTarget
    lastTimeStamp = e.timeStamp

    dispatchEventToTarget(e, 'assertion-type')
  })
}

// Component mounting
function mountAssertionsMenu (
  container: Element,
  jqueryElement: JQuery<HTMLElement>,
  possibleAssertions: PossibleAssertions,
  addAssertion: AddAssertion,
  closeMenu: () => void,
  highlightStyle: StyleValue,
): void {
  app = createApp(AssertionsMenu, {
    jqueryElement,
    possibleAssertions,
    addAssertion,
    closeMenu,
    highlightStyle,
  })

  app.mount(container)
}

function unmountAssertionsMenu (): void {
  if (app) {
    app.unmount()
    app = null
  }
}

// Public API
export function openStudioAssertionsMenu ({ $el, $body, props }: StudioAssertionsMenuArgs): void {
  const { vueContainer } = getStudioAssertionsMenuDom($body.get(0))

  setupVueContainerListeners(vueContainer)

  const selectorHighlightStyles = getSelectorHighlightStyles([$el.get(0)])[0]

  mountAssertionsMenu(
    vueContainer,
    $el,
    props.possibleAssertions,
    props.addAssertion,
    props.closeMenu,
    selectorHighlightStyles,
  )
}

export function closeStudioAssertionsMenu ($body: JQuery<HTMLElement>): void {
  const { container } = getStudioAssertionsMenuDom($body.get(0))

  unmountAssertionsMenu()
  container.remove()
}
