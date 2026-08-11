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
INVALID_SELECTOR: "#status[" is not a valid CSS selector
`

exports['status'] = `
PID  PROJECT  TYPE  BROWSER
<pid>  <project>  e2e  Chrome

✓ cypress/e2e/aut-content.cy.js  (started at <time>)
✓ 1  ✖ --  ○ --
`

exports['reporter failed command log'] = `
✖ Failing > fails after loading the fixture page  failed

TEST BODY · r3
   1  visit    cypress/e2e/aut-content.html
   2  get      #status
   3  -assert  expected <div#status> to have text this is not what the page says, but the text was ready ✖

✖ AssertionError
  Timed out retrying after <duration>: expected '<div#status>' to have text 'this is not what the page says', but the text was 'ready'

  cypress/e2e/failing.cy.js:5:23
    3 |   it('fails after loading the fixture page', () => {
    4 |     cy.visit('cypress/e2e/aut-content.html')
  > 5 |     cy.get('#status').should('have.text', 'this is not what the page says')
      |                       ^
    6 |   })
    7 | })
    8 |
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
