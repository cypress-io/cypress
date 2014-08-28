## Getting Started

1. navigate into the installed `eclectus` directory
2. run `npm link` - this will reference the `bin/ecl` globally and you'll now have access to this command everywhere
3. run `gulp` to build the project files and to watch for any changes to JS/HTML/CSS
4. `cd` into your other projects root directory and run `ecl start` to start the eclectus server
5. navigate to `0.0.0.0:3000` in your browser

## Eclectus DSL (API)

Eclectus has a DSL covering 4 discrete aspects of testing:

  1. DOM (traversal / behaviors / events)
  2. XHR (requests / responses)
  3. Spying / Stubbing / Mocking
  4. Assertions / Expectations

Whenever you utilize this API within your tests - each of these actions will be recorded.  Eclectus intelligently checks each action for errors, and will display those accordingly.  Additionally, Eclectus creates a snapshot of the DOM for each action, allowing you to travel "back in time" to see the state of the DOM when the action ran.

## DOM API

### Scoping
  * [Ecl.find()](find)
  * [Ecl.within()](within)

### Behaviors
  * [.click()](click)
  * [.type()](type)
  * [.hover()](hover)

### Traversal
The following methods work identically to their jQuery counterparts.  These can be called on any valid Ecl scoped object.  IE: `Ecl.find("ul li").eq(0)`

  * .children()
  * .eq()
  * .first()
  * .last()
  * .next()
  * .parent()
  * .parents()
  * .prev()
  * .siblings()

### Utilities
  * [Ecl.wrap()](wrap)
  * [.$el]($el)
  * [.exist()](exist)