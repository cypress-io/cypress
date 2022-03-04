// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain traversal', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.children()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').children().should('have.length', 3)
    })
  })

  it('.closest()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').closest('form')
    })
  })

  it('.eq()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id>input').eq(1).should('have.id', 'name')
    })
  })

  it('.filter()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-name>input')
      .filter('[name="dogs"]').should('have.length', 4)
    })
  })

  it('.find()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').find('input').should('have.length', 3)
    })
  })

  it('.first()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id>input').first().should('have.id', 'input')
    })
  })

  it('.last()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id>input').last().should('have.id', 'age')
    })
  })

  it('.next()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').next().should('have.id', 'name')
    })
  })

  it('.nextAll()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').nextAll().should('have.length', 2)
    })
  })

  it('.nextUntil()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').nextUntil('#age').should('have.length', 1)
    })
  })

  it('.not()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id>input').not('#age').should('have.length', 2)
    })
  })

  it('.parent()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').parent().should('have.id', 'dom')
    })
  })

  it('.parents()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').parents().should('have.length', 3)
    })
  })

  it('.parentsUntil()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').parentsUntil('body').should('have.length', 1)
    })
  })

  it('.prev()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#age').prev().should('have.id', 'name')
    })
  })

  it('.prevAll()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#age').prevAll().should('have.length', 2)
    })
  })

  it('.prevUntil()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#age').prevUntil('#input').should('have.length', 1)
    })
  })

  it('.siblings()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').siblings().should('have.length', 2)
    })
  })
})
