import _ from 'lodash'
import { stripIndent } from 'common-tags'
import capitalize from 'underscore.string/capitalize'
import $stackUtils from './stack_utils'

const divider = (num, char) => {
  return Array(num).join(char)
}

const format = (data) => {
  if (_.isString(data)) {
    return _.truncate(data, { length: 2000 })
  }

  if (_.isObject(data)) {
    return JSON.stringify(data, null, 2)
  }

  return data
}

const formatConfigFile = (configFile) => {
  if (configFile === false) {
    return '`cypress.json` (currently disabled by --config-file=false)'
  }

  return `\`${format(configFile)}\``
}

const formatRedirects = (redirects = [], listIndentSize) => {
  return _.map(redirects, (redirect) => {
    return `${' '.repeat(listIndentSize)}  - ${redirect}`
  })
}

const formatProp = (memo, field): string[] => {
  const { key, value } = field

  if (value != null) {
    memo.push(`${capitalize(key)}: ${format(value)}`)
  }

  return memo
}

const cmd = (command, args = '') => {
  const prefix = command.startsWith('Cypress') ? '' : 'cy.'

  return `\`${prefix}${command}(${args})\``
}

const getScreenshotDocsPath = (cmd) => {
  if (cmd === 'Cypress.Screenshot.defaults') {
    return 'screenshot-api'
  }

  return 'screenshot'
}

const getRedirects = (obj, phrase, listIndentSize) => {
  const redirects = obj.redirects ?? []

  if (!redirects.length) {
    return ''
  }

  const word = redirects.length > 1 ? 'times' : 'time'

  const list = formatRedirects(redirects, listIndentSize)

  return [
    `${phrase} '${redirects.length}' ${word} to:`,
    '',
    `${list.join('\n')}`,
  ].join('\n')
}

const getHttpProps = (fields: { value: string, key: string }[] = []) => {
  return _
  .chain(fields)
  .reduce<string[]>(formatProp, [])
  .join('\n')
  .value()
}

// When a function that returns a multi-line string like getHttpProps()
// is used inside a template string(``) & stripIndent tag,
// the returned string doesn't respect the parent indent.
// It prevents `stripIndent` from stripping indent correctly.
// To avoid this problem, we need to manually set the indent size to be stripped.
//
// cyStripIndent strips the indent in a line if it begins with that indent size or bigger.
// If not, it ignores the line.
const cyStripIndent = (str, indentSize) => {
  const indent = ' '.repeat(indentSize)

  return str.split('\n').map((s) => {
    return s.startsWith(indent)
      ? s.substring(indentSize)
      : s
  }).join('\n')
}

