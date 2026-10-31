// Runs in an isolated world inside the AUT frame, injected by the server over CDP.
// It shares the AUT's DOM but not its JS globals, so it reuses the driver's own
// DOM, actionability, mouse and keyboard code against a local `Cypress` shim.
import _ from 'lodash'
import Bluebird from 'bluebird'
import { installCypressShim } from './cypress_shim'
import $ from 'jquery'
import '../../config/jquery'
import '../../config/lodash'
import $dom from '../../dom'
import $elements from '../../dom/elements'
import $selection from '../../dom/selection'
import { traverse } from '../../dom/traversal'
import $LocalStorage from '../../cypress/local_storage'
import $errUtils from '../../cypress/error_utils'
import { addEventCoords, dispatch } from '../../cy/commands/actions/dispatch_event'
import { SELECT_FILE_ACTIONS, createDataTransfer } from '../../cy/commands/actions/select_file_dom'
import { findScrollableParent } from '../../cy/commands/actions/scroll_parent'
import { findAllShadowRoots } from '../../dom/elements/shadow'
import $actionability from '../../cy/actionability'
import { create as createFocused } from '../../cy/focused'
import { create as createMouse } from '../../cy/mouse'
import { Keyboard } from '../../cy/keyboard'
import type { StateFunc } from '../../cypress/state'
import type {
  ActionOptions,
  ActionResult,
  AgentContext,
  AgentError,
  AgentResponse,
  ClearLocalStorageArgs,
  ClickArgs,
  ElementArgs,
  ScrollIntoViewArgs,
  ScrollOptions,
  ScrollToArgs,
  SelectArgs,
  SelectFileArgs,
  TriggerArgs,
  QueryStep,
  RemoteElementProps,
  ResolveArgs,
  ResolveResult,
  TypeArgs,
} from '../protocol'
import { AGENT_GLOBAL } from '../protocol'

const RETRY_INTERVAL = 16

const shim = installCypressShim()

const stateStore: Record<string, any> = {}

const state = function (key, value?) {
  if (_.isObject(key)) {
    return _.extend(stateStore, key)
  }

  if (arguments.length === 2) {
    stateStore[key] = value

    return value
  }

  return stateStore[key]
} as StateFunc

// the agent lives in the AUT frame, so the reused code's AUT window is its own
state({ window, document })

const focused = createFocused(state)
const keyboard = new Keyboard(state)

// created per call because it reads the browser from the shim when constructed
const getMouse = () => createMouse(state, keyboard, focused, shim)

const runSteps = (steps: QueryStep[]): JQuery<any> => {
  let $current: JQuery<any> | null = null

  for (const step of steps) {
    switch (step.type) {
      case 'get':
        $current = $dom.query(step.selector, step.includeShadowDom ? [...findAllShadowRoots(document), document] : document)
        break
      case 'traversal':
        $current = traverse($, step.method, !!step.includeShadowDom, $current ?? $(document), ...step.args)
        break
      case 'shadow':
        $current = ($current ?? $()).map((i, el) => el.shadowRoot).filter((i, root) => root != null)
        break
      case 'focused':
        $current = focused.getFocused(document) ?? $()
        break
      case 'contains': {
        const $scope = $current?.length ? $current : $(document.body)
        let $el = $()

        $scope.each((i, el) => {
          $el = $el.add($dom.query(step.selector, el))
        })

        // contains also matches the scope itself when none of its descendants do
        if (!$el.length) {
          $el = $scope.filter(step.selector)
        }

        $current = $dom.getFirstDeepestElement($el)
        break
      }
      default:
        throw new Error(`Unknown query step: ${JSON.stringify(step)}`)
    }
  }

  return $current ?? $()
}

const getAttributes = (el: HTMLElement) => {
  const attributes: Record<string, string> = {}

  for (const attr of Array.from(el.attributes ?? [])) {
    attributes[attr.name] = attr.value
  }

  return attributes
}

