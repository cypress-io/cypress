$Cypress.ErrorMessages = do ($Cypress) ->
  cmd = (command, args = "") ->
    "cy.#{command}(#{args})"

  return {
    add:
      type_missing: "Cypress.add(key, fn, type) must include a type!"

    alias:
      invalid: "Invalid alias: '{{name}}'.\nYou forgot the '@'. It should be written as: '@{{displayName}}'."
      not_registered_with_available: "#{cmd('{{cmd}}')} could not find a registered alias for: '@{{displayName}}'.\nAvailable aliases are: '{{availableAliases}}'."
      not_registered_without_available: "#{cmd('{{cmd}}')} could not find a registered alias for: '@{{displayName}}'.\nYou have not aliased anything yet."

    as:
      empty_string: "#{cmd('as')} cannot be passed an empty string."
      invalid_type: "#{cmd('as')} can only accept a string."
      reserved_word: "#{cmd('as')} cannot be aliased as: '{{str}}'. This word is reserved."

    blur:
      multiple_elements: "#{cmd('blur')} can only be called on a single element. Your subject contained {{num}} elements."
      no_focused_element: "#{cmd('blur')} can only be called when there is a currently focused element."
      timed_out:  "#{cmd('blur')} timed out because your browser did not receive any blur events. This is a known bug in Chrome when it is not the currently focused window."
      wrong_focused_element: "#{cmd('blur')} can only be called on the focused element. Currently the focused element is a: {{node}}"

    chai:
      length_invalid_argument: "You must provide a valid number to a length assertion. You passed: '{{length}}'"
      match_invalid_argument: "'chai#match' requires its argument be a 'RegExp'. You passed: '{{regExp}}'"

    check_uncheck:
      invalid_element: "#{cmd('{{cmd}}')} can only be called on :checkbox{{phrase}}. Your subject {{word}} a: {{node}}"

    clear:
      invalid_element: "#{cmd('clear')} can only be called on textarea or :text. Your subject {{word}} a: {{node}}"

    clearCookie:
      invalid_argument: "#{cmd('clearCookie')} must be passed a string argument for name."

    clearLocalStorage:
      invalid_argument: "#{cmd('clearLocalStorage')} must be called with either a string or regular expression."

    click:
      multiple_elements: "#{cmd('click')} can only be called on a single element. Your subject contained {{num}} elements. Pass {multiple: true} if you want to serially click each element."
      on_select_element: "#{cmd('click')} cannot be called on a <select> element. Use #{cmd('select')} command instead to change the value."

    contains:
      empty_string: "#{cmd('contains')} cannot be passed an empty string."
      invalid_argument: "#{cmd('contains')} can only accept a string or number."
      length_option: "#{cmd('contains')} cannot be passed a length option because it will only ever return 1 element."

    cookies:
      removed_method: """
        The Cypress.Cookies.{{method}}() method has been removed.

        Setting, getting, and clearing cookies is now an asynchronous operation.

        Replace this call with the appropriate command such as:
          - cy.getCookie()
          - cy.getCookies()
          - cy.setCookie()
          - cy.clearCookie()
          - cy.clearCookies()
      """

    dom:
      animating: """
        #{cmd('{{cmd}}')} could not be issued because this element is currently animating:\n
        {{node}}\n
        You can fix this problem by:
          - Passing {force: true} which disables all error checking
          - Passing {waitForAnimations: false} which disables waiting on animations
          - Passing {animationDistanceThreshold: 20} which decreases the sensitivity\n
        https://on.cypress.io/element-is-animating
      """
      animation_check_failed: "Not enough coord points provided to calculate distance."
      covered: """
        #{cmd('{{cmd}}')} failed because this element is being covered by another element:\n
        {{node}}\n
        Fix this problem, or use {force: true} to disable error checking.\n
        https://on.cypress.io/element-cannot-be-interacted-with
      """
      detached: """
        #{cmd('{{cmd}}')} failed because this element you are chaining off of has become detached or removed from the DOM:\n
        {{node}}\n
        https://on.cypress.io/element-has-detached-from-dom
      """
      disabled: """
        #{cmd('{{cmd}}')} failed because this element is disabled:\n
        {{node}}\n
        Fix this problem, or use {force: true} to disable error checking.\n
        https://on.cypress.io/element-cannot-be-interacted-with
      """
      hidden: """
        #{cmd('{{cmd}}')} failed because the center of this element is hidden from view:\n
        {{node}}\n
        Fix this problem, or use {force: true} to disable error checking.\n
        https://on.cypress.io/element-cannot-be-interacted-with
      """
      invalid_position_argument: "Invalid position argument: '{{position}}'. Position may only be center, topLeft, topRight, bottomLeft, or bottomRight."
      non_dom: "Cannot call #{cmd('{{cmd}}')} on a non-DOM subject."
      non_dom_is_hidden: "$Cypress.Dom.isHidden() must be passed a basic DOM element. You passed: '{{el}}'"
      not_visible: """
        #{cmd('{{cmd}}')} failed because this element is not visible:\n
        {{node}}\n
        {{reason}}\n
        Fix this problem, or use {force: true} to disable error checking.\n
        https://on.cypress.io/element-cannot-be-interacted-with
      """

    env:
      variables_missing: "Cypress.environmentVariables is not defined. Open an issue if you see this message."

    exec:
      failed: "#{cmd('exec', '\'{{cmd}}\'')} failed with the following error: {{error}}"
      invalid_argument: "#{cmd('exec')} must be passed a non-empty string as its 1st argument. You passed: '{{cmd}}'."
      non_zero_exit: """
        \n#{cmd('exec', '\'{{cmd}}\'')} failed because the command exited with a non-zero code. Pass {failOnNonZeroExit: false} for non-zero exits to not be treated as failures.

        Information about the failure:
        Code: {{code}}
        {{output}}
      """
      timed_out: "#{cmd('exec', '\'{{cmd}}\'')} timed out after waiting {{timeout}}ms."

    fill:
      invalid_1st_arg: "#{cmd('fill')} must be passed an object literal as its 1st argument"

    focus:
      invalid_element: "#{cmd('focus')} can only be called on a valid focusable element. Your subject is a: {{node}}"
      multiple_elements: "#{cmd('focus')} can only be called on a single element. Your subject contained {{num}} elements."
      timed_out: "#{cmd('focus')} timed out because your browser did not receive any focus events. This is a known bug in Chrome when it is not the currently focused window."

    get:
      alias_invalid: "'{{prop}}' is not a valid alias property. Only 'numbers' or 'all' is permitted."
      alias_zero: "'0' is not a valid alias property. Are you trying to ask for the first response? If so write @{{alias}}.1"

    getCookie:
      invalid_argument: "#{cmd('getCookie')} must be passed a string argument for name."

    go:
      invalid_argument: "#{cmd('go')} accepts only a string or number argument"
      invalid_direction: "#{cmd('go')} accepts either 'forward' or 'back'. You passed: '{{str}}'"
      invalid_number: "#{cmd('go')} cannot accept '0'. The number must be greater or less than '0'."

    hover:
      not_implemented: """
        #{cmd('hover')} is not currently implemented.\n
        However it is usually easy to workaround.\n
        Read the following document for a detailed explanation.\n
        https://on.cypress.io/api/hover
      """

    invoke:
      invalid_type: "Cannot call #{cmd('invoke')} because '{{prop}}' is not a function. You probably want to use #{cmd('its', '\'{{prop}}\'')}."

    invoke_its:
      current_prop_nonexistent: "#{cmd('{{cmd}}')} errored because your subject is currently: '{{value}}'. You cannot call any properties such as '{{prop}}' on a '{{value}}' value."
      invalid_1st_arg: "#{cmd('{{cmd}}')} only accepts a string as the first argument."
      invalid_property: "#{cmd('{{cmd}}')} errored because the property: '{{prop}}' does not exist on your subject."
      previous_prop_nonexistent: "#{cmd('{{cmd}}')} errored because the property: '{{previousProp}}' returned a '{{value}}' value. You cannot access any properties such as '{{currentProp}}' on a '{{value}}' value."
      timed_out: """
        #{cmd('{{cmd}}')} timed out after waiting '{{timeout}}ms'.\n
        Your callback function returned a promise which never resolved.\n
        The callback function was:\n
        {{func}}
      """

    location:
      invalid_key: "Location object does not have key: {{key}}"

    miscellaneous:
      dangling_commands: """
        Oops, Cypress detected something wrong with your test code.

        The test has finished but Cypress still has commands in its queue.
        The {{numCommands}} queued commands that have not yet run are:

        {{commands}}

        In every situation we've seen, this has been caused by programmer error.
        Most often this indicates a race condition due to a forgotten 'return' or from commands in a previously run test bleeding into the current test.

        For a much more thorough explanation including examples please review this error here:

        https://on.cypress.io/command-queue-ended-early
      """
      deprecated: "Command Options such as: '{{{opt}}: {{value}}}' have been deprecated. Instead write this as an assertion: #{cmd('should', '\'{{assertion}}\'')}."
      invalid_command: "Could not find a command for: '{{name}}'.\n\nAvailable commands are: {{cmds}}.\n"
      method_not_implemented: "The method {{method}} is not yet implemented"
      module_not_registered: "$Cypress.Module: {{name}} not registered."
      no_cy: "Cypress.cy is undefined. You may be trying to query outside of a running test. Cannot call Cypress.$()"
      no_sandbox: "Could not access the Server, Routes, Stub, Spies, or Mocks. Check to see if your application is loaded and is visible. Please open an issue if you see this message."
      no_runner: "Cannot call Cypress#run without a runner instance."
      no_subject: "Subject is {{subject}}. You cannot call #{cmd('{{cmd}}')} without a subject."
      orphan: "#{cmd('{{cmd}}')} is a child command which operates on an existing subject.  Child commands must be called after a parent command."
      outside_test: """
        Cypress cannot execute commands outside a running test.
        This usually happens when you accidentally write commands outside an it(...) test.
        If that is the case, just move these commands inside an 'it(...)' test.
        Check your test file for errors.\n
        https://on.cypress.io/cannot-execute-commands-outside-test
      """
      outside_test_with_cmd: """
        Cannot call "#{cmd('{{cmd}}')} outside a running test.
        This usually happens when you accidentally write commands outside an it(...) test.
        If that is the case, just move these commands inside an 'it(...)' test.
        Check your test file for errors.\n
        https://on.cypress.io/cannot-execute-commands-outside-test
      """
      retry_timed_out: "Timed out retrying: {{error}}"

    mocha:
      async_timed_out: "Timed out after '{{ms}}ms'. The done() callback was never invoked!"
      invalid_interface: "Invalid mocha interface '{{name}}'"
      timed_out: "Cypress command timeout of '{{ms}}ms' exceeded."

    navigation:
      loading_failed: "Loading the new page failed."
      timed_out: "Timed out after waiting '{{ms}}ms' for your remote page to load."

    ng:
      no_global: "Angular global (window.angular) was not found in your window. You cannot use #{cmd('ng')} methods without angular."

    reload:
      invalid_arguments: "#{cmd('reload')} can only accept a boolean or options as its arguments."

    request:
      auth_invalid: "#{cmd('request')} must be passed an object literal for the 'auth' option."
      cookies_invalid: "#{cmd('request')} requires cookies to be true, or an object literal."
      gzip_invalid: "#{cmd('request')} requires gzip to be a boolean."
      headers_invalid: "#{cmd('request')} requires headers to be an object literal."
      invalid_method: "#{cmd('request')} was called with an invalid method: '{{method}}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"
      loading_failed: """
        #{cmd('request')} failed:

        The response from the remote server was:

          > "{{error}}"

        The request parameters were:
          Method: {{method}}
          URL: {{url}}
          {{body}}
          {{headers}}
      """
      status_invalid: "#{cmd('request')} failed because the response had the status code: {{status}}"
      timed_out: "#{cmd('request')} timed out waiting {{timeout}}ms for a response. No response ever occured."
      url_missing: "#{cmd('request')} requires a url. You did not provide a url."
      url_invalid: "#{cmd('request')} must be provided a fully qualified url - one that begins with 'http'. By default #{cmd('request')} will use either the current window's origin or the 'baseUrl' in cypress.json. Neither of those values were present."
      url_wrong_type: "#{cmd('request')} requires the url to be a string."

    route:
      failed_prerequisites: "#{cmd('route')} cannot be invoked before starting the #{cmd('server')}"
      invalid_arguments: "#{cmd('route')} was not provided any arguments. You must provide valid arguments."
      method_invalid: "#{cmd('route')} was called with an invalid method: '{{method}}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"
      response_invalid: "#{cmd('route')} cannot accept an undefined or null response. It must be set to something, even an empty string will work."
      url_invalid: "#{cmd('route')} was called with a invalid url. Url must be either a string or regular expression."
      url_missing: "#{cmd('route')} must be called with a url. It can be a string or regular expression."

    select:
      disabled: "#{cmd('select')} failed because this element is currently disabled:\n\n{{node}}"
      invalid_element: "#{cmd('select')} can only be called on a <select>. Your subject is a: {{node}}"
      invalid_multiple: "#{cmd('select')} was called with an array of arguments but does not have a 'multiple' attribute set."
      multiple_elements: "#{cmd('select')} can only be called on a single <select>. Your subject contained {{num}} elements."
      multiple_matches: "#{cmd('select')} matched more than one option by value or text: {{value}}"
      no_matches: "#{cmd('select')} failed because it could not find a single <option> with value or text matching: '{{value}}'"
      option_disabled: "#{cmd('select')} failed because this <option> you are trying to select is currently disabled:\n\n{{node}}"

    server:
      invalid_argument: "#{cmd('server')} accepts only an object literal as its argument."
      unavailable: "The XHR server is unavailable or missing. This should never happen and likely is a bug. Open an issue if you see this message."

    setCookie:
      invalid_arguments: "#{cmd('setCookie')} must be passed two string arguments for name and value."

    spread:
      invalid_type: "#{cmd('spread')} requires the existing subject be an array."

    submit:
      multiple_forms: "#{cmd('submit')} can only be called on a single form. Your subject contained {{num}} form elements."
      not_on_form: "#{cmd('submit')} can only be called on a <form>. Your subject {{word}} a: {{node}}"

    type:
      empty_string: "#{cmd('type')} cannot accept an empty String. You need to actually type something."
      invalid: "Special character sequence: '{{chars}}' is not recognized. Available sequences are: {{allChars}}"
      multiple_elements: "#{cmd('type')} can only be called on a single textarea or :text. Your subject contained {{num}} elements."
      not_on_text_field: "#{cmd('type')} can only be called on textarea or :text. Your subject is a: {{node}}"
      tab: "{tab} isn't a supported character sequence. You'll want to use the command #{cmd('tab')}, which is not ready yet, but when it is done that's what you'll use."
      wrong_type: "#{cmd('type')} can only accept a String or Number. You passed in: '{{chars}}'"

    viewport:
      bad_args:  "#{cmd('viewport')} can only accept a string preset or a width and height as numbers."
      dimensions_out_of_range: "#{cmd('viewport')} width and height must be between 200px and 3000px."
      empty_string: "#{cmd('viewport')} cannot be passed an empty string."
      invalid_orientation: "#{cmd('viewport')} can only accept '{{all}}' as valid orientations. Your orientation was: '{{orientation}}'"
      missing_preset: "#{cmd('viewport')} could not find a preset for: '{{preset}}'. Available presets are: {{presets}}"

    visit:
      invalid_1st_arg: "#{cmd('visit')} must be called with a string as its 1st argument"
      loading_failed: "#{cmd('visit')} failed to load the remote page: {{url}}"

    wait:
      alias_invalid: "'{{prop}}' is not a valid alias property. Are you trying to ask for the first request? If so write @{{str}}.request"
      fn_deprecated: "#{cmd('wait', 'fn')} has been deprecated. Instead just change this command to be #{cmd('should', 'fn')}."
      invalid_1st_arg: "#{cmd('wait')} must be invoked with either a number or an alias for a route."
      invalid_alias: "#{cmd('wait')} can only accept aliases for routes.\nThe alias: '{{alias}}' did not match a route."
      invalid_arguments: "#{cmd('wait')} was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array."
      timed_out: "#{cmd('wait')} timed out waiting {{timeout}}ms for the {{num}} {{type}} to the route: '{{alias}}'. No {{type}} ever occured."

    window:
      iframe_doc_undefined: "The remote iframe's document is undefined"
      iframe_undefined: "The remote iframe is undefined"

    within:
      invalid_argument: "#{cmd('within')} must be called with a function."

    xhr:
      aborted: "This XHR was aborted by your code -- check this stack trace below."
      missing: "XMLHttpRequest#xhr is missing."
      network_error: "The network request for this XHR could not be made. Check your console for the reason."
  }