export default {
  add: {
    type_missing: '`Cypress.add(key, fn, type)` must include a type!',
  },

  alias: {
    invalid: 'Invalid alias: `{{name}}`.\nYou forgot the `@`. It should be written as: `@{{displayName}}`.',
    not_registered_with_available: `${cmd('{{cmd}}')} could not find a registered alias for: \`@{{displayName}}\`.\nAvailable aliases are: \`{{availableAliases}}\`.`,
    not_registered_without_available: `${cmd('{{cmd}}')} could not find a registered alias for: \`@{{displayName}}\`.\nYou have not aliased anything yet.`,
  },

  as: {
    docsUrl: 'https://on.cypress.io/as',
    empty_string: {
      message: `${cmd('as')} cannot be passed an empty string.`,
    },
    invalid_type: {
      message: `${cmd('as')} can only accept a string.`,
    },
    invalid_first_token: {
      message: '`{{alias}}` cannot be named starting with the `@` symbol. Try renaming the alias to `{{suggestedName}}`, or something else that does not start with the `@` symbol.',
    },
    reserved_word: {
      message: `${cmd('as')} cannot be aliased as: \`{{alias}}\`. This word is reserved.`,
    },
  },

  selectFile: {
    docsUrl: 'https://on.cypress.io/selectfile',
    invalid_action: {
      message: `${cmd('selectFile')} \`action\` can only be \`select\` or \`drag-drop\`. You passed: \`{{action}}\`.`,
    },
    invalid_array_file_reference: {
      message: `${cmd('selectFile')} must be passed an array of Buffers or objects with non-null \`contents\`. At files[{{index}}] you passed: \`{{file}}\`.`,
    },
    invalid_single_file_reference: {
      message: `${cmd('selectFile')} must be passed a Buffer or an object with a non-null \`contents\` property as its 1st argument. You passed: \`{{file}}\`.`,
    },
    multiple_elements: {
      message: `${cmd('selectFile')} can only be called on a single element. Your subject contained {{num}} elements.`,
    },
    not_file_input: {
      message: `${cmd('selectFile')} can only be called on an \`<input type="file">\` or a \`<label for="fileInput">\` pointing to or containing one. Your subject is: \`{{node}}\`.`,
    },
    invalid_alias: {
      message: `${cmd('selectFile')} can only attach strings, Buffers or objects, while your alias \`{{alias}}\` resolved to: \`{{subject}}\`.`,
    },
  },

  blur: {
    docsUrl: 'https://on.cypress.io/blur',
    multiple_elements: {
      message: `${cmd('blur')} can only be called on a single element. Your subject contained {{num}} elements.`,
    },
    no_focused_element: {
      message: `${cmd('blur')} can only be called when there is a currently focused element.`,
    },
    timed_out: {
      message: `${cmd('blur')} timed out because your browser did not receive any \`blur\` events. This is a known bug in Chrome when it is not the currently focused window.`,
    },
    wrong_focused_element: {
      message: `${cmd('blur')} can only be called on the focused element. Currently the focused element is a: \`{{node}}\``,
    },
  },

  browser: {
    invalid_arg: '{{prefix}} must be passed a string, object, or an array. You passed: `{{obj}}`',
  },

  chai: {
    length_invalid_argument: 'You must provide a valid number to a `length` assertion. You passed: `{{length}}`',
    match_invalid_argument: '`match` requires its argument be a `RegExp`. You passed: `{{regExp}}`',
    invalid_jquery_obj (obj) {
      return stripIndent`\
        You attempted to make a chai-jQuery assertion on an object that is neither a DOM object or a jQuery object.

        The chai-jQuery assertion you used was:

          > ${obj.assertion}

        The invalid subject you asserted on was:

          > ${obj.subject}

        To use chai-jQuery assertions your subject must be valid.

        This can sometimes happen if a previous assertion changed the subject.`
    },
  },

  check_uncheck: {
    invalid_element: {
      message: `${cmd('{{cmd}}')} can only be called on \`:checkbox\`{{phrase}}. Your subject {{word}} a: \`{{node}}\``,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    element_missing_value_attribute: {
      message: `{{node}} cannot be checked/unchecked because it has no \`value\` attribute and ${cmd('{{cmd}}')} was supplied a value argument`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
  },

  clear: {
    invalid_element: {
      message: stripIndent`\
        ${cmd('clear')} failed because it requires a valid clearable element.

        The element cleared was:

          > \`{{node}}\`

        A clearable element matches one of the following selectors:
          'a[href]'
          'area[href]'
          'input'
          'select'
          'textarea'
          'button'
          'iframe'
          '[tabindex]'
          '[contenteditable]'`,
      docsUrl: 'https://on.cypress.io/clear',
    },
  },

  clearCookie: {
    invalid_argument: {
      message: `${cmd('clearCookie')} must be passed a string argument for name.`,
      docsUrl: 'https://on.cypress.io/clearcookie',
    },
  },

  clearLocalStorage: {
    invalid_argument: {
      message: `${cmd('clearLocalStorage')} must be called with either a string or regular expression.`,
      docsUrl: 'https://on.cypress.io/clearlocalstorage',
    },
  },

  click: {
    multiple_elements: {
      message: `${cmd('{{cmd}}')} can only be called on a single element. Your subject contained {{num}} elements. Pass \`{ multiple: true }\` if you want to serially click each element.`,
      docsUrl: 'https://on.cypress.io/click',
    },
    on_select_element: {
      message: `${cmd('{{cmd}}')} cannot be called on a \`<select>\` element. Use ${cmd('select')} command instead to change the value.`,
      docsUrl: 'https://on.cypress.io/select',
    },
  },

  clock: {
    invalid_1st_arg: {
      message: `${cmd('clock')} only accepts a number or an \`options\` object for its first argument. You passed: \`{{arg}}\``,
      docsUrl: 'https://on.cypress.io/clock',
    },
    invalid_2nd_arg: {
      message: `${cmd('clock')} only accepts an array of function names or an \`options\` object for its second argument. You passed: \`{{arg}}\``,
      docsUrl: 'https://on.cypress.io/clock',
    },
  },

  config: {
    invalid_argument: {
      message: `Setting the config via ${cmd('Cypress.config')} failed with the following validation error:\n\n{{errMsg}}`,
      docsUrl: 'https://on.cypress.io/config',
    },
    invalid_test_override: {
      message: `The config override passed to your test has the following validation error:\n\n{{errMsg}}`,
      docsUrl: 'https://on.cypress.io/config',
    },
    invalid_cypress_config_override: {
      message: `\`Cypress.config()\` cannot mutate option \`{{errProperty}}\` because it is a read-only property.`,
    },
    invalid_test_config_override: {
      message: `Cypress test configuration cannot mutate option \`{{errProperty}}\` because it is a read-only property.`,
    },
  },

  contains: {
    empty_string: {
      message: `${cmd('contains')} cannot be passed an empty string.`,
      docsUrl: 'https://on.cypress.io/contains',
    },
    invalid_argument: {
      message: `${cmd('contains')} can only accept a string, number or regular expression.`,
      docsUrl: 'https://on.cypress.io/contains',
    },
    length_option: {
      message: `${cmd('contains')} cannot be passed a \`length\` option because it will only ever return 1 element.`,
      docsUrl: 'https://on.cypress.io/contains',
    },
    regex_conflict: {
      message: `You passed a regular expression with the case-insensitive (_i_) flag and \`{ matchCase: true }\` to ${cmd('contains')}. Those options conflict with each other, so please choose one or the other.`,
      docsUrl: 'https://on.cypress.io/contains',
    },
  },

  cookies: {
    backend_error (obj) {
      return {
        message: [
          `${cmd('{{cmd}}')} had an unexpected error {{action}} {{browserDisplayName}}.`,
          ``,
          `> {{error}}`,
          ``,
        ].join('\n'),
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },

    invalid_name (obj) {
      return {
        message: `${cmd('{{cmd}}')} must be passed an RFC-6265-compliant cookie name. You passed:\n\n\`{{name}}\``,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
    timed_out (obj) {
      return {
        message: `${cmd('{{cmd}}')} timed out waiting \`{{timeout}}ms\` to complete.`,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
    whitelist_renamed (obj) {
      return {
        message: `\`${obj.type}\` \`whitelist\` option has been renamed to \`preserve\`. Please rename \`whitelist\` to \`preserve\`.`,
      }
    },
  },

  dom: {
    actionability_failed: stripIndent`
      ${cmd('{{cmd}}')} could not be issued because we could not determine the actionability of this element:

      \`{{node}}\`

      You can prevent this by passing \`{force: true}\` to disable all error checking.
    `,
    animating: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} could not be issued because this element is currently animating:

        \`{{node}}\`

        You can fix this problem by:
          - Passing \`{force: true}\` which disables all error checking
          - Passing \`{waitForAnimations: false}\` which disables waiting on animations
          - Passing \`{animationDistanceThreshold: 20}\` which decreases the sensitivity`,
      docsUrl: 'https://on.cypress.io/element-is-animating',
    },
    animation_check_failed: 'Not enough coord points provided to calculate distance.',
    center_hidden: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} failed because the center of this element is hidden from view:

        \`{{node}}\`

        Fix this problem, or use \`{force: true}\` to disable error checking.`,
      docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
    },
    covered: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} failed because this element:

        \`{{element1}}\`

        is being covered by another element:

        \`{{element2}}\`

        Fix this problem, or use {force: true} to disable error checking.`,
      docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
    },
    pointer_events_none (obj) {
      return {
        message: stripIndent`\
          ${cmd(obj.cmd)} failed because this element:

          \`${obj.element}\`

          has CSS \`pointer-events: none\`${obj.elementInherited ? `, inherited from this element:\n\n\`${obj.elementInherited}\`\n` : ''}

          \`pointer-events: none\` prevents user mouse interaction.

          Fix this problem, or use {force: true} to disable error checking.`,
        docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
      }
    },
    disabled: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} failed because this element is \`disabled\`:

        \`{{node}}\`

        Fix this problem, or use \`{force: true}\` to disable error checking.`,
      docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
    },
    invalid_position_argument: {
      message: 'Invalid position argument: `{{position}}`. Position may only be {{validPositions}}.',
      docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
    },
    not_scrollable: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} failed because this element is not scrollable:

        \`{{node}}\`

        Make sure you're targeting the correct element or use \`{ensureScrollable: false}\` to disable the scrollable check.`,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
    not_visible: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} failed because this element is not visible:

        \`{{node}}\`

        {{reason}}

        Fix this problem, or use \`{force: true}\` to disable error checking.`,
      docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
    },
    readonly: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} failed because this element is readonly:

        \`{{node}}\`

        Fix this problem, or use \`{force: true}\` to disable error checking.`,
      docsUrl: 'https://on.cypress.io/element-cannot-be-interacted-with',
    },
  },

  each: {
    invalid_argument: {
      message: `${cmd('each')} must be passed a callback function.`,
      docsUrl: 'https://on.cypress.io/each',
    },
    non_array: {
      message: `${cmd('each')} can only operate on an array like subject. Your subject was: \`{{subject}}\``,
      docsUrl: 'https://on.cypress.io/each',
    },
  },

  exec: {
    failed: {
      message: stripIndent`
        ${cmd('exec', '\'{{cmd}}\'')} failed with the following error:

        > "{{error}}"`,
      docsUrl: 'https://on.cypress.io/exec',
    },
    invalid_argument: {
      message: `${cmd('exec')} must be passed a non-empty string as its 1st argument. You passed: '{{cmd}}'.`,
      docsUrl: 'https://on.cypress.io/exec',
    },
    non_zero_exit: {
      message: stripIndent`\
        ${cmd('exec', '\'{{cmd}}\'')} failed because the command exited with a non-zero code.

        Pass \`{failOnNonZeroExit: false}\` to ignore exit code failures.

        Information about the failure:
        Code: {{code}}
        {{output}}`,
      docsUrl: 'https://on.cypress.io/exec',
    },
    timed_out: {
      message: `${cmd('exec', '\'{{cmd}}\'')} timed out after waiting \`{{timeout}}ms\`.`,
      docsUrl: 'https://on.cypress.io/exec',
    },
  },

  files: {
    unexpected_error (obj) {
      return {
        message: stripIndent`
          ${cmd('{{cmd}}', '"{{file}}"')} failed while trying to {{action}} the file at the following path:

            \`{{filePath}}\`

          The following error occurred:

            > "{{error}}"`,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
    existent (obj) {
      return {
        message: stripIndent`
          ${cmd('{{cmd}}', '"{{file}}"')} failed because the file exists when expected not to exist at the following path:

          \`{{filePath}}\``,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
    invalid_argument (obj) {
      return {
        message: `${cmd('{{cmd}}')} must be passed a non-empty string as its 1st argument. You passed: \`{{file}}\`.`,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
    invalid_contents: {
      message: `${cmd('writeFile')} must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: \`{{contents}}\`.`,
      docsUrl: 'https://on.cypress.io/writefile',
    },
    nonexistent (obj) {
      return {
        message: stripIndent`
          ${cmd('{{cmd}}', '"{{file}}"')} failed because the file does not exist at the following path:

          \`{{filePath}}\``,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
    timed_out (obj) {
      return {
        message: `${cmd('{{cmd}}', '"{{file}}"')} timed out after waiting \`{{timeout}}ms\`.`,
        docsUrl: `https://on.cypress.io/${_.toLower(obj.cmd)}`,
      }
    },
  },

  fixture: {
    set_to_false: {
      message: `${cmd('fixture')} is not valid because you have configured \`fixturesFolder\` to \`false\`.`,
      docsUrl: 'https://on.cypress.io/fixture',
    },
    timed_out: {
      message: `${cmd('fixture')} timed out waiting \`{{timeout}}ms\` to receive a fixture. No fixture was ever sent by the server.`,
      docsUrl: 'https://on.cypress.io/fixture',
    },
  },

  focus: {
    invalid_element: {
      message: `${cmd('focus')} can only be called on a valid focusable element. Your subject is a: \`{{node}}\``,
      docsUrl: 'https://on.cypress.io/focus',
    },
    multiple_elements: {
      message: `${cmd('focus')} can only be called on a single element. Your subject contained {{num}} elements.`,
      docsUrl: 'https://on.cypress.io/focus',
    },
    timed_out: {
      message: `${cmd('focus')} timed out because your browser did not receive any \`focus\` events. This is a known bug in Chrome when it is not the currently focused window.`,
      docsUrl: 'https://on.cypress.io/focus',
    },
  },

  get: {
    alias_invalid: {
      message: '`{{prop}}` is not a valid alias property. Only `numbers` or `all` is permitted.',
      docsUrl: 'https://on.cypress.io/get',
    },
    alias_zero: {
      message: '`0` is not a valid alias property. Are you trying to ask for the first response? If so write `@{{alias}}.1`',
      docsUrl: 'https://on.cypress.io/get',
    },
    invalid_options: {
      message: `${cmd('get')} only accepts an options object for its second argument. You passed {{options}}`,
      docsUrl: 'https://on.cypress.io/get',
    },
  },

  getCookie: {
    invalid_argument: {
      message: `${cmd('getCookie')} must be passed a string argument for name.`,
      docsUrl: 'https://on.cypress.io/getcookie',
    },
  },

  go: {
    invalid_argument: {
      message: `${cmd('go')} accepts only a string or number argument`,
      docsUrl: 'https://on.cypress.io/go',
    },
    invalid_direction: {
      message: `${cmd('go')} accepts either \`forward\` or \`back\`. You passed: \`{{str}}\``,
      docsUrl: 'https://on.cypress.io/go',
    },
    invalid_number: {
      message: `${cmd('go')} cannot accept \`0\`. The number must be greater or less than \`0\`.`,
      docsUrl: 'https://on.cypress.io/go',
    },
  },

  hover: {
    not_implemented: {
      message: [
        `${cmd('hover')} is not currently implemented.`,
        'However it is usually easy to workaround.',
        'Read the following document for a detailed explanation.',
      ].join('\n'),
      docsUrl: 'https://on.cypress.io/hover',
    },
  },
  invoke: {
    prop_not_a_function: {
      message: stripIndent`\
        ${cmd('invoke')} errored because the property: \`{{prop}}\` returned a \`{{type}}\` value instead of a function. ${cmd('invoke')} can only be used on properties that return callable functions.

        ${cmd('invoke')} waited for the specified property \`{{prop}}\` to return a function, but it never did.

        If you want to assert on the property's value, then switch to use ${cmd('its')} and add an assertion such as:

        \`cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')\``,
      docsUrl: 'https://on.cypress.io/invoke',
    },
    subject_null_or_undefined: {
      message: stripIndent`\
        ${cmd('invoke')} errored because your subject is: \`{{value}}\`. You cannot invoke any functions such as \`{{prop}}\` on a \`{{value}}\` value.

        If you expect your subject to be \`{{value}}\`, then add an assertion such as:

        \`cy.wrap({{value}}).should('be.{{value}}')\``,
      docsUrl: 'https://on.cypress.io/invoke',
    },
    null_or_undefined_prop_value: {
      message: stripIndent`\
        ${cmd('invoke')} errored because the property: \`{{prop}}\` is not a function, and instead returned a \`{{value}}\` value.

        ${cmd('invoke')} waited for the specified property \`{{prop}}\` to become a callable function, but it never did.

        If you expect the property \`{{prop}}\` to be \`{{value}}\`, then switch to use ${cmd('its')} and add an assertion such as:

        \`cy.wrap({ foo: {{value}} }).its('foo').should('be.{{value}}')\``,
      docsUrl: 'https://on.cypress.io/invoke',
    },
  },

  its: {
    subject_null_or_undefined: {
      message: stripIndent`\
        ${cmd('its')} errored because your subject is: \`{{value}}\`. You cannot access any properties such as \`{{prop}}\` on a \`{{value}}\` value.

        If you expect your subject to be \`{{value}}\`, then add an assertion such as:

        \`cy.wrap({{value}}).should('be.{{value}}')\``,
      docsUrl: 'https://on.cypress.io/its',
    },
    null_or_undefined_prop_value: {
      message: stripIndent`\
        ${cmd('its')} errored because the property: \`{{prop}}\` returned a \`{{value}}\` value.

        ${cmd('its')} waited for the specified property \`{{prop}}\` to become accessible, but it never did.

        If you expect the property \`{{prop}}\` to be \`{{value}}\`, then add an assertion such as:

        \`cy.wrap({ foo: {{value}} }).its('foo').should('be.{{value}}')\``,
      docsUrl: 'https://on.cypress.io/its',
    },
  },

  invoke_its: {
    nonexistent_prop: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} errored because the property: \`{{prop}}\` does not exist on your subject.

        ${cmd('{{cmd}}')} waited for the specified property \`{{prop}}\` to exist, but it never did.

        If you do not expect the property \`{{prop}}\` to exist, then add an assertion such as:

        \`cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')\``,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    previous_prop_null_or_undefined: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} errored because the property: \`{{previousProp}}\` returned a \`{{value}}\` value. The property: \`{{prop}}\` does not exist on a \`{{value}}\` value.

        ${cmd('{{cmd}}')} waited for the specified property \`{{prop}}\` to become accessible, but it never did.

        If you do not expect the property \`{{prop}}\` to exist, then add an assertion such as:

        \`cy.wrap({ foo: {{value}} }).its('foo.baz').should('not.exist')\``,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    invalid_1st_arg: {
      message: `${cmd('{{cmd}}')} only accepts a string as the first argument.`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    invalid_num_of_args: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} does not accept additional arguments.

        If you want to invoke a function with arguments, use \`.invoke()\`.`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    invalid_options_arg: {
      message: `${cmd('{{cmd}}')} only accepts an object as the options argument.`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    invalid_prop_name_arg: {
      message: `${cmd('{{cmd}}')} only accepts a string or a number as the {{identifier}}Name argument.`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    null_or_undefined_property_name: {
      message: `${cmd('{{cmd}}')} expects the {{identifier}}Name argument to have a value.`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
    timed_out: {
      message: stripIndent`\
        ${cmd('{{cmd}}')} timed out after waiting \`{{timeout}}ms\`.

        Your callback function returned a promise that never resolved.

        The callback function was:

        {{func}}`,
      docsUrl: 'https://on.cypress.io/{{cmd}}',
    },
  },

  keyboard: {
    invalid_arg: {
      message: `${cmd('Cypress.Keyboard.defaults')} must be called with an object. You passed: \`{{arg}}\``,
      docsUrl: 'https://on.cypress.io/keyboard-api',
    },
    invalid_delay ({ cmd: command, option, delay, docsPath }) {
      return {
        message: `${cmd(command)} \`${option}\` option must be 0 (zero) or a positive number. You passed: \`${delay}\``,
        docsUrl: `https://on.cypress.io/${docsPath}`,
      }
    },
    invalid_per_test_delay: {
      message: `The test configuration \`keystrokeDelay\` option must be 0 (zero) or a positive number. You passed: \`{{delay}}\``,
      docsUrl: 'https://on.cypress.io/test-configuration',
    },
  },

  location: {
    invalid_key: {
      message: 'Location object does not have key: `{{key}}`',
      docsUrl: 'https://on.cypress.io/location',
    },
  },

  log: {
    invalid_argument: {
      message: '`Cypress.log()` can only be called with an options object. Your argument was: `{{arg}}`',
      docsUrl: 'https://on.cypress.io/cypress-log',
    },
  },

  miscellaneous: {
    returned_value_and_commands_from_custom_command (obj) {
      return {
        message: stripIndent`\
          Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.

          The custom command was:

            > ${cmd(obj.current)}

          The return value was:

            > {{returned}}

          Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

          For convenience, you can also simply omit any return value or return \`undefined\` and Cypress will not error.

          In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.`
        // since obj.returned can be multi-lined, it can mess up stripIndent, so we replace it after
        .replace('{{returned}}', obj.returned),
        docsUrl: 'https://on.cypress.io/returning-value-and-commands-in-custom-command',
      }
    },
    returned_value_and_commands (obj) {
      return {
        message: stripIndent`\
          Cypress detected that you invoked one or more cy commands but returned a different value.

          The return value was:

          > {{returned}}

          Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

          For convenience, you can also simply omit any return value or return \`undefined\` and Cypress will not error.

          In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.`
        // since obj.returned can be multi-lined, it can mess up stripIndent, so we replace it after
        .replace('{{returned}}', obj.returned),
        docsUrl: 'https://on.cypress.io/returning-value-and-commands-in-test',
      }
    },
    command_returned_promise_and_commands (obj) {
      return {
        message: stripIndent`\
          Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.

          The command that returned the promise was:

            > ${cmd(obj.current)}

          The cy command you invoked inside the promise was:

            > ${cmd(obj.called)}

          Because Cypress commands are already promise-like, you don't need to wrap them or return your own promise.

          Cypress will resolve your command with whatever the final Cypress command yields.

          The reason this is an error instead of a warning is because Cypress internally queues commands serially whereas Promises execute as soon as they are invoked. Attempting to reconcile this would prevent Cypress from ever resolving.`,
        docsUrl: 'https://on.cypress.io/returning-promise-and-commands-in-another-command',
      }
    },
    mixing_promises_and_commands (obj) {
      return {
        message: stripIndent`\
          Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.

          The test title was:

            > ${obj.title}

          While this works in practice, it's often indicative of an anti-pattern. You almost never need to return both a promise and also invoke cy commands.

          Cy commands themselves are already promise like, and you can likely avoid the use of the separate Promise.`,
        docsUrl: 'https://on.cypress.io/returning-promise-and-commands-in-test',
      }
    },
    dangling_commands: {
      message: stripIndent`\
        Oops, Cypress detected something wrong with your test code.

        The test has finished but Cypress still has commands in its queue.
        The {{numCommands}} queued commands that have not yet run are:

        {{commands}}

        In every situation we've seen, this has been caused by programmer error.

        Most often this indicates a race condition due to a forgotten 'return' or from commands in a previously run test bleeding into the current test.

        For a much more thorough explanation including examples please review this error here:`,
      docsUrl: 'https://on.cypress.io/command-queue-ended-early',
    },
    invalid_command: {
      message: 'Could not find a command for: `{{name}}`.\n\nAvailable commands are: {{cmds}}.\n',
      docsUrl: 'https://on.cypress.io/api',
    },
    invalid_new_command: {
      message: '`Cypress.Commands.add()` is used to create new commands, but `{{name}}` is an existing Cypress command.\n\nPlease use `Cypress.Commands.overwrite()` if you would like to overwrite an existing command.\n',
      docsUrl: 'https://on.cypress.io/custom-commands',
    },
    invalid_overwrite: {
      message: 'Cannot overwite command for: `{{name}}`. An existing command does not exist by that name.',
      docsUrl: 'https://on.cypress.io/api',
    },
    invoking_child_without_parent (obj) {
      return stripIndent`\
        Oops, it looks like you are trying to call a child command before running a parent command.

        You wrote code that looks like this:

        \`${cmd(obj.cmd, obj.args)}\`

        A child command must be chained after a parent because it operates on a previous subject.

        For example - if we were issuing the child command \`click\`...

        cy
          .get('button') // parent command must come first
          .click()       // then child command comes second`
    },
    no_cy: '`Cypress.cy` is `undefined`. You may be trying to query outside of a running test. Cannot call `Cypress.$()`',
    no_runner: 'Cannot call `Cypress#run` without a runner instance.',
    outside_test: {
      message: stripIndent`\
        Cypress cannot execute commands outside a running test.

        This usually happens when you accidentally write commands outside an \`it(...)\` test.

        If that is the case, just move these commands inside an \`it(...)\` test.

        Check your test file for errors.`,
      docsUrl: 'https://on.cypress.io/cannot-execute-commands-outside-test',
    },
    outside_test_with_cmd: {
      message: stripIndent`\
        Cannot call ${cmd('{{cmd}}')} outside a running test.

        This usually happens when you accidentally write commands outside an \`it(...)\` test.

        If that is the case, just move these commands inside an \`it(...)\` test.

        Check your test file for errors.`,
      docsUrl: 'https://on.cypress.io/cannot-execute-commands-outside-test',
    },
    private_custom_command_interface: 'You cannot use the undocumented private command interface: `{{method}}`',
    retry_timed_out ({ ms }) {
      return `Timed out retrying after ${ms}ms: `
    },
  },

  mocha: {
    async_timed_out: 'Timed out after `{{ms}}ms`. The `done()` callback was never invoked!',
    invalid_interface: 'Invalid mocha interface `{{name}}`',
    timed_out: 'Cypress command timeout of `{{ms}}ms` exceeded.',
    overspecified: {
      message: stripIndent`\
        Cypress detected that you returned a promise in a test, but also invoked a done callback. Return a promise -or- invoke a done callback, not both.

        Original mocha error:

        {{error}}`,
      docsUrl: 'https://on.cypress.io/returning-promise-and-invoking-done-callback',
    },
    manually_set_retries_test: stripIndent`\
    Mocha \`this.retries()\` syntax is not supported.

    To configure retries use the following syntax:

    \`\`\`
    it('{{title}}', { retries: {{numRetries}} }, () => {
      ...
    })
    \`\`\`

    https://on.cypress.io/test-retries
    `,
    manually_set_retries_suite: stripIndent`\
    Mocha \`this.retries()\` syntax is not supported.

    To configure retries use the following syntax:

    \`\`\`
    describe('{{title}}', { retries: {{numRetries}} }, () => {
      ...
    })
    \`\`\`

    https://on.cypress.io/test-retries
    `,
    hook_registered_late: stripIndent`\
    Cypress detected you registered a(n) \`{{hookTitle}}\` hook while a test was running (possibly a hook nested inside another hook). All hooks must be registered before a test begins executing.

    Move the \`{{hookTitle}}\` into a suite callback or the global scope.
    `,

  },

  navigation: {
    cross_origin ({ message, originPolicy, configFile }) {
      return {
        message: stripIndent`\
          Cypress detected a cross origin error happened on page load:

            > ${message}

          Before the page load, you were bound to the origin policy:

            > ${originPolicy}

          A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.

          A new URL does not match the origin policy if the 'protocol', 'port' (if specified), and/or 'host' (unless of the same superdomain) are different.

          Cypress does not allow you to navigate to a different origin URL within a single test.

          You may need to restructure some of your test code to avoid this problem.

          Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in ${formatConfigFile(configFile)}.`,
        docsUrl: 'https://on.cypress.io/cross-origin-violation',
      }
    },
    timed_out ({ ms, configFile }) {
      return stripIndent`\
        Timed out after waiting \`${ms}ms\` for your remote page to load.

        Your page did not fire its \`load\` event within \`${ms}ms\`.

        You can try increasing the \`pageLoadTimeout\` value in ${formatConfigFile(configFile)} to wait longer.

        Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

        When this \`load\` event occurs, Cypress will continue running commands.`
    },
    reached_redirection_limit ({ href, limit }) {
      return stripIndent`\
        The application redirected to \`${href}\` more than ${limit} times. Please check if it's an intended behavior.

        If so, increase \`redirectionLimit\` value in configuration.`
    },
  },

  net_stubbing: {
    docsUrl: 'https://on.cypress.io/intercept',
    invalid_static_response: ({ cmd, message, staticResponse }) => {
      return cyStripIndent(`\
        An invalid StaticResponse was supplied to \`${cmd}()\`. ${message}

        You passed: ${format(staticResponse)}`, 8)
    },
    intercept: {
      extra_arguments: ({ argsLength, overload }) => {
        return cyStripIndent(`\
          The ${cmd('intercept', overload.join(', '))} signature accepts a maximum of ${overload.length} arguments, but ${argsLength} arguments were passed.

          Please refer to the docs for all accepted signatures for ${cmd('intercept')}.`, 10)
      },
      invalid_handler: ({ handler }) => {
        return cyStripIndent(`\
          ${cmd('intercept')}'s \`handler\` argument must be a String, StaticResponse, or HttpController function.

          You passed: ${format(handler)}`, 10)
      },
      invalid_middleware_handler: ({ handler }) => {
        return cyStripIndent(`\
          ${cmd('intercept')}'s \`handler\` argument must be an HttpController function when \`middleware\` is set to \`true\`.

          You passed: ${format(handler)}`, 10)
      },
      invalid_route_matcher: ({ message, matcher }) => {
        return cyStripIndent(`\
          An invalid RouteMatcher was supplied to ${cmd('intercept')}. ${message}

          You passed: ${format(matcher)}`, 10)
      },
      no_duplicate_url: `When invoking ${cmd('intercept')} with a \`RouteMatcher\` as the second parameter, \`url\` can only be specified as the first parameter.`,
      handler_required: `When invoking ${cmd('intercept')} with a \`RouteMatcher\` as the second parameter, a handler (function or \`StaticResponse\`) must be specified as the third parameter. If you intended to stub out a response body by passing an object as the 2nd parameter, pass an object with a \`body\` property containing the desired response body instead.`,
    },
    request_handling: {
      cb_timeout: ({ timeout, req, route }) => {
        return cyStripIndent(`\
          A request callback passed to ${cmd('intercept')} timed out after returning a Promise that took more than the \`defaultCommandTimeout\` of \`${timeout}ms\` to resolve.

          If the request callback is expected to take longer than \`${timeout}ms\`, increase the configured \`defaultCommandTimeout\` value.

          Route: ${format(route)}

          Intercepted request: ${format(req)}`, 10)
      },
      multiple_completion_calls: `\`req.reply()\` and/or \`req.continue()\` were called to signal request completion multiple times, but a request can only be completed once.`,
      completion_called_after_resolved: ({ cmd }) => {
        return cyStripIndent(`\
          \`req.${cmd}()\` was called after the request handler finished executing, but \`req.${cmd}()\` can not be called after the request has already completed.`, 10)
      },
      unknown_event: ({ validEvents, eventName }) => {
        return cyStripIndent(`\
          An invalid event name was passed as the first parameter to \`req.on()\`.

          Valid event names are: ${format(validEvents)}

          You passed: ${format(eventName)}`, 10)
      },
      event_needs_handler: `\`req.on()\` requires the second parameter to be a function.`,
      defineproperty_is_not_allowed: `\`defineProperty()\` is not allowed.`,
      setprototypeof_is_not_allowed: `\`setPrototypeOf()\` is not allowed.`,
    },
    request_error: {
      network_error: ({ innerErr, req, route }) => {
        return cyStripIndent(`\
          A callback was provided to intercept the upstream response, but a network error occurred while making the request:

          ${$stackUtils.normalizedStack(innerErr)}

          Route: ${format(route)}

          Intercepted request: ${format(req)}`, 10)
      },
      timeout: ({ innerErr, req, route }) => {
        return cyStripIndent(`\
          A callback was provided to intercept the upstream response, but the request timed out after the \`responseTimeout\` of \`${req.responseTimeout}ms\`.

          ${$stackUtils.normalizedStack(innerErr)}

          Route: ${format(route)}

          Intercepted request: ${format(req)}`, 10)
      },
    },
    response_handling: {
      cb_timeout: ({ timeout, req, res, route }) => {
        return cyStripIndent(`\
          A response handler timed out after returning a Promise that took more than the \`defaultCommandTimeout\` of \`${timeout}ms\` to resolve.

          If the response callback is expected to take longer than \`${timeout}ms\`, increase the configured \`defaultCommandTimeout\` value.

          Route: ${format(route)}

          Intercepted request: ${format(req)}

          Intercepted response: ${format(res)}`, 10)
      },
      multiple_send_calls: ({ res }) => {
        return cyStripIndent(`\
          \`res.send()\` was called multiple times in a response handler, but the response can only be sent once.

          Response: ${format(res)}`, 10)
      },
      send_called_after_resolved: ({ res }) => {
        return cyStripIndent(`\
          \`res.send()\` was called after the response handler finished executing, but \`res.send()\` can not be called after the response has been passed on.

          Intercepted response: ${format(res)}`, 10)
      },
    },
  },

  ng: {
    no_global: `Angular global (\`window.angular\`) was not found in your window. You cannot use ${cmd('ng')} methods without angular.`,
  },

  proxy: {
    js_rewriting_failed: stripIndent`\
      An error occurred in the Cypress proxy layer while rewriting your source code. This is a bug in Cypress. Open an issue if you see this message.

      JS URL: {{url}}

      Original error:

      {{errMessage}}
      {{errStack}}`,
  },

  reload: {
    invalid_arguments: {
      message: `${cmd('reload')} can only accept a boolean or \`options\` as its arguments.`,
      docsUrl: 'https://on.cypress.io/reload',
    },
  },

  request: {
    body_circular ({ path }) {
      return {
        message: stripIndent`\
          The \`body\` parameter supplied to ${cmd('request')} contained a circular reference at the path "${path.join('.')}".

          \`body\` can only be a string or an object with no circular references.`,
        docsUrl: 'https://on.cypress.io/request',
      }
    },
    status_code_flags_invalid: {
      message: stripIndent`\
        ${cmd('request')} was invoked with \`{ failOnStatusCode: false, retryOnStatusCodeFailure: true }\`.

        \`failOnStatusCode\` must be \`true\` if \`retryOnStatusCodeFailure\` is \`true\`.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    auth_invalid: {
      message: `${cmd('request')} must be passed an object literal for the \`auth\` option.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    encoding_invalid: {
      message: `${cmd('request')} was called with invalid encoding: \`{{encoding}}\`. Encoding can be: \`utf8\`, \`utf16le\`, \`latin1\`, \`base64\`, \`hex\`, \`ascii\`, \`binary\`, \`latin1\`, \`ucs2\`, \`utf16le\`, or any other encoding supported by Node\'s Buffer encoding.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    gzip_invalid: {
      message: `${cmd('request')} requires the \`gzip\` option to be a boolean.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    headers_invalid: {
      message: `${cmd('request')} requires the \`headers\` option to be an object literal.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    invalid_method: {
      message: `${cmd('request')} was called with an invalid method: \`{{method}}\`. Method can be: \`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, \`PATCH\`, \`HEAD\`, \`OPTIONS\`, or any other method supported by Node's HTTP parser.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    form_invalid: {
      message: stripIndent`\
        ${cmd('request')} requires the \`form\` option to be a boolean.

        If you're trying to send a \`x-www-form-urlencoded\` request then pass either a string or object literal to the \`body\` property.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    /* eslint-disable indent */
    loading_failed (obj) {
      return {
        message: cyStripIndent(`\
          ${cmd('request')} failed trying to load:

          ${obj.url}

          We attempted to make an http request to this URL but the request failed without a response.

          We received this error at the network level:

            > ${obj.error}

          ${divider(60, '-')}

          The request we sent was:

          ${getHttpProps([
          { key: 'method', value: obj.method },
          { key: 'URL', value: obj.url },
        ])}

          ${divider(60, '-')}

          Common situations why this would fail:
            - you don't have internet access
            - you forgot to run / boot your web server
            - your web server isn't accessible
            - you have weird network configuration settings on your computer`, 10),
        docsUrl: 'https://on.cypress.io/request',
      }
    },
    status_invalid (obj) {
      return {
        message: cyStripIndent(`\
          ${cmd('request')} failed on:

          ${obj.url}

          The response we received from your web server was:

            > ${obj.status}: ${obj.statusText}

          This was considered a failure because the status code was not \`2xx\` or \`3xx\`.

          If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\`

          ${divider(60, '-')}

          The request we sent was:

          ${getHttpProps([
          { key: 'method', value: obj.method },
          { key: 'URL', value: obj.url },
          { key: 'headers', value: obj.requestHeaders },
          { key: 'body', value: obj.requestBody },
          { key: 'redirects', value: obj.redirects },
        ])}

          ${divider(60, '-')}

          The response we got was:

          ${getHttpProps([
          { key: 'status', value: `${obj.status} - ${obj.statusText}` },
          { key: 'headers', value: obj.responseHeaders },
          { key: 'body', value: obj.responseBody },
        ])}
          `, 10),
        docsUrl: 'https://on.cypress.io/request',
      }
    },
    timed_out (obj) {
      return {
        message: cyStripIndent(`\
          ${cmd('request')} timed out waiting \`${obj.timeout}ms\` for a response from your server.

          The request we sent was:

          ${getHttpProps([
          { key: 'method', value: obj.method },
          { key: 'URL', value: obj.url },
        ])}

          No response was received within the timeout.`, 10),
        docsUrl: 'https://on.cypress.io/request',
      }
    },
    /* eslint-enable indent */
    url_missing: {
      message: `${cmd('request')} requires a \`url\`. You did not provide a \`url\`.`,
      docsUrl: 'https://on.cypress.io/request',
    },
    url_invalid ({ configFile }) {
      return {
        message: `${cmd('request')} must be provided a fully qualified \`url\` - one that begins with \`http\`. By default ${cmd('request')} will use either the current window's origin or the \`baseUrl\` in ${formatConfigFile(configFile)}. Neither of those values were present.`,
        docsUrl: 'https://on.cypress.io/request',
      }
    },
    url_wrong_type: {
      message: `${cmd('request')} requires the \`url\` to be a string.`,
      docsUrl: 'https://on.cypress.io/request',
    },
  },

  route: {
    deprecated: {
      message: `${cmd('route')} has been deprecated and will be moved to a plugin in a future release. Consider migrating to using ${cmd('intercept')} instead.`,
      docsUrl: 'https://on.cypress.io/intercept',
    },
    failed_prerequisites: {
      message: `${cmd('route')} cannot be invoked before starting the ${cmd('server')}`,
      docsUrl: 'https://on.cypress.io/server',
    },
    invalid_arguments: {
      message: `${cmd('route')} was not provided any arguments. You must provide valid arguments.`,
      docsUrl: 'https://on.cypress.io/route',
    },
    method_invalid: {
      message: `${cmd('route')} was called with an invalid method: \`{{method}}\`. Method can be: \`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, \`PATCH\`, \`HEAD\`, \`OPTIONS\`, or any other method supported by Node's HTTP parser.`,
      docsUrl: 'https://on.cypress.io/route',
    },
    response_invalid: {
      message: `${cmd('route')} cannot accept an \`undefined\` or \`null\` response. It must be set to something, even an empty string will work.`,
      docsUrl: 'https://on.cypress.io/route',
    },
    url_invalid: {
      message: `${cmd('route')} was called with an invalid \`url\`. \`url\` must be either a string or regular expression.`,
      docsUrl: 'https://on.cypress.io/route',
    },
    url_missing: {
      message: `${cmd('route')} must be called with a \`url\`. It can be a string or regular expression.`,
      docsUrl: 'https://on.cypress.io/route',
    },
    url_percentencoding_warning ({ decodedUrl }) {
      return {
        message: stripIndent`\
          A \`url\` with percent-encoded characters was passed to ${cmd('route')}, but ${cmd('route')} expects a decoded \`url\`.

          Did you mean to pass "${decodedUrl}"?`,
        docsUrl: 'https://on.cypress.io/route',
      }
    },
  },

  scrollIntoView: {
    invalid_argument: {
      message: `${cmd('scrollIntoView')} can only be called with an \`options\` object. Your argument was: \`{{arg}}\``,
      docsUrl: 'https://on.cypress.io/scrollintoview',
    },
    multiple_elements: {
      message: `${cmd('scrollIntoView')} can only be used to scroll to 1 element, you tried to scroll to {{num}} elements.\n\n`,
      docsUrl: 'https://on.cypress.io/scrollintoview',
    },
    invalid_easing: {
      message: `${cmd('scrollIntoView')} must be called with a valid \`easing\`. Your easing was: \`{{easing}}\``,
      docsUrl: 'https://on.cypress.io/scrollintoview',
    },
    invalid_duration: {
      message: `${cmd('scrollIntoView')} must be called with a valid \`duration\`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: \`{{duration}}\``,
      docsUrl: 'https://on.cypress.io/scrollintoview',
    },
  },

  scrollTo: {
    animation_failed: {
      message: `${cmd('scrollTo')} failed to scroll.`,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
    invalid_easing: {
      message: `${cmd('scrollTo')} must be called with a valid \`easing\`. Your easing was: \`{{easing}}\``,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
    invalid_duration: {
      message: `${cmd('scrollTo')} must be called with a valid \`duration\`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: \`{{duration}}\``,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
    invalid_target: {
      message: `${cmd('scrollTo')} must be called with a valid \`position\`. It can be a string, number or object. Your position was: \`{{x}}, {{y}}\``,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
    multiple_containers: {
      message: `${cmd('scrollTo')} can only be used to scroll 1 element, you tried to scroll {{num}} elements.\n\n`,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
    invalid_ensureScrollable: {
      message: `${cmd('scrollTo')} \`ensureScrollable\` option must be a boolean. You passed: \`{{ensureScrollable}}\``,
      docsUrl: 'https://on.cypress.io/scrollto',
    },
  },

  screenshot: {
    invalid_arg (obj) {
      return {
        message: `${cmd(obj.cmd)} must be called with an object. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    invalid_capture (obj) {
      return {
        message: `${cmd(obj.cmd)} \`capture\` option must be one of the following: \`fullPage\`, \`viewport\`, or \`runner\`. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    invalid_boolean (obj) {
      return {
        message: `${cmd(obj.cmd)} \`{{option}}\` option must be a boolean. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    invalid_blackout (obj) {
      return {
        message: `${cmd(obj.cmd)} \`blackout\` option must be an array of strings. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    invalid_callback (obj) {
      return {
        message: `${cmd(obj.cmd)} \`{{callback}}\` option must be a function. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    invalid_clip (obj) {
      return {
        message: `${cmd(obj.cmd)} \`clip\` option must be an object with the keys \`{ width, height, x, y }\` and number values. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    invalid_height (obj) {
      return {
        message: `${cmd('screenshot')} only works with a screenshot area with a height greater than zero.`,
        docsUrl: 'https://on.cypress.io/screenshot',
      }
    },
    invalid_padding (obj) {
      return {
        message: `${cmd(obj.cmd)} \`padding\` option must be either a number or an array of numbers with a maximum length of 4. You passed: \`{{arg}}\``,
        docsUrl: `https://on.cypress.io/${getScreenshotDocsPath(obj.cmd)}`,
      }
    },
    multiple_elements: {
      message: `${cmd('screenshot')} only works for a single element. You attempted to screenshot {{numElements}} elements.`,
      docsUrl: 'https://on.cypress.io/screenshot',
    },
    timed_out: {
      message: `${cmd('screenshot')} timed out waiting \`{{timeout}}ms\` to complete.`,
      docsUrl: 'https://on.cypress.io/screenshot',
    },
  },

  select: {
    invalid_argument: {
      message: `${cmd('select')} must be passed a string, number, or array as its 1st argument. You passed: \`{{value}}\`.`,
      docsUrl: 'https://on.cypress.io/select',
    },
    invalid_array_argument: {
      message: `${cmd('select')} must be passed an array containing only strings and/or numbers. You passed: \`{{value}}\`.`,
      docsUrl: 'https://on.cypress.io/select',
    },
    disabled: {
      message: `${cmd('select')} failed because this element is currently disabled:\n\n\`{{node}}\``,
      docsUrl: 'https://on.cypress.io/select',
    },
    invalid_element: {
      message: `${cmd('select')} can only be called on a \`<select>\`. Your subject is a: \`{{node}}\``,
      docsUrl: 'https://on.cypress.io/select',
    },
    invalid_multiple: {
      message: `${cmd('select')} was called with an array of arguments but does not have a \`multiple\` attribute set.`,
      docsUrl: 'https://on.cypress.io/select',
    },
    invalid_number: {
      message: `${cmd('select')} was called with an invalid index: \`{{index}}\`. Index must be a non-negative integer.`,
      docsUrl: 'https://on.cypress.io/select',
    },
    multiple_elements: {
      message: `${cmd('select')} can only be called on a single \`<select>\`. Your subject contained {{num}} elements.`,
      docsUrl: 'https://on.cypress.io/select',
    },
    multiple_matches: {
      message: `${cmd('select')} matched more than one \`option\` by value or text: \`{{value}}\``,
      docsUrl: 'https://on.cypress.io/select',
    },
    no_matches: {
      message: `${cmd('select')} failed because it could not find a single \`<option>\` with value, index, or text matching: \`{{value}}\``,
      docsUrl: 'https://on.cypress.io/select',
    },
    option_disabled: {
      message: `${cmd('select')} failed because this \`<option>\` you are trying to select is currently disabled:\n\n\`{{node}}\``,
      docsUrl: 'https://on.cypress.io/select',
    },
    optgroup_disabled: {
      message: `${cmd('select')} failed because this \`<option>\` you are trying to select is within an \`<optgroup>\` that is currently disabled:\n\n\`{{node}}\``,
      docsUrl: 'https://on.cypress.io/select',
    },
  },

  selector_playground: {
    defaults_invalid_arg: {
      message: '`Cypress.SelectorPlayground.defaults()` must be called with an object. You passed: `{{arg}}`',
      docsUrl: 'https://on.cypress.io/selector-playground-api',
    },
    defaults_invalid_priority_type: {
      message: '`Cypress.SelectorPlayground.defaults()` called with invalid `selectorPriority` property. It must be an array. You passed: `{{arg}}`',
      docsUrl: 'https://on.cypress.io/selector-playground-api',
    },
    defaults_invalid_priority: {
      message: '`Cypress.SelectorPlayground.defaults()` called with invalid `selectorPriority` property. It must be one of: `data-*`, `id`, `class`, `tag`, `attributes`, `nth-child`. You passed: `{{arg}}`. Consider using the `onElement` property if a specific selector is desired.',
      docsUrl: 'https://on.cypress.io/selector-playground-api',
    },
    defaults_invalid_on_element: {
      message: '`Cypress.SelectorPlayground.defaults()` called with invalid `onElement` property. It must be a function. You passed: `{{arg}}`',
      docsUrl: 'https://on.cypress.io/selector-playground-api',
    },
  },

  server: {
    deprecated: {
      message: `${cmd('server')} has been deprecated and will be moved to a plugin in a future release. Consider migrating to using ${cmd('intercept')} instead.`,
      docsUrl: 'https://on.cypress.io/intercept',
    },
    invalid_argument: {
      message: `${cmd('server')} accepts only an object literal as its argument.`,
      docsUrl: 'https://on.cypress.io/server',
    },
    xhrurl_not_set: '`Server.options.xhrUrl` has not been set',
    unavailable: 'The XHR server is unavailable or missing. This should never happen and likely is a bug. Open an issue if you see this message.',
    whitelist_renamed: `The ${cmd('server')} \`whitelist\` option has been renamed to \`ignore\`. Please rename \`whitelist\` to \`ignore\`.`,
  },

  sessions: {
    validate_callback_false: {
      message: 'Your `cy.session` **validate** callback {{reason}}',
    },
    experimentNotEnabled: {
      message: 'experimentalSessionSupport is not enabled. You must enable the experimentalSessionSupport flag in order to use Cypress session commands',
      docsUrl: 'https://on.cypress.io/session',
    },
    session: {
      duplicateId: {
        message: stripIndent`
        You may not call ${cmd('session')} with a previously used name and different options. If you want to specify different options, please use a unique name other than **{{id}}**.
        `,
        docsUrl: 'https://on.cypress.io/session',
      },
      wrongArgId: {
        message: stripIndent`
        ${cmd('session')} was passed an invalid argument. The first argument \`id\` must be an string or serializable object.
        `,
        docsUrl: 'https://on.cypress.io/session',
      },
      wrongArgOptions: {
        message: stripIndent`
        ${cmd('session')} was passed an invalid argument. The optional third argument \`options\` must be an object.
        `,
        docsUrl: 'https://on.cypress.io/session',
      },
      wrongArgOptionUnexpected: {
        message: stripIndent`
        ${cmd('session')} was passed an invalid option: **{{key}}**
        Available options are: \`validate\`
        `,
        docsUrl: 'https://on.cypress.io/session',
      },
      wrongArgOptionInvalid: {
        message: stripIndent`
        ${cmd('session')} was passed an invalid option value. **{{key}}** must be of type **{{expected}}** but was **{{actual}}**.
        `,
        docsUrl: 'https://on.cypress.io/session',
      },
      not_found: {
        message: stripIndent`
        No session is defined with the name
          **{{id}}**
        In order to use ${cmd('session')}, provide a \`setup\` as the second argument:

        \`cy.session(id, setup)\`
        `,
        docsUrl: 'https://on.cypress.io/session',
      },
    },
  },

  setCookie: {
    invalid_arguments: {
      message: `${cmd('setCookie')} must be passed two string arguments for \`name\` and \`value\`.`,
      docsUrl: 'https://on.cypress.io/setcookie',
    },
    invalid_value: {
      message: `${cmd('setCookie')} must be passed an RFC-6265-compliant cookie value. You passed:\n\n\`{{value}}\``,
      docsUrl: 'https://on.cypress.io/setcookie',
    },
    invalid_samesite: ({ validValues, value }) => {
      return {
        message: stripIndent`\
          If a \`sameSite\` value is supplied to ${cmd('setCookie')}, it must be a string from the following list:
            > ${validValues.join(', ')}
          You passed:
            > ${format(value)}`,
        docsUrl: 'https://on.cypress.io/setcookie',
      }
    },
    secure_not_set_with_samesite_none: ({ validValues, value }) => {
      return {
        message: stripIndent`\
          Only cookies with the \`secure\` flag set to \`true\` can use \`sameSite: '{{value}}'\`.

          Pass \`secure: true\` to ${cmd('setCookie')} to set a cookie with \`sameSite: '{{value}}'\`.`,
        docsUrl: 'https://on.cypress.io/setcookie',
      }
    },
    host_prefix: {
      message: 'Cookies starting with the `__Host-` prefix must be set with `{ secure: true }`, and the path must be `/`',
      docsUrl: 'https://on.cypress.io/setcookie',
    },
    secure_prefix: {
      message: 'Cookies starting with the `__Secure-` prefix must be set with `{ secure: true }`',
      docsUrl: 'https://on.cypress.io/setcookie',
    },
  },

  shadow: {
    no_shadow_root: {
      message: 'Expected the subject to host a shadow root, but never found it.',
      docsUrl: 'https://on.cypress.io/shadow',
    },
  },

  should: {
    chainer_not_found: 'The chainer `{{chainer}}` was not found. Could not build assertion.',
    language_chainer: {
      message: 'The chainer `{{originalChainers}}` is a language chainer provided to improve the readability of your assertions, not an actual assertion. Please provide a valid assertion.',
      docsUrl: 'https://on.cypress.io/assertions',
    },
  },

  spread: {
    invalid_type: {
      message: `${cmd('spread')} requires the existing subject be array-like.`,
      docsUrl: 'https://on.cypress.io/spread',
    },
  },

  subject: {
    not_dom (obj) {
      return stripIndent`\
        ${cmd(obj.name)} failed because it requires a valid DOM object.

        The subject received was:

          > \`${obj.subject}\`

        The previous command that ran was:

          > ${cmd(obj.previous)}

        Cypress only considers the \`window\`, \`document\`, or any \`element\` to be valid DOM objects.`
    },
    not_attached (obj) {
      return {
        message: stripIndent`\
          ${cmd(obj.cmd)} failed because this element is detached from the DOM.

          \`${obj.node}\`

          Cypress requires elements be attached in the DOM to interact with them.

          The previous command that ran was:

            > ${cmd(obj.prev)}

          This DOM element likely became detached somewhere between the previous and current command.

          Common situations why this happens:
            - Your JS framework re-rendered asynchronously
            - Your app code reacted to an event firing and removed the element

          You typically need to re-query for the element or add 'guards' which delay Cypress from running new commands.`,
        docsUrl: 'https://on.cypress.io/element-has-detached-from-dom',
      }
    },
    not_window_or_document (obj) {
      return stripIndent`\
        ${cmd(obj.name)} failed because it requires the subject be a global \`${obj.type}\` object.

        The subject received was:

          > \`${obj.subject}\`

        The previous command that ran was:

          > ${cmd(obj.previous)}`
    },
    not_element (obj) {
      return stripIndent`\
        ${cmd(obj.name)} failed because it requires a DOM element.

        The subject received was:

          > \`${obj.subject}\`

        The previous command that ran was:

          > ${cmd(obj.previous)}`
    },
  },

  submit: {
    multiple_forms: {
      message: `${cmd('submit')} can only be called on a single \`form\`. Your subject contained {{num}} \`form\` elements.`,
      docsUrl: 'https://on.cypress.io/submit',
    },
    not_on_form: {
      message: `${cmd('submit')} can only be called on a \`<form>\`. Your subject {{word}} a: \`{{node}}\``,
      docsUrl: 'https://on.cypress.io/submit',
    },
  },

  switchToDomain: {
    docsUrl: 'https://on.cypress.io/switchToDomain',
    done_reference_mismatch: {
      message: `${cmd('switchToDomain')} must have done as its second argument when three or more arguments are used.`,
    },
    experiment_not_enabled: {
      message: `${cmd('switchToDomain')} requires enabling the experimentalMultiDomain flag`,
    },
    invalid_domain_argument: {
      message: `${cmd('switchToDomain')} requires the first argument to be a string. You passed: \`{{arg}}\``,
    },
    invalid_data_argument: {
      message: `${cmd('switchToDomain')} requires the 'data' argument to be an array. You passed: \`{{arg}}\``,
    },
    invalid_fn_argument: {
      message: `${cmd('switchToDomain')} requires the last argument to be a function. You passed: \`{{arg}}\``,
    },
    run_domain_fn_errored: {
      message: stripIndent`
      ${cmd('switchToDomain')} failed with the following error:

        > {{error}}

      This is likely because the data argument specified is not serializable. Note that functions and DOM objects cannot be serialized.`,
    },
    callback_mixes_sync_and_async: {
      message: stripIndent`\
        ${cmd('switchToDomain')} failed because you are mixing up async and sync code.

        In your callback function you invoked one or more cy commands but then returned a synchronous value.

        Cypress commands are asynchronous and it doesn't make sense to queue cy commands and yet return a synchronous value.

        You likely forgot to properly chain the cy commands using another \`cy.then()\`.

        The value you synchronously returned was: \`{{value}}\``,
    },
    failed_to_serialize_object: {
      message: stripIndent`\
      ${cmd('switchToDomain')} could not serialize the subject due to one of its properties not being supported by the structured clone algorithm.

      To properly serialize this subject, remove or serialize any unsupported properties.`,
    },
    failed_to_serialize_function: {
      message: stripIndent`\
      ${cmd('switchToDomain')} could not serialize the subject due to functions not being supported by the structured clone algorithm.`,
    },
    failed_to_serialize_symbol: {
      message: stripIndent`\
      ${cmd('switchToDomain')} could not serialize the subject due to symbols not being supported by the structured clone algorithm.`,
    // TODO: These deprecation warnings and forbidden use errors need to be audited before releasing multi-domain
    },
    route: {
      forbidden: {
        message: `${cmd('route')} has been deprecated and use is forbidden in ${cmd('switchToDomain')}. Consider migrating to using ${cmd('intercept')} instead.`,
        docsUrl: 'https://on.cypress.io/intercept',
      },
    },
    server: {
      forbidden: {
        message: `${cmd('server')} has been deprecated and use is forbidden in ${cmd('switchToDomain')}. Consider migrating to using ${cmd('intercept')} instead.`,
        docsUrl: 'https://on.cypress.io/intercept',
      },
    },
    Server: {
      forbidden: {
        message: `\`Cypress.Server.*\` has been deprecated and use is forbidden in ${cmd('switchToDomain')}. Consider migrating to using ${cmd('intercept')} instead.`,
        docsUrl: 'https://on.cypress.io/intercept',
      },
    },
    Cookies: {
      forbidden: {
        message: `\`Cypress.Cookies.preserveOnce\` use is forbidden in ${cmd('switchToDomain')}. Consider using ${cmd('session')} instead.`,
        docsUrl: 'https://on.cypress.io/session',
      },
    },
  },

  task: {
    docsUrl: 'https://on.cypress.io/api/task',
    known_error: stripIndent`
      ${cmd('task', '\'{{task}}\'')} failed with the following error:

      {{error}}`,
    failed: stripIndent`
      ${cmd('task', '\'{{task}}\'')} failed with the following error:

      > {{error}}`,
    invalid_argument: {
      message: `${cmd('task')} must be passed a non-empty string as its 1st argument. You passed: \`{{task}}\`.`,
    },
    timed_out: {
      message: `${cmd('task', '\'{{task}}\'')} timed out after waiting \`{{timeout}}ms\`.`,
    },
    server_timed_out: {
      message: stripIndent`
        ${cmd('task', '\'{{task}}\'')} timed out after waiting \`{{timeout}}ms\`.

        {{error}}`,
    },
  },

  tick: {
    invalid_argument: {
      message: `\`clock.tick()\`/${cmd('tick')} only accepts a number as their argument. You passed: \`{{arg}}\``,
      docsUrl: 'https://on.cypress.io/tick',
    },
    no_clock: {
      message: `${cmd('tick')} cannot be called without first calling ${cmd('clock')}`,
      docsUrl: 'https://on.cypress.io/tick',
    },
  },

  then: {
    callback_mixes_sync_and_async: stripIndent`\
      ${cmd('then')} failed because you are mixing up async and sync code.

      In your callback function you invoked 1 or more cy commands but then returned a synchronous value.

      Cypress commands are asynchronous and it doesn't make sense to queue cy commands and yet return a synchronous value.

      You likely forgot to properly chain the cy commands using another \`cy.then()\`.

      The value you synchronously returned was: \`{{value}}\``,
  },

  trigger: {
    invalid_argument: {
      message: `${cmd('trigger')} must be passed a non-empty string as its 1st argument. You passed: \`{{cmd}}\`.`,
      docsUrl: 'https://on.cypress.io/trigger',
    },
    multiple_elements: {
      message: `${cmd('trigger')} can only be called on a single element. Your subject contained {{num}} elements.`,
      docsUrl: 'https://on.cypress.io/trigger',
    },
    invalid_event_type: {
      message: `${cmd('trigger')} \`eventConstructor\` option must be a valid event (e.g. 'MouseEvent', 'KeyboardEvent'). You passed: \`{{eventConstructor}}\``,
      docsUrl: 'https://on.cypress.io/trigger',
    },
  },

  type: {
    empty_string: {
      message: `${cmd('type')} cannot accept an empty string. You need to actually type something.`,
      docsUrl: 'https://on.cypress.io/type',
    },
    invalid: {
      message: stripIndent`\
        Special character sequence: \`{{chars}}\` is not recognized. Available sequences are: \`{{allChars}}\`

        If you want to skip parsing special character sequences and type the text exactly as written, pass the option: \`{ parseSpecialCharSequences: false }\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    invalid_date: {
      message: `Typing into a \`date\` input with ${cmd('type')} requires a valid date with the format \`YYYY-MM-DD\`. You passed: \`{{chars}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    invalid_datetime: {
      message: `Typing into a datetime input with ${cmd('type')} requires a valid datetime with the format \`YYYY-MM-DDThh:mm\`, for example \`2017-06-01T08:30\`. You passed: \`{{chars}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    invalid_month: {
      message: `Typing into a \`month\` input with ${cmd('type')} requires a valid month with the format \`YYYY-MM\`. You passed: \`{{chars}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    invalid_time: {
      message: `Typing into a \`time\` input with ${cmd('type')} requires a valid time with the format \`HH:mm\`, \`HH:mm:ss\` or \`HH:mm:ss.SSS\`, where \`HH\` is 00-23, \`mm\` is 00-59, \`ss\` is 00-59, and \`SSS\` is 000-999. You passed: \`{{chars}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    invalid_week: {
      message: `Typing into a \`week\` input with ${cmd('type')} requires a valid week with the format \`YYYY-Www\`, where \`W\` is the literal character \`W\` and \`ww\` is the week number (00-53). You passed: \`{{chars}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    multiple_elements: {
      message: `${cmd('type')} can only be called on a single element. Your subject contained {{num}} elements.`,
      docsUrl: 'https://on.cypress.io/type',
    },
    not_a_modifier: {
      message: `\`{{key}}\` is not a modifier.`,
      docsUrl: 'https://on.cypress.io/type',
    },
    not_actionable_textlike: {
      message: stripIndent`\
        ${cmd('type')} failed because it targeted a disabled element.

        The element typed into was:

          > {{node}}

        Ensure the element does not have an attribute named \`disabled\` before typing into it.`,
      docsUrl: 'https://on.cypress.io/type',
    },
    not_on_typeable_element: {
      message: stripIndent`\
        ${cmd('type')} failed because it requires a valid typeable element.

        The element typed into was:

          > \`{{node}}\`

          A typeable element matches one of the following selectors:
          \`a[href]\`
          \`area[href]\`
          \`input\`
          \`select\`
          \`textarea\`
          \`button\`
          \`iframe\`
          \`[tabindex]\`
          \`[contenteditable]\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    readonly: {
      message: `${cmd('type')} cannot type into an element with a \`readonly\` attribute. The element typed into was: \`{{node}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
    tab: {
      message: '`{tab}` isn\'t a supported character sequence.',
      docsUrl: 'https://on.cypress.io/type',
    },
    wrong_type: {
      message: `${cmd('type')} can only accept a string or number. You passed in: \`{{chars}}\``,
      docsUrl: 'https://on.cypress.io/type',
    },
  },

  uncaught: {
    cross_origin_script: {
      message: stripIndent`\
        Script error.

        Cypress detected that an uncaught error was thrown from a cross origin script.

        We cannot provide you the stack trace, line number, or file where this error occurred.

        Check your Developer Tools Console for the actual error - it should be printed there.

        It's possible to enable debugging these scripts by adding the \`crossorigin\` attribute and setting a CORS header.`,
      docsUrl: 'https://on.cypress.io/cross-origin-script-error',
    },
    error_in_hook (obj) {
      let msg = `Because this error occurred during a \`${obj.hookName}\` hook we are skipping `

      const t = obj.parentTitle

      if (t) {
        msg += `the remaining tests in the current suite: \`${_.truncate(t, {
          length: 30,
        })}\``
      } else {
        msg += 'all of the remaining tests.'
      }

      if ((obj.hookName === 'after all' || obj.hookName === 'before all') && obj.retries > 0) {
        msg += `\n\nAlthough you have test retries enabled, we do not retry tests when \`before all\` or \`after all\` hooks fail`
      }

      return msg
    },
    fromApp: {
      message: stripIndent`\
        The following error originated from your application code, not from Cypress.{{promiseAddendum}}

          > {{errMsg}}

        When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

        This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.`,
      docsUrl: 'https://on.cypress.io/uncaught-exception-from-application',
    },
    fromSpec: {
      message: stripIndent`\
        The following error originated from your test code, not from Cypress.{{promiseAddendum}}

          > {{errMsg}}

        When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.`,
    },
  },

  viewport: {
    bad_args: {
      message: `${cmd('viewport')} can only accept a string preset or a \`width\` and \`height\` as numbers.`,
      docsUrl: 'https://on.cypress.io/viewport',
    },
    dimensions_out_of_range: {
      message: `${cmd('viewport')} \`width\` and \`height\` must be at least 0px.`,
      docsUrl: 'https://on.cypress.io/viewport',
    },
    empty_string: {
      message: `${cmd('viewport')} cannot be passed an empty string.`,
      docsUrl: 'https://on.cypress.io/viewport',
    },
    invalid_orientation: {
      message: `${cmd('viewport')} can only accept \`{{all}}\` as valid orientations. Your orientation was: \`{{orientation}}\``,
      docsUrl: 'https://on.cypress.io/viewport',
    },
    missing_preset: {
      message: `${cmd('viewport')} could not find a preset for: \`{{preset}}\`. Available presets are: {{presets}}`,
      docsUrl: 'https://on.cypress.io/viewport',
    },
  },

  visit: {
    body_circular ({ path }) {
      return {
        message: stripIndent`\
          The \`body\` parameter supplied to ${cmd('visit')} contained a circular reference at the path "${path.join('.')}".

          \`body\` can only be a string or an object with no circular references.`,
        docsUrl: 'https://on.cypress.io/visit',
      }
    },
    status_code_flags_invalid: stripIndent`\
      These options are incompatible with each other.

       - To retry on non-2xx status codes, pass { failOnStatusCode: true, retryOnStatusCodeFailure: true }.
       - To not retry on non-2xx status codes, pass { failOnStatusCode: true, retryOnStatusCodeFailure: true }.
       - To fail on non-2xx status codes without retrying (the default behavior), pass { failOnStatusCode: true, retryOnStatusCodeFailure: false }`,
    invalid_1st_arg: {
      message: `${cmd('visit')} must be called with a \`url\` or an \`options\` object containing a \`url\` as its 1st argument`,
      docsUrl: 'https://on.cypress.io/visit',
    },
    invalid_method: {
      message: `${cmd('visit')} was called with an invalid method: \`{{method}}\`. Method can only be \`GET\` or \`POST\`.`,
      docsUrl: 'https://on.cypress.io/visit',
    },
    invalid_headers: {
      message: `${cmd('visit')} requires the \`headers\` option to be an object.`,
      docsUrl: 'https://on.cypress.io/visit',
    },
    invalid_qs: {
      message: `${cmd('visit')} requires the \`qs\` option to be an object, but received: \`{{qs}}\``,
      docsUrl: 'https://on.cypress.io/visit',
    },
    no_duplicate_url: {
      message: stripIndent`\
        ${cmd('visit')} must be called with only one \`url\`. You specified two urls:
        \`url\` from the \`options\` object: {{optionsUrl}}
        \`url\` from the \`url\` parameter: {{url}}`,
      docsUrl: 'https://on.cypress.io/visit',
    },
    cannot_visit_different_origin: {
      message: stripIndent`\
        ${cmd('visit')} failed because you are attempting to visit a URL that is of a different origin.

        The new URL is considered a different origin because the following parts of the URL are different:

          > {{differences}}

        You may only ${cmd('visit')} same-origin URLs within a single test.

        The previous URL you visited was:

          > '{{previousUrl}}'

        You're attempting to visit this URL:

          > '{{attemptedUrl}}'

        You may need to restructure some of your test code to avoid this problem.`,
      docsUrl: 'https://on.cypress.io/cannot-visit-different-origin-domain',
    },
    loading_network_failed: stripIndent`\
      ${cmd('visit')} failed trying to load:

      {{url}}

      We attempted to make an http request to this URL but the request failed without a response.

      We received this error at the network level:

        > {{error}}

      Common situations why this would fail:
        - you don't have internet access
        - you forgot to run / boot your web server
        - your web server isn't accessible
        - you have weird network configuration settings on your computer`,
    loading_file_failed (obj) {
      return stripIndent`
        ${cmd('visit')} failed trying to load:

        ${obj.url}

        We failed looking for this file at the path:

        ${obj.path}

        The internal Cypress web server responded with:

          > ${obj.status}: ${obj.statusText}

        ${getRedirects(obj, 'We were redirected', 8)}`
    },
    loading_http_failed (obj) {
      return stripIndent`\
        ${cmd('visit')} failed trying to load:

        ${obj.url}

        The response we received from your web server was:

          > ${obj.status}: ${obj.statusText}

        This was considered a failure because the status code was not \`2xx\`.

        ${getRedirects(obj, 'This http request was redirected', 8)}

        If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\``
    },
    loading_invalid_content_type (obj) {
      const phrase = obj.path ? 'this local file' : 'your web server'

      return stripIndent`\
        ${cmd('visit')} failed trying to load:

        ${obj.url}

        The \`content-type\` of the response we received from ${phrase} was:

          > \`${obj.contentType}\`

        This was considered a failure because responses must have \`content-type: 'text/html'\`

        However, you can likely use ${cmd('request')} instead of ${cmd('visit')}.

        ${cmd('request')} will automatically get and set cookies and enable you to parse responses.`
    },

    specify_file_by_relative_path: {
      message: stripIndent`\
        ${cmd('visit')} failed because the 'file://...' protocol is not supported by Cypress.

        To visit a local file, you can pass in the relative path to the file from the \`projectRoot\` (Note: if the configuration value \`baseUrl\` is set, the supplied path will be resolved from the \`baseUrl\` instead of \`projectRoot\`)`,
      docsUrl: 'https://on.cypress.io/visit',
    },
  },

  wait: {
    alias_invalid: {
      message: '`{{prop}}` is not a valid alias property. Are you trying to ask for the first request? If so write `@{{str}}.request`',
      docsUrl: 'https://on.cypress.io/wait',
    },
    invalid_1st_arg: {
      message: `${cmd('wait')} only accepts a number, an alias of a route, or an array of aliases of routes. You passed: \`{{arg}}\``,
      docsUrl: 'https://on.cypress.io/wait',
    },
    invalid_alias: {
      message: `${cmd('wait')} only accepts aliases for routes.\nThe alias: \`{{alias}}\` did not match a route.`,
      docsUrl: 'https://on.cypress.io/wait',
    },
    invalid_arguments: {
      message: `${cmd('wait')} was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array.`,
      docsUrl: 'https://on.cypress.io/wait',
    },
    invalid_arguments_function: {
      message: `${cmd('wait')} was passed invalid arguments. You cannot pass a function. If you would like to wait on the result of a ${cmd('wait')}, use ${cmd('then')}.`,
      docsUrl: 'https://on.cypress.io/wait',
    },
    timed_out: {
      message: `${cmd('wait')} timed out waiting \`{{timeout}}ms\` for the {{num}} {{type}} to the route: \`{{alias}}\`. No {{type}} ever occurred.`,
      docsUrl: 'https://on.cypress.io/wait',
    },
  },

  window: {
    iframe_doc_undefined: 'The remote iframe\'s document is `undefined`',
    iframe_undefined: 'The remote iframe is `undefined`',
  },

  within: {
    invalid_argument: {
      message: `${cmd('within')} must be called with a function.`,
      docsUrl: 'https://on.cypress.io/within',
    },
  },

  wrap: {
    timed_out: {
      message: stripIndent`
      ${cmd('wrap')} timed out waiting \`{{timeout}}ms\` to complete.

      You called \`cy.wrap()\` with a promise that never resolved.

      To increase the timeout, use \`{ timeout: number }\`
      `,
      docsUrl: 'https://on.cypress.io/wrap',
    },
  },

  xhr: {
    aborted: 'This XHR was aborted by your code -- check this stack trace below.',
    missing: '`XMLHttpRequest#xhr` is missing.',
    network_error: 'The network request for this XHR could not be made. Check your console for the reason.',
  },
}