const describe = (el: HTMLElement): RemoteElementProps => {
  const $el = $(el)

  // a shadow root from .shadow() is a node but not an element
  if (!el.tagName) {
    return { node: el.nodeName, tagName: el.nodeName.toLowerCase(), id: '', classes: [], text: el.textContent ?? '', html: (el as Partial<HTMLElement>).innerHTML ?? '', value: undefined, attributes: {}, visible: true, checked: false, selected: false, disabled: false, focused: false, focusable: false, empty: !el.childNodes.length }
  }

  return {
    node: String($dom.stringify($el, 'short')),
    tagName: el.tagName.toLowerCase(),
    id: el.id,
    classes: Array.from(el.classList ?? []),
    text: $el.text(),
    html: $el.html(),
    value: $el.val() as RemoteElementProps['value'],
    attributes: getAttributes(el),
    visible: $dom.isVisible(el),
    checked: $el.is(':checked'),
    selected: $el.is(':selected'),
    disabled: $el.is(':disabled'),
    focused: $dom.isFocused(el),
    focusable: $dom.isFocusable($el),
    empty: $el.is(':empty'),
  }
}

const resolve = ({ steps }: ResolveArgs): ResolveResult => {
  return { elements: runSteps(steps).toArray().map(describe) }
}

// The server reads the element by reference to ask CDP which frame it owns, or
// the string as the reason there isn't one
const frameOwner = (steps: QueryStep[]): HTMLElement | string => {
  const el = runSteps(steps).get(0)

  if (!el) {
    return 'found no element'
  }

  return ['iframe', 'frame'].includes(el.localName) ? el : `found <${el.localName}>, which is not an iframe`
}

// Stands in for `cy` inside actionability: it names the command and retries
// locally until the driver's timeout, so the checks and the events they gate
// run in one round trip.
const createActionCy = (name: string, timeout: number) => {
  const start = Date.now()

  return {
    state (key: string) {
      if (key === 'current') {
        return { get: (attr: string) => (attr === 'name' ? name : undefined) }
      }

      return undefined
    },
    subjectChain: () => [],
    retry (fn: () => any, options: { error?: any }) {
      if (options.error?.retry === false) {
        throw options.error
      }

      if (Date.now() - start + RETRY_INTERVAL >= timeout) {
        options.error.timedOut = true
        throw options.error
      }

      return Bluebird.delay(RETRY_INTERVAL).then(fn)
    },
  }
}

const getConfig = (context: AgentContext) => (key: string) => context.config[key]

const resolveSubject = (steps: QueryStep[], index: number) => runSteps(steps).eq(index)

const flagModifiers = (options: ActionOptions, press: boolean) => {
  const modifiers = { ctrlKey: 'Control', altKey: 'Alt', shiftKey: 'Shift', metaKey: 'Meta' } as const

  _.each(modifiers, (key, option) => {
    if (options[option]) {
      keyboard.flagModifier({ key }, press)
    }
  })
}

const verify = (name: string, context: AgentContext, args: ClickArgs, ensure: Record<string, boolean> | undefined, onReady: ($elToClick: JQuery<any>, coords: any) => any) => {
  const $el = resolveSubject(args.steps, args.index)
  const actionCy = createActionCy(name, args.timeout)

  return $actionability.verify(actionCy, $el, getConfig(context), { ...args.options, ...(ensure ? { ensure } : {}) }, {
    subjectFn: () => resolveSubject(args.steps, args.index),
    onScroll: _.noop,
    onReady,
  })
}

const click = (context: AgentContext, args: ClickArgs): Bluebird<ActionResult> => {
  const mouse = getMouse()

  const event = args.event ?? 'click'

  return verify(event, context, args, undefined, ($elToClick, coords) => {
    const forceEl = args.options.force && $elToClick.get(0)

    mouse.move(coords.fromElViewport, forceEl)
    flagModifiers(args.options, true)
    mouse[event](coords.fromElViewport, forceEl)
    flagModifiers(args.options, false)

    return { coords: _.pick(coords.fromAutWindow, 'x', 'y') }
  })
}

const type = (context: AgentContext, args: TypeArgs): Bluebird<ActionResult> => {
  const mouse = getMouse()
  const $subject = resolveSubject(args.steps, args.index)
  const alreadyFocused = $subject.length && $elements.isFocusedOrInFocused($subject.get(0))
  const ensure: Record<string, boolean> = alreadyFocused ? { notReadonly: true } : {
    position: true,
    visibility: true,
    notDisabled: true,
    notAnimating: true,
    notCovered: true,
    notReadonly: true,
  }

  // like the legacy driver's cy.clear, which types into text-like elements only
  if (args.clear && $subject.length && !$dom.isTextLike($subject.get(0))) {
    $errUtils.throwErrByPath('clear.invalid_element', { args: { word: $dom.isInputType($subject, 'text') ? 'input' : 'element', node: $dom.stringify($subject) } })
  }

  return verify(args.clear ? 'clear' : 'type', context, args, ensure, ($elToClick, coords) => {
    if (!$elements.isFocusedOrInFocused($elToClick.get(0))) {
      mouse.move(coords.fromElViewport, $elToClick.get(0))
      mouse.click(coords.fromElViewport, $elToClick.get(0))
    }

    const $el = resolveSubject(args.steps, args.index)

    return keyboard.type({
      $el,
      chars: args.chars,
      delay: args.options.delay,
      release: args.options.release,
      parseSpecialCharSequences: args.options.parseSpecialCharSequences,
      window,
      force: args.options.force,
      updateValue (el, key) {
        return $selection.replaceSelectionContents(el, key)
      },
    } as any)
    .then(() => ({ coords: _.pick(coords.fromAutWindow, 'x', 'y') }))
  })
}

