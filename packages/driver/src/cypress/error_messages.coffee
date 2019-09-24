_ = require("lodash")

divider = (num, char) ->
  Array(num).join(char)

format = (data) ->
  switch
    when _.isString(data)
      _.truncate(data, { length: 100 })
    when _.isObject(data)
      JSON.stringify(data, null, 2)
    else
      data

formatRedirect = (redirect) -> "  - #{redirect}"

formatRedirects = (redirects = []) ->
  _.map(redirects, formatRedirect)

formatProp = (memo, field) ->
  {key, value} = field

  if value?
    memo.push(_.capitalize(key) + ": " + format(value))
  memo

cmd = (command, args = "") ->
  "cy.#{command}(#{args})"

getRedirects = (obj, phrase) ->
  redirects = obj.redirects ? []

  return "" if not redirects.length

  word = if redirects.length > 1 then "times" else "time"

  list = formatRedirects(redirects)

  """
  #{phrase} '#{redirects.length}' #{word} to:

  #{list.join("\n")}
  """

getHttpProps = (fields = []) ->
  _
  .chain(fields)
  .reduce(formatProp, [])
  .join("\n")
  .value()

module.exports = {
  add:
    type_missing: "Cypress.add(key, fn, type) must include a type!"

  agents:
    deprecated_warning: "cy.agents() is deprecated. Use cy.stub() and cy.spy() instead."

  alias:
    invalid: "Invalid alias: '{{name}}'.\nYou forgot the '@'. It should be written as: '@{{displayName}}'."
    not_registered_with_available: "#{cmd('{{cmd}}')} could not find a registered alias for: '@{{displayName}}'.\nAvailable aliases are: '{{availableAliases}}'."
    not_registered_without_available: "#{cmd('{{cmd}}')} could not find a registered alias for: '@{{displayName}}'.\nYou have not aliased anything yet."

  as:
    empty_string: "#{cmd('as')} cannot be passed an empty string."
    invalid_type: "#{cmd('as')} can only accept a string."
    invalid_first_token: "'{{alias}}' cannot be named starting with the '@' symbol. Try renaming the alias to '{{suggestedName}}', or something else that does not start with the '@' symbol."
    reserved_word: "#{cmd('as')} cannot be aliased as: '{{alias}}'. This word is reserved."

  blur:
    multiple_elements: "#{cmd('blur')} can only be called on a single element. Your subject contained {{num}} elements."
    no_focused_element: "#{cmd('blur')} can only be called when there is a currently focused element."
    timed_out:  "#{cmd('blur')} timed out because your browser did not receive any blur events. This is a known bug in Chrome when it is not the currently focused window."
    wrong_focused_element: "#{cmd('blur')} can only be called on the focused element. Currently the focused element is a: {{node}}"

  chai:
    length_invalid_argument: "You must provide a valid number to a length assertion. You passed: '{{length}}'"
    match_invalid_argument: "'match' requires its argument be a 'RegExp'. You passed: '{{regExp}}'"
    invalid_jquery_obj: (obj) ->
      """
        You attempted to make a chai-jQuery assertion on an object that is neither a DOM object or a jQuery object.

        The chai-jQuery assertion you used was:

          > #{obj.assertion}

        The invalid subject you asserted on was:

          > #{obj.subject}

        To use chai-jQuery assertions your subject must be valid.

        This can sometimes happen if a previous assertion changed the subject.
      """

  chain:
    removed: """
      #{cmd('chain')} was an undocumented command that has now been removed.

      You can safely remove this from your code and it should work without it.
    """

  check_uncheck:
    invalid_element: "#{cmd('{{cmd}}')} can only be called on :checkbox{{phrase}}. Your subject {{word}} a: {{node}}"

  clear:
    invalid_element: """
      #{cmd('clear')} failed because it requires a valid clearable element.

      The element cleared was:

        > {{node}}

      Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements.
    """

  clearCookie:
    invalid_argument: "#{cmd('clearCookie')} must be passed a string argument for name."

  clearLocalStorage:
    invalid_argument: "#{cmd('clearLocalStorage')} must be called with either a string or regular expression."

  click:
    multiple_elements: "#{cmd('click')} can only be called on a single element. Your subject contained {{num}} elements. Pass { multiple: true } if you want to serially click each element."
    on_select_element: "#{cmd('click')} cannot be called on a <select> element. Use #{cmd('select')} command instead to change the value."

  clock:
    already_created: "#{cmd('clock')} can only be called once per test. Use the clock returned from the previous call."
    invalid_1st_arg: "#{cmd('clock')} only accepts a number or an options object for its first argument. You passed: {{arg}}"
    invalid_2nd_arg: "#{cmd('clock')} only accepts an array of function names or an options object for its second argument. You passed: {{arg}}"

  contains:
    empty_string: "#{cmd('contains')} cannot be passed an empty string."
    invalid_argument: "#{cmd('contains')} can only accept a string, number or regular expression."
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
    timed_out: "#{cmd('{{cmd}}')} timed out waiting '{{timeout}}ms' to complete."

  dom:
    animating: """
      #{cmd('{{cmd}}')} could not be issued because this element is currently animating:

      {{node}}

      You can fix this problem by:
        - Passing {force: true} which disables all error checking
        - Passing {waitForAnimations: false} which disables waiting on animations
        - Passing {animationDistanceThreshold: 20} which decreases the sensitivity

      https://on.cypress.io/element-is-animating
    """
    animation_check_failed: "Not enough coord points provided to calculate distance."
    center_hidden: """
      #{cmd('{{cmd}}')} failed because the center of this element is hidden from view:

      {{node}}

      Fix this problem, or use {force: true} to disable error checking.

      https://on.cypress.io/element-cannot-be-interacted-with
    """
    covered: (obj) ->
      """
      #{cmd(obj.cmd)} failed because this element:

      #{obj.element1}

      is being covered by another element:

      #{obj.element2}

      Fix this problem, or use {force: true} to disable error checking.

      https://on.cypress.io/element-cannot-be-interacted-with
      """
    pointer_events_none: (obj) ->
      """
      #{cmd(obj.cmd)} failed because this element:

      #{obj.element}

      has CSS 'pointer-events: none'#{if obj.elementInherited then ", inherited from this element:\n\n#{obj.elementInherited}\n" else ""}

      'pointer-events: none' prevents user mouse interaction.

      Fix this problem, or use {force: true} to disable error checking.

      https://on.cypress.io/element-cannot-be-interacted-with
      """
    disabled: """
      #{cmd('{{cmd}}')} failed because this element is disabled:

      {{node}}

      Fix this problem, or use {force: true} to disable error checking.

      https://on.cypress.io/element-cannot-be-interacted-with
    """
    invalid_position_argument: "Invalid position argument: '{{position}}'. Position may only be {{validPositions}}."
    not_scrollable: """
      #{cmd('{{cmd}}')} failed because this element is not scrollable:\n
      {{node}}\n
    """
    not_visible: """
      #{cmd('{{cmd}}')} failed because this element is not visible:

      {{node}}

      {{reason}}

      Fix this problem, or use {force: true} to disable error checking.

      https://on.cypress.io/element-cannot-be-interacted-with
    """
    readonly: """
      #{cmd('{{cmd}}')} failed because this element is readonly:

      {{node}}

      Fix this problem, or use {force: true} to disable error checking.

      https://on.cypress.io/element-cannot-be-interacted-with
    """

  each:
    invalid_argument: "#{cmd('each')} must be passed a callback function."
    non_array: "#{cmd('each')} can only operate on an array like subject. Your subject was: '{{subject}}'"

  exec:
    failed: """#{cmd('exec', '\'{{cmd}}\'')} failed with the following error:

        > "{{error}}"
    """
    invalid_argument: "#{cmd('exec')} must be passed a non-empty string as its 1st argument. You passed: '{{cmd}}'."
    non_zero_exit: """
      #{cmd('exec', '\'{{cmd}}\'')} failed because the command exited with a non-zero code.

      Pass {failOnNonZeroExit: false} to ignore exit code failures.

      Information about the failure:
      Code: {{code}}
      {{output}}
    """
    timed_out: "#{cmd('exec', '\'{{cmd}}\'')} timed out after waiting {{timeout}}ms."

  files:
    unexpected_error:  """#{cmd('{{cmd}}', '"{{file}}"')} failed while trying to {{action}} the file at the following path:

      {{filePath}}

    The following error occurred:

      > "{{error}}"
    """
    existent: """#{cmd('readFile', '"{{file}}"')} failed because the file exists when expected not to exist at the following path:

      {{filePath}}
    """
    invalid_argument: "#{cmd('{{cmd}}')} must be passed a non-empty string as its 1st argument. You passed: '{{file}}'."
    invalid_contents: "#{cmd('writeFile')} must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: '{{contents}}'."
    nonexistent: """#{cmd('readFile', '"{{file}}"')} failed because the file does not exist at the following path:

      {{filePath}}
    """
    timed_out: "#{cmd('{{cmd}}', '"{{file}}"')} timed out after waiting {{timeout}}ms."

  fill:
    invalid_1st_arg: "#{cmd('fill')} must be passed an object literal as its 1st argument"

  fixture:
    set_to_false: "#{cmd('fixture')} is not valid because you have configured 'fixturesFolder' to false."
    timed_out: "#{cmd('fixture')} timed out waiting '{{timeout}}ms' to receive a fixture. No fixture was ever sent by the server."

  focus:
    invalid_element: "#{cmd('focus')} can only be called on a valid focusable element. Your subject is a: {{node}}"
    multiple_elements: "#{cmd('focus')} can only be called on a single element. Your subject contained {{num}} elements."
    timed_out: "#{cmd('focus')} timed out because your browser did not receive any focus events. This is a known bug in Chrome when it is not the currently focused window."

  get:
    alias_invalid: "'{{prop}}' is not a valid alias property. Only 'numbers' or 'all' is permitted."
    alias_zero: "'0' is not a valid alias property. Are you trying to ask for the first response? If so write @{{alias}}.1"
    invalid_options: "#{cmd('get')} only accepts an options object for its second argument. You passed {{options}}"

  getCookie:
    invalid_argument: "#{cmd('getCookie')} must be passed a string argument for name."

  go:
    invalid_argument: "#{cmd('go')} accepts only a string or number argument"
    invalid_direction: "#{cmd('go')} accepts either 'forward' or 'back'. You passed: '{{str}}'"
    invalid_number: "#{cmd('go')} cannot accept '0'. The number must be greater or less than '0'."

  hover:
    not_implemented: """
      #{cmd('hover')} is not currently implemented.

      However it is usually easy to workaround.

      Read the following document for a detailed explanation.

      https://on.cypress.io/hover
    """

  invoke:
    prop_not_a_function:
      """
      #{cmd('invoke')} errored because the property: '{{prop}}' returned a '{{type}}' value instead of a function. #{cmd('invoke')} can only be used on properties that return callable functions.

      #{cmd('invoke')} waited for the specified property '{{prop}}' to return a function, but it never did.

      If you want to assert on the property's value, then switch to use #{cmd('its')} and add an assertion such as:

      cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')
      """
    subject_null_or_undefined:
      """
      #{cmd('invoke')} errored because your subject is: '{{value}}'. You cannot invoke any functions such as '{{prop}}' on a '{{value}}' value.

      If you expect your subject to be '{{value}}', then add an assertion such as:

      cy.wrap({{value}}).should('be.{{value}}')
      """
    null_or_undefined_prop_value:
      """
      #{cmd('invoke')} errored because the property: '{{prop}}' is not a function, and instead returned a '{{value}}' value.

      #{cmd('invoke')} waited for the specified property '{{prop}}' to become a callable function, but it never did.

      If you expect the property '{{prop}}' to be '{{value}}', then switch to use #{cmd('its')} and add an assertion such as:

      cy.wrap({ foo: {{value}} }).its('foo').should('be.{{value}}')
      """

  its:
    subject_null_or_undefined:
      """
      #{cmd('its')} errored because your subject is: '{{value}}'. You cannot access any properties such as '{{prop}}' on a '{{value}}' value.

      If you expect your subject to be '{{value}}', then add an assertion such as:

      cy.wrap({{value}}).should('be.{{value}}')
      """
    null_or_undefined_prop_value:
      """
      #{cmd('its')} errored because the property: '{{prop}}' returned a '{{value}}' value.

      #{cmd('its')} waited for the specified property '{{prop}}' to become accessible, but it never did.

      If you expect the property '{{prop}}' to be '{{value}}', then add an assertion such as:

      cy.wrap({ foo: {{value}} }).its('foo').should('be.{{value}}')
      """

  invoke_its:
    nonexistent_prop:
      """
      #{cmd('{{cmd}}')} errored because the property: '{{prop}}' does not exist on your subject.

      #{cmd('{{cmd}}')} waited for the specified property '{{prop}}' to exist, but it never did.

      If you do not expect the property '{{prop}}' to exist, then add an assertion such as:

      cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')
      """
    previous_prop_null_or_undefined:
      """
      #{cmd('{{cmd}}')} errored because the property: '{{previousProp}}' returned a '{{value}}' value. The property: '{{prop}}' does not exist on a '{{value}}' value.

      #{cmd('{{cmd}}')} waited for the specified property '{{prop}}' to become accessible, but it never did.

      If you do not expect the property '{{prop}}' to exist, then add an assertion such as:

      cy.wrap({ foo: {{value}} }).its('foo.baz').should('not.exist')
      """
    invalid_1st_arg: "#{cmd('{{cmd}}')} only accepts a string as the first argument."
    invalid_num_of_args:
      """
      #{cmd('{{cmd}}')} only accepts a single argument.

      If you want to invoke a function with arguments, use cy.invoke().
      """
    timed_out:
      """
      #{cmd('{{cmd}}')} timed out after waiting '{{timeout}}ms'.

      Your callback function returned a promise which never resolved.

      The callback function was:

      {{func}}
    """

  location:
    invalid_key: "Location object does not have key: {{key}}"

  log:
    invalid_argument: "Cypress.log() can only be called with an options object. Your argument was: '{{arg}}'"

  miscellaneous:
    custom_command_interface_changed: (obj) ->
      """
      Cypress.#{obj.method}(...) has been removed and replaced by:

      Cypress.Commands.add(...)

      Instead of indicating 'parent', 'child', or 'dual' commands, you pass an options object
      to describe the requirements around the previous subject. You can also enforce specific
      subject types such as requiring the subject to be a DOM element.

      To rewrite this custom command you'd likely write:

      Cypress.Commands.add(#{obj.signature})

      https://on.cypress.io/custom-command-interface-changed
      """
    returned_value_and_commands_from_custom_command: (obj) ->
      """
        Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.

        The custom command was:

          > #{cmd(obj.current)}

        The return value was:

          > #{obj.returned}

        Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

        For convenience, you can also simply omit any return value or return 'undefined' and Cypress will not error.

        In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.

        https://on.cypress.io/returning-value-and-commands-in-custom-command
      """
    returned_value_and_commands: (ret) ->
      """
        Cypress detected that you invoked one or more cy commands but returned a different value.

        The return value was:

          > #{ret}

        Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

        For convenience, you can also simply omit any return value or return 'undefined' and Cypress will not error.

        In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.

        https://on.cypress.io/returning-value-and-commands-in-test
      """
    command_returned_promise_and_commands: (obj) ->
      """
        Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.

        The command that returned the promise was:

          > #{cmd(obj.current)}

        The cy command you invoked inside the promise was:

          > #{cmd(obj.called)}

        Because Cypress commands are already promise-like, you don't need to wrap them or return your own promise.

        Cypress will resolve your command with whatever the final Cypress command yields.

        The reason this is an error instead of a warning is because Cypress internally queues commands serially whereas Promises execute as soon as they are invoked. Attempting to reconcile this would prevent Cypress from ever resolving.

        https://on.cypress.io/returning-promise-and-commands-in-another-command
      """
    mixing_promises_and_commands: (title) ->
      """
        Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.

        The test title was:

          > #{title}

        While this works in practice, it's often indicative of an anti-pattern. You almost never need to return both a promise and also invoke cy commands.

        Cy commands themselves are already promise like, and you can likely avoid the use of the separate Promise.

        https://on.cypress.io/returning-promise-and-commands-in-test
      """
    command_log_renamed: """
      Cypress.Log.command() has been renamed to Cypress.log()

      Please update your code. You should be able to safely do a find/replace.
    """

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
    invalid_command: "Could not find a command for: '{{name}}'.\n\nAvailable commands are: {{cmds}}.\n"
    invalid_overwrite: "Cannot overwite command for: '{{name}}'. An existing command does not exist by that name."
    invoking_child_without_parent: (obj) ->
      """
      Oops, it looks like you are trying to call a child command before running a parent command.

      You wrote code that looks like this:

      #{cmd(obj.cmd, obj.args)}

      A child command must be chained after a parent because it operates on a previous subject.

      For example - if we were issuing the child command 'click'...

      cy
        .get('button') // parent command must come first
        .click()       // then child command comes second

      """
    no_cy: "Cypress.cy is undefined. You may be trying to query outside of a running test. Cannot call Cypress.$()"
    no_runner: "Cannot call Cypress#run without a runner instance."
    outside_test: """
      Cypress cannot execute commands outside a running test.

      This usually happens when you accidentally write commands outside an 'it(...)' test.

      If that is the case, just move these commands inside an it(...) test.

      Check your test file for errors.

      https://on.cypress.io/cannot-execute-commands-outside-test
    """
    outside_test_with_cmd: """
      Cannot call "#{cmd('{{cmd}}')}" outside a running test.

      This usually happens when you accidentally write commands outside an it(...) test.

      If that is the case, just move these commands inside an it(...) test.

      Check your test file for errors.

      https://on.cypress.io/cannot-execute-commands-outside-test
    """
    private_custom_command_interface: "You cannot use the undocumented private command interface: {{method}}"
    private_property:
      """
      You are accessing a private property directly on 'cy' which has been renamed.

      This was never documented nor supported.

      Please go through the public function: #{cmd('state', "...")}
      """
    retry_timed_out: "Timed out retrying: {{error}}"

  mocha:
    async_timed_out: "Timed out after '{{ms}}ms'. The done() callback was never invoked!"
    invalid_interface: "Invalid mocha interface '{{name}}'"
    timed_out: "Cypress command timeout of '{{ms}}ms' exceeded."

  navigation:
    cross_origin: """
      Cypress detected a cross origin error happened on page load:

        > {{message}}

      Before the page load, you were bound to the origin policy:
        > {{originPolicy}}

      A cross origin error happens when your application navigates to a new superdomain which does not match the origin policy above.

      This typically happens in one of three ways:

      1. You clicked an <a> that routed you outside of your application
      2. You submitted a form and your server redirected you outside of your application
      3. You used a javascript redirect to a page outside of your application

      Cypress does not allow you to change superdomains within a single test.

      You may need to restructure some of your test code to avoid this problem.

      Alternatively you can also disable Chrome Web Security which will turn off this restriction by setting { chromeWebSecurity: false } in your 'cypress.json' file.

      https://on.cypress.io/cross-origin-violation

    """
    timed_out: """
      Timed out after waiting '{{ms}}ms' for your remote page to load.

      Your page did not fire its 'load' event within '{{ms}}ms'.

      You can try increasing the 'pageLoadTimeout' value in 'cypress.json' to wait longer.

      Browsers will not fire the 'load' event until all stylesheets and scripts are done downloading.

      When this 'load' event occurs, Cypress will continue running commands.
    """

  ng:
    no_global: "Angular global (window.angular) was not found in your window. You cannot use #{cmd('ng')} methods without angular."

  reload:
    invalid_arguments: "#{cmd('reload')} can only accept a boolean or options as its arguments."

  request:
    body_circular: ({ path }) -> """
      The `body` parameter supplied to #{cmd('request')} contained a circular reference at the path "#{path.join(".")}".

      `body` can only be a string or an object with no circular references.
    """
    status_code_flags_invalid: """
    #{cmd('request')} was invoked with { failOnStatusCode: false, retryOnStatusCodeFailure: true }.

    These options are incompatible with each other.

     - To retry on non-2xx status codes, pass { failOnStatusCode: true, retryOnStatusCodeFailure: true }.
     - To not retry on non-2xx status codes, pass { failOnStatusCode: true, retryOnStatusCodeFailure: true }.
     - To fail on non-2xx status codes without retrying (the default behavior), pass { failOnStatusCode: true, retryOnStatusCodeFailure: false }
    """
    auth_invalid: "#{cmd('request')} must be passed an object literal for the 'auth' option."
    gzip_invalid: "#{cmd('request')} requires the 'gzip' option to be a boolean."
    headers_invalid: "#{cmd('request')} requires the 'headers' option to be an object literal."
    invalid_method: "#{cmd('request')} was called with an invalid method: '{{method}}'. Method can be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, or any other method supported by Node's HTTP parser."
    failonstatus_deprecated_warning: "The cy.request() 'failOnStatus' option has been renamed to 'failOnStatusCode'. Please update your code. This option will be removed at a later time."
    form_invalid: """
    #{cmd('request')} requires the 'form' option to be a boolean.

    If you're trying to send a x-www-form-urlencoded request then pass either a string or object literal to the 'body' property.
    """
    loading_failed: (obj) ->
      """
      #{cmd('request')} failed trying to load:

      #{obj.url}

      We attempted to make an http request to this URL but the request failed without a response.

      We received this error at the network level:

        > #{obj.error}

      #{divider(60, '-')}

      The request we sent was:

      #{getHttpProps([
        {key: 'method',    value: obj.method},
        {key: 'URL',       value: obj.url},
      ])}

      #{divider(60, '-')}

      Common situations why this would fail:
        - you don't have internet access
        - you forgot to run / boot your web server
        - your web server isn't accessible
        - you have weird network configuration settings on your computer

      The stack trace for this error is:

      #{obj.stack}
      """

    status_invalid: (obj) ->
      """
      #{cmd('request')} failed on:

      #{obj.url}

      The response we received from your web server was:

        > #{obj.status}: #{obj.statusText}

      This was considered a failure because the status code was not '2xx' or '3xx'.

      If you do not want status codes to cause failures pass the option: 'failOnStatusCode: false'

      #{divider(60, '-')}

      The request we sent was:

      #{getHttpProps([
        {key: 'method',    value: obj.method},
        {key: 'URL',       value: obj.url},
        {key: 'headers',   value: obj.requestHeaders},
        {key: 'body',      value: obj.requestBody}
        {key: 'redirects', value: obj.redirects}
      ])}

      #{divider(60, '-')}

      The response we got was:

      #{getHttpProps([
        {key: 'status',  value: obj.status + ' - ' + obj.statusText},
        {key: 'headers', value: obj.responseHeaders},
        {key: 'body',    value: obj.responseBody}
      ])}

      """
    timed_out: (obj) ->
      """
      #{cmd('request')} timed out waiting #{obj.timeout}ms for a response from your server.

      The request we sent was:

      #{getHttpProps([
        {key: 'method',    value: obj.method},
        {key: 'URL',       value: obj.url},
      ])}

      No response was received within the timeout.
      """
    url_missing: "#{cmd('request')} requires a url. You did not provide a url."
    url_invalid: "#{cmd('request')} must be provided a fully qualified url - one that begins with 'http'. By default #{cmd('request')} will use either the current window's origin or the 'baseUrl' in cypress.json. Neither of those values were present."
    url_wrong_type: "#{cmd('request')} requires the url to be a string."

  route:
    failed_prerequisites: "#{cmd('route')} cannot be invoked before starting the #{cmd('server')}"
    invalid_arguments: "#{cmd('route')} was not provided any arguments. You must provide valid arguments."
    method_invalid: "#{cmd('route')} was called with an invalid method: '{{method}}'. Method can be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, or any other method supported by Node's HTTP parser."
    response_invalid: "#{cmd('route')} cannot accept an undefined or null response. It must be set to something, even an empty string will work."
    url_invalid: "#{cmd('route')} was called with an invalid url. Url must be either a string or regular expression."
    url_missing: "#{cmd('route')} must be called with a url. It can be a string or regular expression."
    url_percentencoding_warning: ({ decodedUrl }) -> """
    A URL with percent-encoded characters was passed to cy.route(), but cy.route() expects a decoded URL.

    Did you mean to pass "#{decodedUrl}"?
    """

  scrollIntoView:
    invalid_argument: "#{cmd('scrollIntoView')} can only be called with an options object. Your argument was: {{arg}}"
    subject_is_window: "Cannot call #{cmd('scrollIntoView')} on Window subject."
    multiple_elements: "#{cmd('scrollIntoView')} can only be used to scroll to 1 element, you tried to scroll to {{num}} elements.\n\n"
    invalid_easing: "#{cmd('scrollIntoView')} must be called with a valid easing. Your easing was: {{easing}}"
    invalid_duration: "#{cmd('scrollIntoView')} must be called with a valid duration. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: {{duration}}"

  scrollTo:
    invalid_target: "#{cmd('scrollTo')} must be called with a valid position. It can be a string, number or object. Your position was: {{x}}, {{y}}"
    multiple_containers: "#{cmd('scrollTo')} can only be used to scroll one element, you tried to scroll {{num}} elements.\n\n"
    invalid_easing: "#{cmd('scrollTo')} must be called with a valid easing. Your easing was: {{easing}}"
    invalid_duration: "#{cmd('scrollTo')} must be called with a valid duration. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: {{duration}}"
    animation_failed: "#{cmd('scrollTo')} failed."

  screenshot:
    invalid_arg: "{{cmd}}() must be called with an object. You passed: {{arg}}"
    invalid_capture: "{{cmd}}() 'capture' option must be one of the following: 'fullPage', 'viewport', or 'runner'. You passed: {{arg}}"
    invalid_boolean: "{{cmd}}() '{{option}}' option must be a boolean. You passed: {{arg}}"
    invalid_blackout: "{{cmd}}() 'blackout' option must be an array of strings. You passed: {{arg}}"
    invalid_clip: "{{cmd}}() 'clip' option must be an object of with the keys { width, height, x, y } and number values. You passed: {{arg}}"
    invalid_callback: "{{cmd}}() '{{callback}}' option must be a function. You passed: {{arg}}"
    multiple_elements: "#{cmd('screenshot')} only works for a single element. You attempted to screenshot {{numElements}} elements."
    timed_out: "#{cmd('screenshot')} timed out waiting '{{timeout}}ms' to complete."

  select:
    disabled: "#{cmd('select')} failed because this element is currently disabled:\n\n{{node}}"
    invalid_element: "#{cmd('select')} can only be called on a <select>. Your subject is a: {{node}}"
    invalid_multiple: "#{cmd('select')} was called with an array of arguments but does not have a 'multiple' attribute set."
    multiple_elements: "#{cmd('select')} can only be called on a single <select>. Your subject contained {{num}} elements."
    multiple_matches: "#{cmd('select')} matched more than one option by value or text: {{value}}"
    no_matches: "#{cmd('select')} failed because it could not find a single <option> with value or text matching: '{{value}}'"
    option_disabled: "#{cmd('select')} failed because this <option> you are trying to select is currently disabled:\n\n{{node}}"

  selector_playground:
    defaults_invalid_arg: "Cypress.SelectorPlayground.defaults() must be called with an object. You passed: {{arg}}"
    defaults_invalid_priority: "Cypress.SelectorPlayground.defaults() called with invalid 'selectorPriority' property. It must be an array. You passed: {{arg}}"
    defaults_invalid_on_element: "Cypress.SelectorPlayground.defaults() called with invalid 'onElement' property. It must be a function. You passed: {{arg}}"

  server:
    force404_deprecated: "Passing cy.server({force404: false}) is now the default behavior of cy.server(). You can safely remove this option."
    invalid_argument: "#{cmd('server')} accepts only an object literal as its argument."
    stub_deprecated: ({ type }) -> """
      Passing #{cmd(type)}({stub: false}) is now deprecated. You can safely remove: {stub: false}.\n
      https://on.cypress.io/deprecated-stub-false-on-#{type}
    """
    xhrurl_not_set: "'Server.options.xhrUrl' has not been set"
    unavailable: "The XHR server is unavailable or missing. This should never happen and likely is a bug. Open an issue if you see this message."

  setCookie:
    invalid_arguments: "#{cmd('setCookie')} must be passed two string arguments for name and value."

  spread:
    invalid_type: "#{cmd('spread')} requires the existing subject be array-like."

  subject:
    not_dom: (obj) ->
      """
      #{cmd(obj.name)} failed because it requires a valid DOM object.

      The subject received was:

        > #{obj.subject}

      The previous command that ran was:

        > #{cmd(obj.previous)}

      Cypress only considers the 'window', 'document', or any 'element' to be valid DOM objects.
      """
    not_attached: (obj) ->
      """
      #{cmd(obj.name)} failed because this element is detached from the DOM.

      #{obj.subject}

      Cypress requires elements be attached in the DOM to interact with them.

      The previous command that ran was:

        > #{cmd(obj.previous)}

      This DOM element likely became detached somewhere between the previous and current command.

      Common situations why this happens:
        - Your JS framework re-rendered asynchronously
        - Your app code reacted to an event firing and removed the element

      You typically need to re-query for the element or add 'guards' which delay Cypress from running new commands.

      https://on.cypress.io/element-has-detached-from-dom
      """
    not_window_or_document: (obj) ->
      """
      #{cmd(obj.name)} failed because it requires the subject be a global '#{obj.type}' object.

      The subject received was:

        > #{obj.subject}

      The previous command that ran was:

        > #{cmd(obj.previous)}
      """
    not_element: (obj) ->
      """
      #{cmd(obj.name)} failed because it requires a DOM element.

      The subject received was:

        > #{obj.subject}

      The previous command that ran was:

        > #{cmd(obj.previous)}
      """

  submit:
    multiple_forms: "#{cmd('submit')} can only be called on a single form. Your subject contained {{num}} form elements."
    not_on_form: "#{cmd('submit')} can only be called on a <form>. Your subject {{word}} a: {{node}}"

  task:
    known_error: """#{cmd('task', '\'{{task}}\'')} failed with the following error:

        {{error}}
    """
    failed: """#{cmd('task', '\'{{task}}\'')} failed with the following error:

        > {{error}}
    """
    invalid_argument: "#{cmd('task')} must be passed a non-empty string as its 1st argument. You passed: '{{task}}'."
    timed_out: "#{cmd('task', '\'{{task}}\'')} timed out after waiting {{timeout}}ms."
    server_timed_out: """#{cmd('task', '\'{{task}}\'')} timed out after waiting {{timeout}}ms.

        {{error}}
    """

  tick:
    invalid_argument: "clock.tick()/#{cmd('tick')} only accept a number as their argument. You passed: {{arg}}"
    no_clock: "#{cmd('tick')} cannot be called without first calling #{cmd('clock')}"

  then:
    callback_mixes_sync_and_async: """
      #{cmd('then')} failed because you are mixing up async and sync code.

      In your callback function you invoked 1 or more cy commands but then returned a synchronous value.

      Cypress commands are asynchronous and it doesn't make sense to queue cy commands and yet return a synchronous value.

      You likely forgot to properly chain the cy commands using another cy.then().

      The value you synchronously returned was: '{{value}}'
    """

  trigger:
    invalid_argument: "#{cmd('trigger')} must be passed a non-empty string as its 1st argument. You passed: '{{cmd}}'."
    multiple_elements: "#{cmd('trigger')} can only be called on a single element. Your subject contained {{num}} elements."

  type:
    empty_string: "#{cmd('type')} cannot accept an empty String. You need to actually type something."
    readonly: "#{cmd('type')} cannot type into an element with a 'readonly' attribute. The element typed into was: {{node}}"
    invalid: """
      Special character sequence: '{{chars}}' is not recognized. Available sequences are: {{allChars}}

      If you want to skip parsing special character sequences and type the text exactly as written, pass the option: {parseSpecialCharSequences: false}

      https://on.cypress.io/type
    """
    invalid_date: "Typing into a date input with #{cmd('type')} requires a valid date with the format 'yyyy-MM-dd'. You passed: {{chars}}"
    invalid_month: "Typing into a month input with #{cmd('type')} requires a valid month with the format 'yyyy-MM'. You passed: {{chars}}"
    invalid_week: "Typing into a week input with #{cmd('type')} requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: {{chars}}"
    invalid_time: "Typing into a time input with #{cmd('type')} requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: {{chars}}"
    multiple_elements: "#{cmd('type')} can only be called on a single element. Your subject contained {{num}} elements."
    not_on_typeable_element: """
      #{cmd('type')} failed because it requires a valid typeable element.

      The element typed into was:

        > {{node}}

      Cypress considers the 'body', 'textarea', any 'element' with a 'tabindex' or 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid typeable elements.
    """
    tab: "{tab} isn't a supported character sequence. You'll want to use the command #{cmd('tab')}, which is not ready yet, but when it is done that's what you'll use."
    wrong_type: "#{cmd('type')} can only accept a String or Number. You passed in: '{{chars}}'"

  uncaught:
    cross_origin_script: """
      Script error.

      Cypress detected that an uncaught error was thrown from a cross origin script.

      We cannot provide you the stack trace, line number, or file where this error occurred.

      Check your Developer Tools Console for the actual error - it should be printed there.

      It's possible to enable debugging these scripts by adding the 'crossorigin' attribute and setting a CORS header.

      https://on.cypress.io/cross-origin-script-error
    """
    error_in_hook: (obj) ->
      msg = "Because this error occurred during a '#{obj.hookName}' hook we are skipping "

      if t = obj.parentTitle
        msg += "the remaining tests in the current suite: '#{_.truncate(t, 20)}'"
      else
        msg += "all of the remaining tests."

      msg

    error: (obj) ->
      {msg, source, lineno} = obj

      msg + if source and lineno then " (#{source}:#{lineno})" else ""

    fromApp: """
      This error originated from your application code, not from Cypress.

      When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

      This behavior is configurable, and you can choose to turn this off by listening to the 'uncaught:exception' event.

      https://on.cypress.io/uncaught-exception-from-application
    """

    fromSpec: """
      This error originated from your test code, not from Cypress.

      When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
    """

  viewport:
    bad_args:  "#{cmd('viewport')} can only accept a string preset or a width and height as numbers."
    dimensions_out_of_range: "#{cmd('viewport')} width and height must be between 20px and 3000px."
    empty_string: "#{cmd('viewport')} cannot be passed an empty string."
    invalid_orientation: "#{cmd('viewport')} can only accept '{{all}}' as valid orientations. Your orientation was: '{{orientation}}'"
    missing_preset: "#{cmd('viewport')} could not find a preset for: '{{preset}}'. Available presets are: {{presets}}"

  visit:
    body_circular: ({ path }) -> """
      The `body` parameter supplied to #{cmd('visit')} contained a circular reference at the path "#{path.join(".")}".

      `body` can only be a string or an object with no circular references.
    """
    status_code_flags_invalid: """
    #{cmd('visit')} was invoked with { failOnStatusCode: false, retryOnStatusCodeFailure: true }.

    These options are incompatible with each other.

     - To retry on non-2xx status codes, pass { failOnStatusCode: true, retryOnStatusCodeFailure: true }.
     - To not retry on non-2xx status codes, pass { failOnStatusCode: true, retryOnStatusCodeFailure: true }.
     - To fail on non-2xx status codes without retrying (the default behavior), pass { failOnStatusCode: true, retryOnStatusCodeFailure: false }
    """
    invalid_1st_arg: "#{cmd('visit')} must be called with a URL or an options object containing a URL as its 1st argument"
    invalid_method: "#{cmd('visit')} was called with an invalid method: '{{method}}'. Method can only be GET or POST."
    invalid_headers: "#{cmd('visit')} requires the 'headers' option to be an object."
    invalid_qs: "#{cmd('visit')} requires the 'qs' option to be an object, but received: '{{qs}}'"
    no_duplicate_url: """
      #{cmd('visit')} must be called with only one URL. You specified two URLs:

      URL from the `options` object: {{optionsUrl}}
      URL from the `url` parameter: {{url}}
    """
    cannot_visit_2nd_domain: """
      #{cmd('visit')} failed because you are attempting to visit a second unique domain.

      You may only visit a single unique domain per test.

      Different subdomains are okay, but unique domains are not.

      The previous domain you visited was: '{{previousDomain}}'

      You're attempting to visit this new domain: '{{attemptedDomain}}'

      You may need to restructure some of your code to prevent this from happening.

      https://on.cypress.io/cannot-visit-second-unique-domain
    """
    loading_network_failed: """
      #{cmd('visit')} failed trying to load:

      {{url}}

      We attempted to make an http request to this URL but the request failed without a response.

      We received this error at the network level:

        > {{error}}

      Common situations why this would fail:
        - you don't have internet access
        - you forgot to run / boot your web server
        - your web server isn't accessible
        - you have weird network configuration settings on your computer

      The stack trace for this error is:

      {{stack}}
    """
    loading_file_failed: (obj) ->
      """
        #{cmd('visit')} failed trying to load:

        #{obj.url}

        We failed looking for this file at the path:

        #{obj.path}

        The internal Cypress web server responded with:

          > #{obj.status}: #{obj.statusText}

        #{getRedirects(obj, "We were redirected")}
      """
    loading_http_failed: (obj) ->
      """
        #{cmd('visit')} failed trying to load:

        #{obj.url}

        The response we received from your web server was:

          > #{obj.status}: #{obj.statusText}

        This was considered a failure because the status code was not '2xx'.

        #{getRedirects(obj, "This http request was redirected")}

        If you do not want status codes to cause failures pass the option: 'failOnStatusCode: false'
      """
    loading_invalid_content_type: (obj) ->
      phrase = if obj.path then "this local file" else "your web server"

      """
        #{cmd('visit')} failed trying to load:

        #{obj.url}

        The content-type of the response we received from #{phrase} was:

          > #{obj.contentType}

        This was considered a failure because responses must have content-type: 'text/html'

        However, you can likely use #{cmd('request')} instead of #{cmd('visit')}.

        #{cmd('request')} will automatically get and set cookies and enable you to parse responses.
      """

    specify_file_by_relative_path: """
      #{cmd('visit')} failed because the 'file://...' protocol is not supported by Cypress.

      To visit a local file, you can pass in the relative path to the file from the `projectRoot` (Note: if the configuration value `baseUrl` is set, the supplied path will be resolved from the `baseUrl` instead of `projectRoot`)

      https://docs.cypress.io/api/commands/visit.html

      https://docs.cypress.io/api/cypress-api/config.html
      """

  wait:
    alias_invalid: "'{{prop}}' is not a valid alias property. Are you trying to ask for the first request? If so write @{{str}}.request"
    fn_deprecated: "#{cmd('wait', 'fn')} has been deprecated. Instead just change this command to be #{cmd('should', 'fn')}."
    invalid_1st_arg: "#{cmd('wait')} only accepts a number, an alias of a route, or an array of aliases of routes. You passed: {{arg}}"
    invalid_alias: "#{cmd('wait')} only accepts aliases for routes.\nThe alias: '{{alias}}' did not match a route."
    invalid_arguments: "#{cmd('wait')} was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array."
    timed_out: "#{cmd('wait')} timed out waiting {{timeout}}ms for the {{num}} {{type}} to the route: '{{alias}}'. No {{type}} ever occurred."

  window:
    iframe_doc_undefined: "The remote iframe's document is undefined"
    iframe_undefined: "The remote iframe is undefined"

  within:
    invalid_argument: "#{cmd('within')} must be called with a function."

  xhr:
    aborted: "This XHR was aborted by your code -- check this stack trace below."
    missing: "XMLHttpRequest#xhr is missing."
    network_error: "The network request for this XHR could not be made. Check your console for the reason."
    requestjson_deprecated: "requestJSON is now deprecated and will be removed in the next version. Update this to 'requestBody' or 'request.body'."
    responsejson_deprecated: "responseJSON is now deprecated and will be removed in the next version. Update this to 'responseBody' or 'response.body'."
}
