exports['dom by selector'] = `
<div id="status" data-cy="status">ready</div>
`

exports['dom ambiguous selector'] = `
⚠ selector '.item' matched 3 elements but must be unique
provide --at with an index to select an element from the list or update the selector.
index  selector
0      'ul > :nth-child(1)'
1      'ul > :nth-child(2)'
2      'ul > :nth-child(3)'
`

exports['aria subtree'] = `
region  Controls
  button  Toggle
  button  Locked  [disabled]
  LabelText
  textbox  Search
  checkbox
  textbox  Required field  [required]
`

exports['dom invalid selector'] = `
An invalid value was given.

Expected --selector to be a valid CSS selector.

Instead the value was: "#status["
`

exports['status'] = `
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

✓ cypress/e2e/aut-content.cy.js  (started at <time>)
✓ 1  ✖ --  ○ --
`

exports['inspect an element'] = `
ATTRIBUTES (2)
  id       status
  data-cy  status

ACCESSIBILITY
  role  generic

BOX
  x <x>   y <y>   width 200   height 24

STYLES (24)
  display           block
  visibility        visible
  opacity           1
  position          static
  top               auto
  right             auto
  bottom            auto
  left              auto
  width             200px
  height            24px
  margin            0px
  padding           0px
  border            0px none rgb(0, 100, 0)
  box-sizing        content-box
  color             rgb(0, 100, 0)
  background-color  rgb(240, 240, 240)
  font-size         16px
  font-weight       400
  line-height       normal
  text-align        start
  z-index           auto
  overflow          visible
  pointer-events    auto
  cursor            auto
`

exports['inspect no match'] = `
'#missing'  not found
`

exports['specs listing'] = `
SPECS (15)
  cypress/e2e/agents.cy.js  <modified>
  cypress/e2e/aut-content.cy.js  <modified>
  cypress/e2e/console-props-shapes.cy.js  <modified>
  cypress/e2e/console-props.cy.js  <modified>
  cypress/e2e/failing.cy.js  <modified>
  cypress/e2e/hook-failure.cy.js  <modified>
  cypress/e2e/hooks.cy.js  <modified>
  cypress/e2e/journey.cy.js  <modified>
  cypress/e2e/lifecycle.cy.js  <modified>
  cypress/e2e/long-run.cy.js  <modified>
  cypress/e2e/network.cy.js  <modified>
  cypress/e2e/pin-target.cy.js  <modified>
  cypress/e2e/retries.cy.js  <modified>
  cypress/e2e/slow.cy.js  <modified>
  cypress/e2e/unbuildable.cy.js  <modified>
`

exports['sessions listing'] = `
SESSIONS (1)
  PID  PROJECT  TYPE  BROWSER
  <pid>  <project>  e2e  Chrome
`

exports['status before a spec is selected'] = `
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

● spec not selected
`

exports['run launched'] = `
● cypress/e2e/aut-content.cy.js is running

use tap status to check progress
`

exports['reporter failed command log'] = `
✖ Failing > fails after loading the fixture page  failed

TEST BODY · r3
   1  visit    cypress/e2e/aut-content.html
   2  get      #status
   3  -assert  expected <div#status> to have text this is not what the page says, but the text was ready ✖

✖ AssertionError
  Timed out retrying after <duration>: expected '<div#status>' to have text 'this is not what the page says', but the text was 'ready'

  cypress/e2e/failing.cy.js:10:23
     8 |   it('fails after loading the fixture page', () => {
     9 |     cy.visit('cypress/e2e/aut-content.html')
  > 10 |     cy.get('#status').should('have.text', expectedText)
       |                       ^
    11 |   })
    12 | })
    13 |
`

exports['status while running'] = `
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

● cypress/e2e/long-run.cy.js  (started at <time>)
✓ --  ✖ --  ○ 1
`

exports['reporter spec overview'] = `
cypress/e2e/pin-target.cy.js  (started at <time>)
✓ 1  ✖ --  ○ --  <duration>

Pin Target
   r3  ✓ clicks the toggle  <duration>
`

exports['reporter command log'] = `
✓ Pin Target > clicks the toggle  passed

TEST BODY · r3
   1  visit    cypress/e2e/pin-target.html
   2  get      #toggle
   3  -click
   4  get      #status
   5  -assert  expected <div#status> to have text clicked
`

exports['command detail of a click'] = `
TEST BODY · r3
✓  3  -click  passed

SNAPSHOTS (2)
  #  NAME    TIME
  1  before  <time>
  2  after   <time>

CONSOLE PROPS
  Applied To  <button#toggle>
  Elements    1
  Coords
    x  <x>
    y  <y>

MOUSE EVENTS (9)
  Event Type   Target Element   Prevented Default  Stopped Propagation  Active Modifiers
  pointerover  <button#toggle>  null               null                 null
  mouseover    <button#toggle>  null               null                 null
  pointermove  <button#toggle>  null               null                 null
  mousemove    <button#toggle>  null               null                 null
  pointerdown  <button#toggle>  null               null                 null
  mousedown    <button#toggle>  null               null                 null
  pointerup    <button#toggle>  null               null                 null
  mouseup      <button#toggle>  null               null                 null
  click        <button#toggle>  null               null                 null
`