const pickCoords = (coords) => ({ coords: _.pick(coords.fromAutWindow, 'x', 'y') })

const focus = (context: AgentContext, { steps, index }: ElementArgs) => {
  const el = resolveSubject(steps, index).get(0)

  focused.fireFocus(el, {})

  if (context.browser.name === 'webkit' && ($elements.isInput(el) || $elements.isTextarea(el))) {
    $selection.moveSelectionToEnd(el, { onlyIfEmptySelection: true })
  }

  return null
}

const blur = (context: AgentContext, { steps, index }: ElementArgs) => {
  focused.fireBlur(resolveSubject(steps, index).get(0))

  return null
}

const submit = (context: AgentContext, { steps, index }: ElementArgs) => {
  const form = resolveSubject(steps, index).get(0)

  if (form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) {
    form.submit()
  }

  return null
}

const trigger = (context: AgentContext, args: TriggerArgs) => {
  return verify('trigger', context, args, undefined, ($elToTrigger, coords) => {
    dispatch($elToTrigger.get(0), window, args.eventName, addEventCoords({ ...args.eventOptions }, coords))

    return pickCoords(coords)
  })
}

// matches options by value or index first, then by text, as the legacy driver's cy.select
const findOptions = ($select: JQuery<any>, values: (string | number)[]) => {
  const options = $select.find('option').toArray().map((el, index) => {
    return { el, index, value: $elements.getNativeProp(el, 'value'), text: $(el).text().replace(/\n/g, '').trim() }
  })

  let matches = options.filter((option) => values.some((value) => (typeof value === 'number' ? value === option.index : value === option.value)))
  let notAllUniqueValues = matches.some((option) => $select.find(`option[value="${CSS.escape(option.value)}"]`).length > 1)

  if (!matches.length) {
    matches = options.filter((option) => values.includes(option.text))
    notAllUniqueValues = new Set(options.map((option) => option.value)).size !== options.length
  }

  return { matches, notAllUniqueValues }
}

const select = (context: AgentContext, args: SelectArgs) => {
  const mouse = getMouse()

  return verify('select', context, args, undefined, ($select, coords) => {
    const select = $select.get(0)
    const { matches, notAllUniqueValues } = findOptions($select, args.values)
    const value = args.values.join(', ')

    if (!$select.prop('multiple') && matches.length > 1) {
      $errUtils.throwErrByPath('select.multiple_matches', { args: { value } })
    }

    if (!matches.length && args.values.length) {
      $errUtils.throwErrByPath('select.no_matches', { args: { value } })
    }

    matches.forEach(({ el }) => {
      if ($(el).prop('disabled')) {
        $errUtils.throwErrByPath('select.option_disabled', { args: { node: $dom.stringify(el) } })
      }

      if ($(el).closest('optgroup').prop('disabled')) {
        $errUtils.throwErrByPath('select.optgroup_disabled', { args: { node: $dom.stringify(el) } })
      }
    })

    mouse.move(coords.fromElViewport, args.options.force && select)
    mouse.click(coords.fromElViewport, args.options.force && select)

    const oldIndex = select.selectedIndex

    $select.val(matches.map(({ value }) => value))

    if (notAllUniqueValues) {
      matches.forEach(({ el }) => $(el).prop('selected', true))
    }

    if (select.selectedIndex !== oldIndex) {
      select.dispatchEvent(new Event('input', { bubbles: true, cancelable: false }))
      select.dispatchEvent(new Event('change', { bubbles: true, cancelable: false }))
    }

    return pickCoords(coords)
  })
}

