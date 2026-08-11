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
PID    PROJECT                                                                           TYPE  BROWSER
<pid>  <project>  e2e   Chrome

✓ cypress/e2e/aut-content.cy.js  (started at <time> AM)
✓ 1  ✖ --  ○ --
`