exports['pin a snapshot'] = `
⚲ PINNED - (1/2) before
TEST BODY · r3
   3  -click
`

exports['status while pinned'] = `
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

✓ cypress/e2e/pin-target.cy.js  (started at <time>)
✓ 1  ✖ --  ○ --

⚲ PINNED - (1/2) before
TEST BODY · r3
  3  -click
`

exports['pin clear with nothing pinned'] = `
⚲ FAILED TO CLEAR PIN
`

exports['command detail of a failed assertion'] = `
TEST BODY · r3
✖  3  -assert  expected <div#status> to have text this is not what the page says, but the text was ready  failed

SNAPSHOTS (1)
  #  NAME  TIME
  1  —     <time>

CONSOLE PROPS
  subject  <div#status>
  Message  expected <div#status> to have text this is not what the page says, but the text was ready

ERROR
  AssertionError: Timed out retrying after <duration>: expected '<div#status>' to have text 'this is not what the page says…
      at Context.eval (webpack:///./cypress/e2e/failing.cy.js:10:22)
`

exports['reporter network command log'] = `
✓ Network > records intercept, real request, and cy.request detail  passed

ROUTES (1)
  METHOD  MATCHER     STUBBED  ALIAS     #
  GET     /api/users  yes      getUsers  1

TEST BODY · r3
   1  visit     cypress/e2e/network.html
   2  wait      @getUsers
  e1    (fetch) ● GET 200 /cypress/e2e/network.html
  e2    (fetch) ● GET 200 /api/users  getUsers  (stubbed)
   3  get       #status
   4  -assert   expected <div#status> to have text stubbed-ok
   5  location  href
   6  request   ● GET 200 /cypress/e2e/network.html
   7  its       .status
   8  -assert   expected 200 to equal 200
`

exports['command with a bounded payload'] = `
TEST BODY · r3
✓  2  deep-console-props  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  actual
    body    [13,891 characters withheld — pass --json to include it]
    note    [1,200 characters withheld — pass --json to include it]
    headers
      content-type  application/json
    status  200
`

exports['command with no snapshots or console props'] = `
TEST BODY · r3
✓  1  empty-console-props  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  [NO CONSOLE PROPS]
`

exports['command console props shapes'] = `
TEST BODY · r3
✓  1  props-shapes  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  Text                              a plain value
  Number                            42
  Negative                          -1.5
  Boolean                           true
  Null                              null
  Empty String                      (empty string)
  Empty Object                      {}
  Empty Array                       []
  (empty key)                       value under an empty key
  A Key Far Longer Than The Colum…  the key is clamped, not this
  Control Characters                tab here carriage then red
  Multi Line
    first line
    second line
    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…
  Scalar List
    1  alpha
    2  beta
    3  gamma
  Rows
    Name    Count  Detail  Tags  Note
    first   1      {…}     […]
    second  2      {…}     […]   a note long enough that the table has t…
    third   3      {…}     […]
  One Row
    1
      only  row
  Nested
    one
      two
        three  {1 key}
  Wide                              {12 keys}

2 sections collapsed — open all of it with --depth all
`

exports['command console props shapes at depth all'] = `
TEST BODY · r3
✓  1  props-shapes  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  Text                              a plain value
  Number                            42
  Negative                          -1.5
  Boolean                           true
  Null                              null
  Empty String                      (empty string)
  Empty Object                      {}
  Empty Array                       []
  (empty key)                       value under an empty key
  A Key Far Longer Than The Colum…  the key is clamped, not this
  Control Characters                tab here carriage then red
  Multi Line
    first line
    second line
    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…
  Scalar List
    1  alpha
    2  beta
    3  gamma
  Rows
    Name    Count  Detail  Tags  Note
    first   1      {…}     […]
    second  2      {…}     […]   a note long enough that the table has t…
    third   3      {…}     […]
  One Row
    1
      only  row
  Nested
    one
      two
        three
          four  the deepest value
  Wide
    alpha    1
    bravo    2
    charlie  3
    delta    4
    echo     5
    foxtrot  6
    golf     7
    hotel    8
    india    9
    juliett  10
    kilo     11
    lima     12
`

