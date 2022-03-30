import _ from 'lodash'
import { findCrossOriginLogs } from '../../../../support/utils'

describe('multi-domain snapshot actions', () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
  })

  it('.get()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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
        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('#button')
    })
  })

  it('.alias()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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
        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('#button').as('buttonAlias')
    })
  })

  it('.click()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('#button-inside-a').click()
    })
  })

  it('.dblclick()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('#button').dblclick()
    })
  })

  it('.rightclick()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('#button').rightclick()
    })
  })

  it('.type()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('input#input').type('foo')
    })
  })

  it('.submit()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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
        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('form#multiple-inputs-and-input-submit input[name="fname"]').type('foo')
      cy.get('form#multiple-inputs-and-input-submit input[name="lname"]').type('bar')
      cy.get('form#multiple-inputs-and-input-submit').submit()
    })
  })

  it('.focus()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('focus', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('focus')
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      // FIXME: snapshot shows the primary domain. Should be secondary
      cy.get('#input').focus()
    })
  })

  it('.blur()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('blur', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('blur')
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      // FIXME: snapshot shows the primary domain (before type). Should be secondary
      cy.get('#input').type('foo').blur()
    })
  })

  it('.clear()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('clear', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('clear')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Options).to.be.undefined
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'].getAttribute('id')).to.equal('input')
        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3250', () => {
      // FIXME: snapshot shows the primary domain. Should be secondary
      cy.get('#input').type('foo').clear()
    })
  })

  it('.check()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').check()
    })
  })

  it('.uncheck()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().uncheck()
    })
  })

  it('.select()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()
    cy.switchToDomain('http://foobar.com:3500', () => {
      // TODO: wrong selected value is displayed in the snapshot after
      cy.get('select[name="foods"]').select('Japanese')
    })
  })

  it('.scrollIntoView()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('scrollIntoView', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('scrollIntoView')

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('H5')
        expect(consoleProps['Scrolled Element']).to.have.property('tagName').that.equals('H5')

        done()
      }, 250)
    })

    cy.get('a[data-cy="scrolling-link"]').click()
    cy.switchToDomain('http://foobar.com:3500', () => {
      // FIXME: snapshot of primary is showing for scrollIntoView
      cy.get('#scroll-into-view-vertical h5')
      .should('not.be.visible')
      .scrollIntoView()
    })
  })

  it('.scrollTo()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('scrollTo', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('scrollTo')
        expect(consoleProps.X).to.equal(0)
        expect(consoleProps.Y).to.equal(300)
        expect(consoleProps['Scrolled Element']).to.have.property('tagName').that.equals('DIV')

        done()
      }, 250)
    })

    cy.get('a[data-cy="scrolling-link"]').click()

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#scroll-into-view-vertical h5').should('not.be.visible')
      cy.get('#scroll-into-view-vertical').scrollTo(0, 300)
    })
  })

  it('.trigger()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
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

        done()
      }, 250)
    })

    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#button').trigger('click')
    })
  })

  it('.selectFile()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('selectFile', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('selectFile')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Target).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Target).to.have.property('id').that.equals('basic')

        done()
      }, 250)
    })

    cy.get('a[data-cy="files-form-link"]').click()

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#basic').selectFile({ contents: Cypress.Buffer.from('foo'), fileName: 'foo.txt' })
    })
  })
})
