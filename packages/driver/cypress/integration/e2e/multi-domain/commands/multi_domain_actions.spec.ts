import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin actions', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
  })

  it('.type()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').type('foo')
      .should('have.value', 'foo')
    })
  })

  it('.focus()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').focus()
      .should('be.focused')
    })
  })

  it('.blur()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').type('foo').blur()
      .should('not.be.focused')
    })
  })

  it('.clear()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input')
      .type('foo').should('have.value', 'foo')
      .clear().should('have.value', '')
    })
  })

  it('.submit()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      const afterFormSubmitted = new Promise<void>((resolve) => {
        cy.once('form:submitted', resolve)
      })

      cy.get('#input-type-submit').submit()
      cy.wrap(afterFormSubmitted)
    })
  })

  it('.click()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
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

    cy.origin('http://foobar.com:3500', () => {
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

    cy.origin('http://foobar.com:3500', () => {
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

    cy.origin('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().should('be.checked')
    })
  })

  it('.uncheck()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().should('be.checked')
      .uncheck().should('not.be.checked')
    })
  })

  it('.select()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('select[name="foods"]')
      .select('Japanese').should('have.value', 'Japanese')
    })
  })

  it('.scrollIntoView()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#scroll-into-view-vertical h5')
      .should('not.be.visible')
      .scrollIntoView().should('be.visible')
    })
  })

  it('.scrollTo()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#scroll-into-view-vertical h5').should('not.be.visible')
      cy.get('#scroll-into-view-vertical').scrollTo(0, 300)
      cy.get('#scroll-into-view-vertical h5').should('be.visible')
    })
  })

  it('.trigger()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
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

    cy.origin('http://foobar.com:3500', () => {
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

  context('#consoleProps', () => {
    const { _ } = Cypress
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.get()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('get', logs, 'foobar.com')

        // make sure $el is in fact a jquery instance to keep the logs happy
        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('get')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('#button')

        // The Yielded value here SHOULD be correct as it will be reified from its props as it should not be found in the current DOM state
        expect(consoleProps.Yielded.tagName).to.equal('BUTTON')
        expect(consoleProps.Yielded.getAttribute('id')).to.equal('button')
      })
    })

    it('.alias()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button').as('buttonAlias')
      })

      cy.shouldWithTimeout(() => {
        const { alias, aliasType, consoleProps, $el, crossOriginLog } = findCrossOriginLogs('get', logs, 'foobar.com')

        // make sure $el is in fact a jquery instance to keep the logs happy
        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(alias).to.equal('buttonAlias')
        expect(aliasType).to.equal('dom')
        expect(consoleProps.Command).to.equal('get')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('#button')

        // The Yielded value here SHOULD be correct as it will be reified from its props as it should not be found in the current DOM state
        expect(consoleProps.Yielded.tagName).to.equal('BUTTON')
        expect(consoleProps.Yielded.getAttribute('id')).to.equal('button')
      })
    })

    it('.click()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button-inside-a').click()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { alias, aliasType, consoleProps, $el, crossOriginLog } = findCrossOriginLogs('click', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(alias).to.equal(undefined)
        expect(aliasType).to.equal(undefined)

        expect(consoleProps.Command).to.equal('click')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Selector).to.be.undefined
        expect(consoleProps.Yielded).to.be.undefined
        expect(consoleProps.Options).to.be.undefined

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        // TODO: test class list serialization
        // expect(consoleProps['Applied To']).to.have.property('classList').that.contains(['my-custom-button-css', 'class2', '@class3'])
        expect(consoleProps['Applied To'].getAttribute('id')).to.contain('button-inside-a')
        expect(consoleProps['Applied To'].innerHTML).to.contain('<span>click button</span>')

        expect(consoleProps.table[1]).to.be.a('function')

        const tableContents = consoleProps.table[1]()

        expect(tableContents.name).to.equal('Mouse Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(tableContents.data).to.be.a('object')

        tableContents.data.forEach((datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })
      })
    })

    it('.dblclick()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button').dblclick()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('dblclick', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('dblclick')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Selector).to.be.undefined
        expect(consoleProps.Yielded).to.be.undefined
        expect(consoleProps.Options).to.be.undefined

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps['Applied To'].getAttribute('id')).to.contain('button')
        expect(consoleProps['Applied To'].innerHTML).to.contain('button')

        expect(consoleProps.table[1]).to.be.a('function')

        const tableContents = consoleProps.table[1]()

        expect(tableContents.name).to.equal('Mouse Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(tableContents.data).to.be.a('object')

        tableContents.data.forEach((datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })
      })
    })

    it('.rightclick()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button').rightclick()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('rightclick', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('rightclick')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Selector).to.be.undefined
        expect(consoleProps.Yielded).to.be.undefined
        expect(consoleProps.Options).to.be.undefined

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps['Applied To'].getAttribute('id')).to.contain('button')
        expect(consoleProps['Applied To'].innerHTML).to.contain('button')

        expect(consoleProps.table[1]).to.be.a('function')

        const tableContents = consoleProps.table[1]()

        expect(tableContents.name).to.equal('Mouse Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(tableContents.data).to.be.a('object')

        tableContents.data.forEach((datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'contextmenu'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })
      })
    })

    it('.type()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('input#input').type('foo')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { alias, aliasType, consoleProps, $el, crossOriginLog } = findCrossOriginLogs('type', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(alias).to.equal(undefined)
        expect(aliasType).to.equal(undefined)

        expect(consoleProps.Command).to.equal('type')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Typed).to.equal('foo')
        expect(consoleProps.Options).to.be.undefined

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
        expect(consoleProps['Applied To'].innerHTML).to.equals('')
        expect(consoleProps['Applied To'].type).to.equal('text')

        expect(consoleProps.table[1]).to.be.a('function')
        expect(consoleProps.table[2]).to.be.a('function')

        const mouseEventsTable = consoleProps.table[1]()
        const KeyboardEventsTable = consoleProps.table[2]()

        expect(mouseEventsTable.name).to.equal('Mouse Events')
        expect(KeyboardEventsTable.name).to.equal('Keyboard Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(mouseEventsTable.data).to.be.a('object')
        expect(KeyboardEventsTable.data).to.be.a('object')

        _.forEach(mouseEventsTable.data, (datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })

        _.forEach(KeyboardEventsTable.data, (datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Events Fired').that.equals('keydown, keypress, beforeinput, textInput, input, keyup')
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })

        expect(KeyboardEventsTable.data[1]).to.have.property('Details').that.equals('{ code: KeyF, which: 70 }')
        expect(KeyboardEventsTable.data[1]).to.have.property('Typed').that.equals('f')

        expect(KeyboardEventsTable.data[2]).to.have.property('Details').that.equals('{ code: KeyO, which: 79 }')
        expect(KeyboardEventsTable.data[2]).to.have.property('Typed').that.equals('o')

        expect(KeyboardEventsTable.data[3]).to.have.property('Details').that.equals('{ code: KeyO, which: 79 }')
        expect(KeyboardEventsTable.data[3]).to.have.property('Typed').that.equals('o')
      })
    })

    it('.submit()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('form#multiple-inputs-and-input-submit input[name="fname"]').type('foo')
        cy.get('form#multiple-inputs-and-input-submit input[name="lname"]').type('bar')
        cy.get('form#multiple-inputs-and-input-submit').submit()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('submit', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('submit')
        expect(consoleProps.Elements).to.equal(1)

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('multiple-inputs-and-input-submit')
        expect(consoleProps['Applied To'].querySelector('input[name="fname"]')).to.be.ok
        expect(consoleProps['Applied To'].querySelector('input[name="lname"]')).to.be.ok
        expect(consoleProps['Applied To'].querySelector('input[type="submit"]')).to.be.ok

        // make sure input values are passed along into the serialized snapshot/element
        expect(consoleProps['Applied To'].querySelector('input[name="fname"]').value).to.equal('foo')
        expect(consoleProps['Applied To'].querySelector('input[name="lname"]').value).to.equal('bar')
        expect(consoleProps['Applied To'].querySelector('input[type="submit"]').value).to.equal('submit me')
      })
    })

    it('.focus()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#input').focus()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('focus', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('focus')
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
      })
    })

    it('.blur()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        // FIXME: snapshot shows the primary domain (before type). Should be secondary
        cy.get('#input').type('foo').blur()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('blur', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('blur')
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
      })
    })

    it('.clear()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        // FIXME: snapshot shows the primary domain. Should be secondary
        cy.get('#input').type('foo').clear()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('clear', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('clear')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Options).to.be.undefined
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
      })
    })

    it('.check()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get(':checkbox[name="colors"][value="blue"]').check()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('check', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('check')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Options).to.be.undefined

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')

        expect(consoleProps.table[1]).to.be.a('function')

        const tableContents = consoleProps.table[1]()

        expect(tableContents.name).to.equal('Mouse Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(tableContents.data).to.be.a('object')

        tableContents.data.forEach((datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'contextmenu'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })
      })
    })

    it('.uncheck()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get(':checkbox[name="colors"][value="blue"]')
        .check().uncheck()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('uncheck', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('uncheck')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Options).to.be.undefined

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')

        expect(consoleProps.table[1]).to.be.a('function')

        const tableContents = consoleProps.table[1]()

        expect(tableContents.name).to.equal('Mouse Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(tableContents.data).to.be.a('object')

        tableContents.data.forEach((datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'contextmenu'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })
      })
    })

    it('.select()', () => {
      cy.get('a[data-cy="dom-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        // TODO: wrong selected value is displayed in the snapshot after
        cy.get('select[name="foods"]').select('Japanese')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('select', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('select')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Coords).to.have.property('x').that.is.a('number')
        expect(consoleProps.Coords).to.have.property('y').that.is.a('number')

        expect(consoleProps.Options).to.be.undefined
        expect(consoleProps.Selected[0]).to.equal('Japanese')

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('SELECT')

        expect(consoleProps.table[1]).to.be.a('function')

        const tableContents = consoleProps.table[1]()

        expect(tableContents.name).to.equal('Mouse Events')
        // can't exactly assert that is an Array because it is a Proxy object to an array
        expect(tableContents.data).to.be.a('object')

        tableContents.data.forEach((datum) => {
          expect(datum).to.have.property('Active Modifiers').that.equals(null)
          expect(datum).to.have.property('Event Type').that.is.oneOf(['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'contextmenu'])
          expect(datum).to.have.property('Prevented Default').that.equals(null)
          expect(datum).to.have.property('Stopped Propagation').that.equals(null)
          expect(datum).to.have.property('Target Element').that.deep.equals(consoleProps['Applied To'])
        })
      })
    })

    it('.scrollIntoView()', () => {
      cy.get('a[data-cy="scrolling-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        // FIXME: snapshot of primary is showing for scrollIntoView
        cy.get('#scroll-into-view-vertical h5')
        .should('not.be.visible')
        .scrollIntoView()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('scrollIntoView', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('scrollIntoView')

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('H5')
        expect(consoleProps['Scrolled Element']).to.have.property('tagName').that.equals('H5')
      })
    })

    it('.scrollTo()', () => {
      cy.get('a[data-cy="scrolling-link"]').click()

      cy.origin('http://foobar.com:3500', () => {
        cy.get('#scroll-into-view-vertical h5').should('not.be.visible')
        cy.get('#scroll-into-view-vertical').scrollTo(0, 300)
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('scrollTo', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('scrollTo')
        expect(consoleProps.X).to.equal(0)
        expect(consoleProps.Y).to.equal(300)
        expect(consoleProps['Scrolled Element']).to.have.property('tagName').that.equals('DIV')
      })
    })

    it('.trigger()', () => {
      cy.get('a[data-cy="dom-link"]').click()

      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button').trigger('click')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('trigger', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('trigger')
        expect(consoleProps['Event options']).to.have.property('bubbles').that.is.a('boolean')
        expect(consoleProps['Event options']).to.have.property('cancelable').that.is.a('boolean')
        expect(consoleProps['Event options']).to.have.property('clientX').that.is.a('number')
        expect(consoleProps['Event options']).to.have.property('clientY').that.is.a('number')
        expect(consoleProps['Event options']).to.have.property('pageX').that.is.a('number')
        expect(consoleProps['Event options']).to.have.property('pageY').that.is.a('number')
        expect(consoleProps['Event options']).to.have.property('screenX').that.is.a('number')
        expect(consoleProps['Event options']).to.have.property('screenY').that.is.a('number')
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('BUTTON')
      })
    })

    it('.selectFile()', () => {
      cy.get('a[data-cy="files-form-link"]').click()

      cy.origin('http://foobar.com:3500', () => {
        cy.get('#basic').selectFile({ contents: Cypress.Buffer.from('foo'), fileName: 'foo.txt' })
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('selectFile', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('selectFile')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Target).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Target).to.have.property('id').that.equals('basic')
      })
    })
  })
})
