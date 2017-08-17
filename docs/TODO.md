TODO:

- lifecycle events
<!-- - cypress visibility model -->
  <!-- - how visibility is calculated -->
<!-- - actions and interactions <-- definitely core concept
  - where should this go ?
    - core concept
    - guide?
    - appendix / reference? -->
  - cy.trigger
  <!-- - visibility -->
  <!-- - scrolling -->
  <!-- - nudging -->
  <!-- - snapshotting (inaccurate) -->
  <!-- - bypassing { force: true } / trigger events directly -->
  - event firing (simulated)

<!-- rename appendix to references? -->

FAQ
  - add support question in Company?

<!-- API -->
  <!-- - question marks next to Yields / Timeout? -->

<!-- Timeout
  X command will first wait for the element [to become actionable], and then wait for. It has an implicit/default (what do we call this?) assertion that the element *must* exist.

  1. First for the element [to become actionable]
  2. Then for the element to exist in the DOM
  3. Then for any assertions to pass

  X command will first wait for the element [to become actionable], and then it will implicitly wait for the element to exist in the dOM. Finally then wait for. It has an implicit/default (what do we call this?) assertion that the element *must* exist.

  The problem with existing docs like `eq`, `document` is that they don't have an implicit assertion. But they can timeout on regular assertions.

  ## Assertions
  `cy.window()` will implicitly wait until the window is in an accessible state.

  You can add any kind of assertion you want.

  ## Timeout {% timeout %}
  `cy.window` will time out after waiting for `defaultCommandTimeout` for:

  1. Until the window is accessible
  2. And all assertions you've added pass -->

<!-- Types of Commands
  - action Commands
    - waits for element to become actionable
      - adding assertions for this is unnecessary
    - waits for assertions to pass
  - dom commands
    - waits for element to exist
    - waits for assertions to pass
  - wrap
    - nothing implicit
    - waits for assertions to pass
  - route
    - cannot timeout, no assertions   -->

Intro to Cypress
  <!-- - we don't ever describe assertions as 'blocking / guarding state' -->
  <!-- - we need to mention this too in the `should` and `and` docs -->
    <!-- - (there is a note for this below) -->
  <!-- - we dont talk about needing to chain everything or return `cy` -->
  <!-- - finish the new assertion bits
    - implicit / default assertions
    - everything is retried
    - assertions act like guards
    - talk about 'not.exist' <-- this is completely missing!
      - mention it in two places, 'up top / down below' -->
  <!-- - add "Commands are not promises" to pair with the other one -->
    <!-- - they have promise like qualities but are different -->

<!-- Default / Implicit assertions
  - where do we ever talk about this?
  - was this removed from the old docs?
  - find my list of 'must haves' in the intro docs -->

Command Creation
  - declaratively talk about assertions
  - Cypress.Commands.add('foo', { assertions: 'retry' })
  - Cypress.Commands.add('foo', { assertions: true })
  - Cypress.Commands.add('foo', { assertions: false })
  - automatically add stuff about it existing
  - Cypress.Commands.add('foo', { assertionRequirements: 'dom / exists' })
  - Cypress.Commands.add('foo', { timeout: 60000 })
  - Cypress.Commands.add('foo', { allowsAliasing: true }) // can be aliased
  - Cypress.Commands.add('foo', { commandsAllowed: ['as'] }) // allow specific commands
  - Cypress.Commands.add('foo', { chainable: false }) // dont allow chaining
  - need to also take into accounts timeout
    - with the default being defaultCommandTimeout

- on.cypress.io
  - add note in the readme that says
  - DO NOT LINK TO HASH TAGS FROM THE DESKTOP app
    - instead create a new link
    - bad: https://on.cypress.io/configuration#section-global
    - good: https://on.cypress.ioconfiguration-global
  - dont add the prefix
    - bad: https://on.cypress.io/guides/configuration
    - good: https://on.cypress.io/configuration

<!-- - list of assertions
  - mention how to extend assertions
  - Writing / Adding your own assertions?
    - check out the recipe
    - you can add anything to chai you want -->

<!-- - Bundled Tools
  - use github icon
  - link to assertions
  - link to the guides appropriate for each tool
    - chai -> assertions
    - mocha -> writing tests
    - sinon -> spies / stubs / clocks -->

<!-- - should / and
  - link to list of assertions
  - maybe add a note at the top? -->

<!-- - intro to cypress
  - reference assertions correctly -->

<!-- - Linking
  - when linking to recipes we should probably link to the internal recipe  doc instead of the external one? (YES)
  - bunch of docs still need the {% url %} helper

FIX -spies,stubs and stubs,spies
 - append '-recipe' to the example/recipe -->

<!-- - should / and
  <!-- - improve the "description" -->
  - talk about retrying
  - make sure the intro to cypress explains this -->

- FAQ
  - Using Cypress dashboard questions -> move to dashboard
  - Why are there weird questions about CI errors?

- Aliasing
  - explain how anything can be aliased

- API docs
  - make sure we explictly say that DOM commands yield a jquery wrapped object containing the collection of elements

- Debugging
  - invalid URL's not using the URL tag helper

<!-- - Implicit way to fail? -->
  <!-- - different than a default assertion? -->

<!-- - Assertions
  - Default assertions should move to the top of the assertion sections
    - this couples nicely with the "you dont have to write assertions"
    - then the next docs should be like: "okay so you want to write an assertion!"
  - We still don't do a good / clear job explaining that assertions block cypress until that state is reached
  - Why are we linking: "reach a desired state" to interacting with eleents?
    - this should be linking to a section within assertions -->

- API
  <!-- - make sure we have consistent nomenclature
    - Usage
      `.check()` requires being chained off another cy command that *yields* an `<input>` DOM element.

      These `<input>` elements must have type `checkbox` or `radio`.
    - Options Table
      Option | Default | Notes
      --- | --- | ---
      `log` | `true` | Whether to display command in Command Log
      `force` | `false` | Forces the check, disables {% url 'waiting for actionability' interacting-with-elements#Bypassing %}
      `timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to wait until this command times out
    - Yields
      - `.as()` yields the subject from the previous command.
    - Assertions
      - `.as()` has no default assertions.
      - `.and()` has no default assertions other than what you specify.
    - Timeout
      - `.check()` will wait for the duration of its `timeout` option for its default assertion and any additional assertions to pass.
  - blur  
    this should retry until the element is in focus instead of immediately dieing -->
  - What's the difference between a default assertion and an error?
    - an error will fire IMMEDIATELY without waiting
      - like you called .type() on an array or didnt pass in the right arguments
      - a default assertion will automatically retry until the state matches and will wait
        - its like its been added as an assertion after the command
