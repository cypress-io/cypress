// https://github.com/cypress-io/cypress/issues/3871
describe(`issue 3871 - Cypress invoke`, () => {
  it(`should work on not nested properties`, () => {
    cy.window().then((win) => {
      win.val = 40
      win.get = function () {
        return this.val
      }

      cy.window().invoke(`get`).should(`eq`, 40)
    })
  })

  it(`should work on 1 level nested properties`, () => {
    cy.window().then((win) => {
      win.obj = {
        val: 41,
        get () {
          return this.val
        },
      }

      cy.window().invoke(`obj.get`).should(`eq`, 41)
    })
  })

  it(`should work on 2 level nested properties`, () => {
    cy.window().then((win) => {
      win.obj = {
        innerObj: {
          val: 42,
          get () {
            return this.val
          },
        },
      }

      cy.window().invoke(`obj.innerObj.get`).should(`eq`, 42)
    })
  })

  it(`should work on 3 level nested properties`, () => {
    cy.window().then((win) => {
      win.obj = {
        innerObj: {
          innerInnerObj: {
            val: 43,
            get () {
              return this.val
            },
          },
        },
      }

      cy.window().invoke(`obj.innerObj.innerInnerObj.get`).should(`eq`, 43)
    })
  })
})
