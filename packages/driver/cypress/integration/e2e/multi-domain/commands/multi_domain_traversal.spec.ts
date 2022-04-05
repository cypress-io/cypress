context('multi-domain traversal', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.children()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').children().should('have.length', 3)
    })
  })

  it('.closest()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').closest('form')
    })
  })

  it('.eq()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id>input').eq(1).should('have.id', 'name')
    })
  })

  it('.filter()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-name>input')
      .filter('[name="dogs"]').should('have.length', 4)
    })
  })

  it('.find()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').find('input').should('have.length', 3)
    })
  })

  it('.first()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id>input').first().should('have.id', 'input')
    })
  })

  it('.last()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id>input').last().should('have.id', 'age')
    })
  })

  it('.next()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#input').next().should('have.id', 'name')
    })
  })

  it('.nextAll()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#input').nextAll().should('have.length', 2)
    })
  })

  it('.nextUntil()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#input').nextUntil('#age').should('have.length', 1)
    })
  })

  it('.not()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id>input').not('#age').should('have.length', 2)
    })
  })

  it('.parent()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').parent().should('have.id', 'dom')
    })
  })

  it('.parents()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').parents().should('have.length', 3)
    })
  })

  it('.parentsUntil()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').parentsUntil('body').should('have.length', 1)
    })
  })

  it('.prev()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#age').prev().should('have.id', 'name')
    })
  })

  it('.prevAll()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#age').prevAll().should('have.length', 2)
    })
  })

  it('.prevUntil()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#age').prevUntil('#input').should('have.length', 1)
    })
  })

  it('.siblings()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#input').siblings().should('have.length', 2)
    })
  })
})