const fromBase64 = (contents: string) => Uint8Array.from(atob(contents), (char) => char.charCodeAt(0))

const selectFile = (context: AgentContext, args: SelectFileArgs) => {
  return verify('selectFile', context, args, undefined, ($subject, coords) => {
    let $target = $subject

    if (args.action === 'select') {
      if ($target.is('label')) {
        $target = $dom.getInputFromLabel($target)
      }

      if ($target.length < 1 || !$dom.isInputType($target, 'file')) {
        $errUtils.throwErrByPath('selectFile.not_file_input', { args: { node: $dom.stringify($subject) } })
      }
    }

    if (!args.options.force && $target.is(':disabled')) {
      $errUtils.throwErrByPath('dom.disabled', { args: { cmd: 'selectFile', node: $dom.stringify($target) } })
    }

    const files = args.files.map((file) => ({ ...file, contents: fromBase64(file.contents) }))

    SELECT_FILE_ACTIONS[args.action]($target.get(0), createDataTransfer(files, $target), coords, state)

    return pickCoords(coords)
  })
}

// jquery.scrollTo needs this to tell the window from an element
const asScrollContainer = (target) => {
  if (target === window) {
    Object.assign(window, { contentWindow: window })
  }

  return target
}

const runScroll = (target, to, scroll: ScrollOptions) => {
  return new Bluebird((resolve, reject) => {
    $(asScrollContainer(target)).scrollTo(to, {
      ...scroll,
      done: () => resolve(null),
      fail: () => {
        try {
          $errUtils.throwErrByPath('scrollTo.animation_failed')
        } catch (err) {
          reject(err)
        }
      },
      always: () => {
        if (target === window) {
          Reflect.deleteProperty(window, 'contentWindow')
        }
      },
    })
  })
}

const scrollIntoView = (context: AgentContext, { steps, index, scroll }: ScrollIntoViewArgs) => {
  const $el = resolveSubject(steps, index)
  const parent = findScrollableParent($el, window)

  if (parent !== window) {
    parent[0].scrollIntoView()
  }

  return runScroll(parent, $el, scroll)
}

// waits for the target to be scrollable, as the legacy driver's cy.scrollTo retries
const scrollTo = (context: AgentContext, args: ScrollToArgs) => {
  const start = Date.now()

  const attempt = () => {
    const $target = args.window ? $(window) : runSteps(args.steps)

    try {
      if (!args.window && $target.length > 1) {
        $errUtils.throwErrByPath('scrollTo.multiple_containers', { args: { num: $target.length } })
      }

      if (args.scroll.ensureScrollable && !$dom.isScrollable(args.window ? window : $target)) {
        $errUtils.throwErrByPath('dom.not_scrollable', { args: { cmd: 'scrollTo', node: args.window ? 'window' : $dom.stringify($target) } })
      }
    } catch (err) {
      if (Date.now() - start + RETRY_INTERVAL >= args.timeout) {
        err.timedOut = true
        throw err
      }

      return Bluebird.delay(RETRY_INTERVAL).then(attempt)
    }

    return runScroll(args.window ? window : $target.get(0), { left: args.x, top: args.y }, args.scroll)
  }

  return attempt()
}

// the agent shares the AUT's origin, and so its localStorage
const clearLocalStorage = (context: AgentContext, { keys }: ClearLocalStorageArgs) => {
  $LocalStorage.setStorages(null, window.localStorage)
  $LocalStorage.clear(keys === null || typeof keys === 'string' ? keys : new RegExp(keys.source, keys.flags))
  $LocalStorage.unsetStorages()

  return null
}

const serializeError = (err: any): AgentError => {
  return {
    name: err?.name ?? 'Error',
    message: err?.message ?? String(err),
    retry: err?.retry,
    type: err?.type,
    timedOut: err?.timedOut,
  }
}

const methods = {
  resolve: (context: AgentContext, args: ResolveArgs) => resolve(args),
  click,
  type,
  clearLocalStorage,
  focus,
  blur,
  submit,
  trigger,
  select,
  selectFile,
  scrollIntoView,
  scrollTo,
}

const call = async (method: keyof typeof methods, context: AgentContext, args: any): Promise<AgentResponse<unknown>> => {
  shim.setContext(context)

  try {
    return { ok: true, value: await methods[method](context, args) }
  } catch (err) {
    return { ok: false, error: serializeError(err) }
  }
}

window[AGENT_GLOBAL] = { call, frameOwner }