exports['command console props shapes at depth 0'] = `
TEST BODY · r3
✓  1  props-shapes  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  Text                              a plain value
  Number                            42
  Negative                          -1.5
  Boolean                           true
  Null                              null
  Empty String                      (empty string)
  Empty Object                      {}
  Empty Array                       []
  (empty key)                       value under an empty key
  A Key Far Longer Than The Colum…  the key is clamped, not this
  Control Characters                tab here carriage then red
  Multi Line
    first line
    second line
    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…
  Scalar List                       [3 items]
  Rows                              [3 items]
  One Row                           [1 item]
  Nested                            {1 key}
  Wide                              {12 keys}

5 sections collapsed — open all of it with --depth all
`

exports['command console props envelope'] = `
TEST BODY · r3
✓  2  props-envelope  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  Summary  the command’s own key/values

MOUSE EVENTS (2)
  Event Type   Target           Prevented
  pointerdown  <button#toggle>  false
  mousedown    <button#toggle>  true

COORDS
  x  10
  y  20

GROUPS
  1
    name   a logged group
    items  2

ARGS
  1  first argument
  2  42

ERROR
  AssertionError: the payload did not match
      at the first frame
      at the second frame
`

exports['reporter spec overview with hooks'] = `
cypress/e2e/hooks.cy.js  (started at <time>)
✓ 3  ✖ --  ○ 1  <duration>

Hooks
   r3  ✓ logs nothing of its own  <duration>
   r4  ✓ logs a command of its own  <duration>
   r5  ○ never runs

Hooks > Nested
   r7  ✓ is reported under the full suite path  <duration>
`

exports['reporter command log with hooks'] = `
✓ Hooks > logs nothing of its own  passed

BEFORE ALL · h1
   1  wrap  before all

BEFORE EACH · h2
   1  wrap  before each

AFTER EACH · h3
   1  wrap  after each
`

exports['reporter pending test'] = `
○ Hooks > never runs  pending

No commands were logged for this test.
`

exports['reporter with spies and stubs'] = `
✓ Agents > registers a spy and a stub the reporter tabulates  passed

SPIES / STUBS (2)
  TYPE    FUNCTION  ALIAS(ES)  CALLS
  spy-1   greet     greeter    2
  stub-1  shout     shouter    1

TEST BODY · r3
   1  wrap     null
  e1    (spy-1) greet()  greeter
  e2    (spy-1) greet()  greeter
  e3    (stub-1) shout()  shouter
   2  get      @greeter
   3  -assert  expected greet to have been called exactly twice
   4  get      @shouter
   5  -assert  expected shout to have been called exactly once
`

exports['status with a build failure'] = `
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

✖ cypress/e2e/unbuildable.cy.js  (started at <time>)

Error: Webpack Compilation Error <compiler detail>
`

exports['reporter empty spec overview'] = `
cypress/e2e/unbuildable.cy.js  (started at <time>)
✓ --  ✖ --  ○ --  --

No tests were found in this spec.
`

exports['reporter spec overview with skips'] = `
cypress/e2e/hook-failure.cy.js  (started at <time>)
✓ --  ✖ 1  ○ --  - 2  <duration>

Hook Failure
   r3  ✖ carries the hook failure  <duration>
   r4  - is skipped along with it
   r5  - is skipped too
`

exports['reporter hook failure'] = `
✖ Hook Failure > carries the hook failure  failed

No commands were logged for this test.

✖ Error
  the before hook could not set up

  Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`Hook Failure\`

  cypress/e2e/hook-failure.cy.js:3:11
    1 | describe('Hook Failure', () => {
    2 |   before(() => {
  > 3 |     throw new Error('the before hook could not set up')
      |           ^
    4 |   })
    5 |
    6 |   it('carries the hook failure', () => {
`

exports['reporter evicted command log'] = `
✓ Eviction > is the first test  passed

TEST BODY · r3
   1  visit      (cleaned up)
   2  get        (cleaned up)
   3  -click     (cleaned up)
   4  get        (cleaned up)
   5  -assert    (cleaned up)
`

exports['command detail of an evicted row'] = `
TEST BODY · r3
✓  1  visit  (cleaned up)  passed

SNAPSHOTS (0)
  [NO SNAPSHOTS]

CONSOLE PROPS
  Message  The command details and snapshot has been cleaned up to reduce the number of tests in memory.
`

exports['reporter journey command log'] = `
✓ Journey > walks a page with network, logs, typing and a click  passed

ROUTES (1)
  METHOD  MATCHER     STUBBED  ALIAS     #
  GET     /api/users  yes      getUsers  1

TEST BODY · r3
   1  checkpoint  the page settled
   2  visit       cypress/e2e/journey.html
   3  wait        @getUsers
  e1    (fetch) ● GET 200 /api/users  getUsers  (stubbed)
   4  log         the stub answered
   5  get         #name  @nameField
   6  -type       tap
   7  get         @nameField
   8  -assert     expected <input#name> to have value tap
   9  get         #toggle
  10  -click
  11  get         #status
  12  -assert     expected <div#status> to have text clicked
`

