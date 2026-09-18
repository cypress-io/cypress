// https://github.com/cypress-io/cypress/issues/3871
describe(`cy.invoke with dot-separated property paths`, () => {
  it(`invokes a top-level function`, () => {
    cy.window().then((win) => {
      win.val = 40
      win.get = function () {
        return this.val
      }

      cy.window().invoke(`get`).should(`eq`, 40)
    })
  })

  it(`invokes a function nested 1 level deep`, () => {
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

  it(`invokes a function nested 2 levels deep`, () => {
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

  it(`invokes a function nested 3 levels deep`, () => {
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
