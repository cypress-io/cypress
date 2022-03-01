// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain actions', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
  })

  it('.type()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').type('foo')
      .should('have.value', 'foo')
    })
  })

  it('.focus()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').focus()
      .should('be.focused')
    })
  })

  it('.blur()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').type('foo').blur()
      .should('not.be.focused')
    })
  })

  it('.clear()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input')
      .type('foo').should('have.value', 'foo')
      .clear().should('have.value', '')
    })
  })

  it('.submit()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      const afterFormSubmitted = new Promise<void>((resolve) => {
        cy.once('form:submitted', resolve)
      })

      cy.get('#input-type-submit').submit()
      cy.wrap(afterFormSubmitted)
    })
  })

  it('.click()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').then(($btn) => {
        const onClick = new Promise<void>((resolve) => {
          $btn.on('click', () => resolve())
        })

        cy.wrap($btn).click()
        cy.wrap(onClick)
      })
    })
  })

  it('.dblclick()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').then(($btn) => {
        const afterDblClick = new Promise<void>((resolve) => {
          $btn.on('dblclick', () => resolve())
        })

        cy.wrap($btn).dblclick()
        cy.wrap(afterDblClick)
      })
    })
  })

  it('.rightclick()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').then(($btn) => {
        const afterContextmenu = new Promise<void>((resolve) => {
          $btn.on('contextmenu', () => resolve())
        })

        cy.wrap($btn).rightclick()
        cy.wrap(afterContextmenu)
      })
    })
  })

  it('.check()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().should('be.checked')
    })
  })

  it('.uncheck()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().should('be.checked')
      .uncheck().should('not.be.checked')
    })
  })

  it('.select()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('select[name="foods"]')
      .select('Japanese').should('have.value', 'Japanese')
    })
  })

  it('.scrollIntoView()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#scroll-into-view-vertical h5')
      .should('not.be.visible')
      .scrollIntoView().should('be.visible')
    })
  })

  it('.scrollTo()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#scroll-into-view-vertical h5').should('not.be.visible')
      cy.get('#scroll-into-view-vertical').scrollTo(0, 300)
      cy.get('#scroll-into-view-vertical h5').should('be.visible')
    })
  })

  it('.trigger()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').then(($btn) => {
        const afterClick = new Promise<void>((resolve) => {
          $btn.on('click', () => resolve())
        })

        cy.wrap($btn).trigger('click')
        cy.wrap(afterClick)
      })
    })
  })

  it('.selectFile()', () => {
    cy.get('a[data-cy="files-form-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.wrap(Cypress.Buffer.from('foo')).as('foo')

      cy.get('#basic')
      .selectFile({ contents: '@foo', fileName: 'foo.txt' })
      .should(($input) => {
        const input = $input[0] as HTMLInputElement
        const file = input!.files![0]

        expect(file.name).to.equal('foo.txt')

        return file.arrayBuffer()
        .then((arrayBuffer) => {
          const decoder = new TextDecoder('utf8')
          const contents = decoder.decode(arrayBuffer)

          expect(contents).to.equal('foo')
        })
      })
    })
  })
})