exports['reporter spec overview with retries'] = `
cypress/e2e/retries.cy.js  (started at <time>)
✓ 1  ✖ --  ○ --  <duration>

Retries
   r3  ✓ passes on the second attempt  <duration>  (2 attempts)
         ✖ attempt 1  <duration>
         ✓ attempt 2  <duration>
`

exports['reporter failed first attempt'] = `
✖ Retries > passes on the second attempt  failed

TEST BODY · r3
   1  assert  attempt: expected 1 to be above 1 ✖

✖ AssertionError
  attempt: expected 1 to be above 1

  cypress/e2e/retries.cy.js:10:39
     8 |     attempts++
     9 |
  > 10 |     expect(attempts, 'attempt').to.be.greaterThan(1)
       |                                       ^
    11 |   })
    12 | })
    13 |
`

exports['complete failed run debugging journey'] = `
$ cypress tap sessions
SESSIONS (1)
  PID  PROJECT  TYPE  BROWSER
  <pid>  <project>  e2e  Chrome

$ cypress tap --session <pid> specs
SPECS (15)
  cypress/e2e/agents.cy.js  <modified>
  cypress/e2e/aut-content.cy.js  <modified>
  cypress/e2e/console-props-shapes.cy.js  <modified>
  cypress/e2e/console-props.cy.js  <modified>
  cypress/e2e/failing.cy.js  <modified>
  cypress/e2e/hook-failure.cy.js  <modified>
  cypress/e2e/hooks.cy.js  <modified>
  cypress/e2e/journey.cy.js  <modified>
  cypress/e2e/lifecycle.cy.js  <modified>
  cypress/e2e/long-run.cy.js  <modified>
  cypress/e2e/network.cy.js  <modified>
  cypress/e2e/pin-target.cy.js  <modified>
  cypress/e2e/retries.cy.js  <modified>
  cypress/e2e/slow.cy.js  <modified>
  cypress/e2e/unbuildable.cy.js  <modified>

$ cypress tap --session <pid> run cypress/e2e/failing.cy.js
● cypress/e2e/failing.cy.js is running

use tap status to check progress

$ cypress tap --session <pid> status
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

✖ cypress/e2e/failing.cy.js  (started at <time>)
✓ --  ✖ 1  ○ --

$ cypress tap --session <pid> reporter
cypress/e2e/failing.cy.js  (started at <time>)
✓ --  ✖ 1  ○ --  <duration>

Failing
  r3  ✖ fails after loading the fixture page  <duration>

$ cypress tap --session <pid> reporter --test-id r3
✖ Failing > fails after loading the fixture page  failed

TEST BODY · r3
  1  visit  cypress/e2e/aut-content.html
  2  get  #status
  3  -assert  expected <div#status> to have text this is not what the page says, but the text was ready ✖

✖ AssertionError
  Timed out retrying after <duration>: expected '<div#status>' to have text 'this is not what the page says', but the text was 'ready'

  cypress/e2e/failing.cy.js:10:23
  8 |  it('fails after loading the fixture page', () => {
  9 |  cy.visit('cypress/e2e/aut-content.html')
  > 10 |  cy.get('#status').should('have.text', expectedText)
  |  ^
  11 |  })
  12 | })
  13 |

$ cypress tap --session <pid> command --test-id r3 --command-id 3
TEST BODY · r3
✖  3  -assert  expected <div#status> to have text this is not what the page says, but the text was ready  failed

SNAPSHOTS (1)
  #  NAME  TIME
  1  —  <time>

CONSOLE PROPS
  subject  <div#status>
  Message  expected <div#status> to have text this is not what the page says, but the text was ready

ERROR
  AssertionError: Timed out retrying after <duration>: expected '<div#status>' to have text 'this is not what the page says…
  at Context.eval (webpack:///./cypress/e2e/failing.cy.js:10:22)

$ cypress tap --session <pid> dom --selector #status
<div id="status" data-cy="status" data-cypress-el="true">ready</div>

$ cypress tap --session <pid> inspect --selector #status
ATTRIBUTES (3)
  id  status
  data-cy  status
  data-cypress-el  true

ACCESSIBILITY
  role  generic

BOX
  x <x>  y <y>  width 200  height 24

STYLES (24)
  display  block
  visibility  visible
  opacity  1
  position  static
  top  auto
  right  auto
  bottom  auto
  left  auto
  width  200px
  height  24px
  margin  0px
  padding  0px
  border  0px none rgb(0, 100, 0)
  box-sizing  content-box
  color  rgb(0, 100, 0)
  background-color  rgb(240, 240, 240)
  font-size  16px
  font-weight  400
  line-height  normal
  text-align  start
  z-index  auto
  overflow  visible
  pointer-events  auto
  cursor  auto
`
