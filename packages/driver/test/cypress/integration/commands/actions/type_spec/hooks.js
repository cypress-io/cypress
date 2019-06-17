const { $ } = Cypress

before(() => {
  return cy

  .visit('/fixtures/dom.html')
  .then(function (win) {
    this.body = win.document.body.outerHTML

    const el = cy.$$('[contenteditable]:first').get(0)

    //# by default... the last new line by itself
    //# will only ever count as a single new line...
    //# but new lines above it will count as 2 new lines...
    //# so by adding "3" new lines, the last counts as 1
    //# and the first 2 count as 2...
    el.innerHTML = '<div><br></div>'.repeat(3)

    //# browsers changed their implementation
    //# of the number of newlines that <div><br></div>
    //# create. newer versions of chrome set 2 new lines
    //# per set - whereas older ones create only 1 new line.
    //# so we grab the current sets for the assertion later
    //# so this test is browser version agnostic
    const newLines = el.innerText

    this.multiplierNumNewLines = (newLines.length - 1) / 2
  })
})

beforeEach(function () {
  const doc = cy.state('document')

  return $(doc.body).empty().html(this.body)
})
