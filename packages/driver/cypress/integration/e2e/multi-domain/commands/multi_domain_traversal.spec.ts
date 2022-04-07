context('cy.origin traversal', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.children()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').children().should('have.length', 3)
    })
  })

  it('.closest()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').closest('form')
    })
  })

  it('.eq()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').eq(1).should('have.id', 'name')
    })
  })

  it('.filter()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-name>input')
      .filter('[name="dogs"]').should('have.length', 4)
    })
  })

  it('.find()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').find('input').should('have.length', 3)
    })
  })

  it('.first()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').first().should('have.id', 'input')
    })
  })

  it('.last()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').last().should('have.id', 'age')
    })
  })

  it('.next()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').next().should('have.id', 'name')
    })
  })

  it('.nextAll()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').nextAll().should('have.length', 2)
    })
  })

  it('.nextUntil()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').nextUntil('#age').should('have.length', 1)
    })
  })

  it('.not()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').not('#age').should('have.length', 2)
    })
  })

  it('.parent()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').parent().should('have.id', 'dom')
    })
  })

  it('.parents()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').parents().should('have.length', 3)
    })
  })

  it('.parentsUntil()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').parentsUntil('body').should('have.length', 1)
    })
  })

  it('.prev()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#age').prev().should('have.id', 'name')
    })
  })

  it('.prevAll()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#age').prevAll().should('have.length', 2)
    })
  })

  it('.prevUntil()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#age').prevUntil('#input').should('have.length', 1)
    })
  })

  it('.siblings()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').siblings().should('have.length', 2)
    })
  })
})
