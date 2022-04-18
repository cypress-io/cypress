import { reifyDomElement, preprocessDomElement, preprocessLogLikeForSerialization, preprocessLogForSerialization, reifyLogFromSerialization } from '../../../src/util/serialization/log'

describe('Log Serialization', () => {
  const buildSnapshot = (innerSnapshotElement) => {
    const mockSnapshot = document.createElement('body')

    // populate some items into the mockSnapshot that would mimic what the DOM might actually look like, along with our inner snapshot element
    const mockContainer = document.createElement('div')
    const mockInnerHeader = document.createElement('h1')
    const mockTextNode = document.createTextNode('Super Serial-izer')

    mockInnerHeader.appendChild(mockTextNode)
    mockContainer.appendChild(mockInnerHeader)
    mockContainer.appendChild(innerSnapshotElement)

    mockSnapshot.appendChild(mockContainer)

    return mockSnapshot
  }

  it('preprocesses complex log-like data structures by preprocessing log DOM elements and table functions', () => {
    const mockSpan = document.createElement('span')

    mockSpan.innerHTML = 'click button'

    const mockButton = document.createElement('button')

    mockButton.appendChild(mockSpan)

    const mockClickedElement = document.createElement('form')

    mockClickedElement.appendChild(mockButton)
    mockClickedElement.id = 'button-inside-a'

    const mockSnapshot = buildSnapshot(mockClickedElement)

    const mockSnapshots = ['before', 'after'].map((snapshotName) => {
      return {
        name: snapshotName,
        htmlAttrs: {},
        body: {
          get: () => Cypress.$(mockSnapshot),
        },
      }
    })

    // mockLogAttrs should look just like log attributes that are emitted from log:changed/log:added events. This example is what a 'click' log may look like
    const mockLogAttrs = {
      $el: Cypress.$(mockClickedElement),
      alias: undefined,
      chainerId: 'foobar.com:3500-3',
      consoleProps: {
        ['Applied To']: mockClickedElement,
        Command: 'click',
        Coords: {
          x: 100,
          y: 50,
        },
        Options: undefined,
        Yielded: undefined,
        table: {
          1: () => {
            return {
              name: 'Mouse Events',
              // NOTE: click data length is truncated for test readability
              data: [
                {
                  'Active Modifiers': null,
                  'Event Type': 'pointerover',
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Target Element': mockClickedElement,
                },
                {
                  'Active Modifiers': null,
                  'Event Type': 'mouseover',
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Target Element': mockClickedElement,
                },
              ],
            }
          },
        },
      },
      coords: { top: 50, left: 50, topCenter: 100, leftCenter: 1000, x: 100, y: 50 },
      ended: true,
      err: undefined,
      event: false,
      highlightAttr: 'data-cypress-el',
      hookId: 'r4',
      id: 'log-http://foobar.com:3500-8',
      instrument: 'command',
      message: '',
      name: 'click',
      numElements: 1,
      referencesAlias: undefined,
      renderProps: {},
      snapshots: mockSnapshots,
      state: 'passed',
      testCurrentRetry: 0,
      testId: 'r4',
      timeout: 4000,
      type: 'child',
      url: 'http://www.foobar.com:3500/fixtures/dom.html',
      viewportHeight: 660,
      viewportWidth: 1000,
      visible: true,
      wallClockStartedAt: '2022-04-18T21:52:37.833Z',
    }

    const { consoleProps, snapshots, $el, ...logAttrs } = preprocessLogForSerialization(mockLogAttrs)

    expect(logAttrs).to.deep.equal({
      alias: undefined,
      chainerId: 'foobar.com:3500-3',
      coords: { top: 50, left: 50, topCenter: 100, leftCenter: 1000, x: 100, y: 50 },
      ended: true,
      err: undefined,
      event: false,
      highlightAttr: 'data-cypress-el',
      hookId: 'r4',
      id: 'log-http://foobar.com:3500-8',
      instrument: 'command',
      message: '',
      name: 'click',
      numElements: 1,
      referencesAlias: undefined,
      renderProps: {},
      state: 'passed',
      testCurrentRetry: 0,
      testId: 'r4',
      timeout: 4000,
      type: 'child',
      url: 'http://www.foobar.com:3500/fixtures/dom.html',
      viewportHeight: 660,
      viewportWidth: 1000,
      visible: true,
      wallClockStartedAt: '2022-04-18T21:52:37.833Z',
    })

    expect($el).to.deep.equal([
      {
        attributes: {
          id: 'button-inside-a',
        },
        innerHTML: '<button><span>click button</span></button>',
        serializationKey: 'dom',
        tagName: 'FORM',
      },
    ])

    expect(consoleProps).to.deep.equal({
      ['Applied To']: {
        attributes: {
          id: 'button-inside-a',
        },
        innerHTML: '<button><span>click button</span></button>',
        serializationKey: 'dom',
        tagName: 'FORM',
      },
      Command: 'click',
      Coords: {
        x: 100,
        y: 50,
      },
      Options: undefined,
      Yielded: undefined,
      table: {
        1: {
          serializationKey: 'function',
          value: {
            name: 'Mouse Events',
            data: [
              {
                'Active Modifiers': null,
                'Event Type': 'pointerover',
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Target Element': {
                  attributes: {
                    id: 'button-inside-a',
                  },
                  innerHTML: '<button><span>click button</span></button>',
                  serializationKey: 'dom',
                  tagName: 'FORM',
                },
              },
              {
                'Active Modifiers': null,
                'Event Type': 'mouseover',
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Target Element': {
                  attributes: {
                    id: 'button-inside-a',
                  },
                  innerHTML: '<button><span>click button</span></button>',
                  serializationKey: 'dom',
                  tagName: 'FORM',
                },
              },
            ],
          },
        },
      },
    })

    expect(snapshots).to.deep.equal([
      {
        name: 'before',
        htmlAttrs: {},
        styles: {},
        body: {
          get: {
            serializationKey: 'function',
            value: [{
              attributes: {},
              innerHTML: `<div><h1>Super Serial-izer</h1><form id="button-inside-a"><button><span>click button</span></button></form></div>`,
              serializationKey: 'dom',
              tagName: 'BODY',
            }],
          },
        },
      },
      {
        name: 'after',
        htmlAttrs: {},
        styles: {},
        body: {
          get: {
            serializationKey: 'function',
            value: [{
              attributes: {},
              innerHTML: `<div><h1>Super Serial-izer</h1><form id="button-inside-a"><button><span>click button</span></button></form></div>`,
              serializationKey: 'dom',
              tagName: 'BODY',
            }],
          },
        },
      },
    ])
  })

  it('reifies complex log-like data structures by reifying serialized DOM elements and table functions back into native data types, respectively', () => {
    // this should log identical to the test output above from what a preprocessed click log looks like after postMessage()
    const mockPreprocessedLogAttrs = {
      $el: [
        {
          attributes: {
            id: 'button-inside-a',
          },
          innerHTML: '<button><span>click button</span></button>',
          serializationKey: 'dom',
          tagName: 'FORM',
        },
      ],
      alias: undefined,
      chainerId: 'foobar.com:3500-3',
      consoleProps: {
        ['Applied To']: {
          attributes: {
            id: 'button-inside-a',
          },
          innerHTML: '<button><span>click button</span></button>',
          serializationKey: 'dom',
          tagName: 'FORM',
        },
        Command: 'click',
        Coords: {
          x: 100,
          y: 50,
        },
        Options: undefined,
        Yielded: undefined,
        table: {
          1: {
            serializationKey: 'function',
            value: {
              name: 'Mouse Events',
              // NOTE: click data length is truncated for test readability
              data: [
                {
                  'Active Modifiers': null,
                  'Event Type': 'pointerover',
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Target Element': {
                    attributes: {
                      id: 'button-inside-a',
                    },
                    innerHTML: '<button><span>click button</span></button>',
                    serializationKey: 'dom',
                    tagName: 'FORM',
                  },
                },
                {
                  'Active Modifiers': null,
                  'Event Type': 'mouseover',
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Target Element': {
                    attributes: {
                      id: 'button-inside-a',
                    },
                    innerHTML: '<button><span>click button</span></button>',
                    serializationKey: 'dom',
                    tagName: 'FORM',
                  },
                },
              ],
            },
          },
        },
      },
      coords: { top: 50, left: 50, topCenter: 100, leftCenter: 1000, x: 100, y: 50 },
      ended: true,
      err: undefined,
      event: false,
      highlightAttr: 'data-cypress-el',
      hookId: 'r4',
      id: 'log-http://foobar.com:3500-8',
      instrument: 'command',
      message: '',
      name: 'click',
      numElements: 1,
      referencesAlias: undefined,
      renderProps: {},
      snapshots: [
        {
          name: 'before',
          htmlAttrs: {},
          styles: {},
          body: {
            get: {
              serializationKey: 'function',
              value: [{
                attributes: {},
                innerHTML: `<div><h1>Super Serial-izer</h1><form id="button-inside-a"><button><span>click button</span></button></form></div>`,
                serializationKey: 'dom',
                tagName: 'BODY',
              }],
            },
          },
        },
        {
          name: 'after',
          htmlAttrs: {},
          styles: {},
          body: {
            get: {
              serializationKey: 'function',
              value: [{
                attributes: {},
                innerHTML: `<div><h1>Super Serial-izer</h1><form id="button-inside-a"><button><span>click button</span></button></form></div>`,
                serializationKey: 'dom',
                tagName: 'BODY',
              }],
            },
          },
        },
      ],
      state: 'passed',
      testCurrentRetry: 0,
      testId: 'r4',
      timeout: 4000,
      type: 'child',
      url: 'http://www.foobar.com:3500/fixtures/dom.html',
      viewportHeight: 660,
      viewportWidth: 1000,
      visible: true,
      wallClockStartedAt: '2022-04-18T21:52:37.833Z',
    }

    const { consoleProps, snapshots, $el, crossOriginLog, ...logAttrs } = reifyLogFromSerialization(mockPreprocessedLogAttrs)

    expect(logAttrs).to.deep.equal({
      alias: undefined,
      chainerId: 'foobar.com:3500-3',
      coords: { top: 50, left: 50, topCenter: 100, leftCenter: 1000, x: 100, y: 50 },
      ended: true,
      err: undefined,
      event: false,
      highlightAttr: 'data-cypress-el',
      hookId: 'r4',
      id: 'log-http://foobar.com:3500-8',
      instrument: 'command',
      message: '',
      name: 'click',
      numElements: 1,
      referencesAlias: undefined,
      renderProps: {},
      state: 'passed',
      testCurrentRetry: 0,
      testId: 'r4',
      timeout: 4000,
      type: 'child',
      url: 'http://www.foobar.com:3500/fixtures/dom.html',
      viewportHeight: 660,
      viewportWidth: 1000,
      visible: true,
      wallClockStartedAt: '2022-04-18T21:52:37.833Z',
    })

    expect(crossOriginLog).to.be.true

    expect($el.jquery).to.be.ok
    expect($el.length).to.equal(1)
    expect($el[0]).to.be.instanceOf(HTMLFormElement)
    expect($el[0].id).to.equal('button-inside-a')
    expect($el[0].textContent).to.equal('click button')

    // most of the consoleProps logic is tested in the e2e/multi-domain folder. focus in this test will be mostly snapshot serialization
    expect(consoleProps['Applied To']).to.be.instanceOf(HTMLFormElement)
    expect(consoleProps['Applied To']).to.have.property('id').that.equals('button-inside-a')
    expect(consoleProps['Applied To']).to.have.property('textContent').that.equals('click button')

    expect(consoleProps.table).to.have.property('1')
    expect(consoleProps.table[1]).to.be.a('function')

    expect(snapshots).to.have.lengthOf(2)

    expect(snapshots[0]).to.have.property('name').that.equals('before')
    expect(snapshots[0]).to.have.property('htmlAttrs').that.deep.equals({})
    // styles should now live in the CSS map after a snapshot is processed through createSnapshot and snapshots should exist in document map
    expect(snapshots[0]).to.not.have.property('styles')
    expect(snapshots[0]).to.have.property('body').that.has.property('get').that.is.a('function')

    const snapshotBodyBefore = snapshots[0].body.get()

    expect(snapshotBodyBefore.length).to.equal(1)

    expect(snapshotBodyBefore[0]).to.be.instanceOf(HTMLBodyElement)
    // verify to some degree that the reified elements above can be matched into the snapshot
    expect(snapshotBodyBefore[0].querySelector('form#button-inside-a')).to.be.instanceOf(HTMLFormElement)

    expect(snapshots[1]).to.have.property('name').that.equals('after')
    expect(snapshots[1]).to.have.property('htmlAttrs').that.deep.equals({})
    expect(snapshots[1]).to.not.have.property('styles')
    expect(snapshots[1]).to.have.property('body').that.has.property('get').that.is.a('function')

    const snapshotBodyAfter = snapshots[1].body.get()

    expect(snapshotBodyAfter.length).to.equal(1)

    expect(snapshotBodyAfter[0]).to.be.instanceOf(HTMLBodyElement)
    // verify to some degree that the reified elements above can be matched into the snapshot
    expect(snapshotBodyAfter[0].querySelector('form#button-inside-a')).to.be.instanceOf(HTMLFormElement)
  })

  // purpose of these 'DOM Elements' tests is to give a very basic understanding of how DOM element serialization works in the log serializer
  context('DOM Elements- preprocesses/reifies a given DOM element with stateful', () => {
    context('input', () => {
      it('preprocess', () => {
        const inputElement = document.createElement('input')

        inputElement.type = 'text'
        inputElement.value = 'foo'
        inputElement.setAttribute('data-cy', 'bar')

        const snapshot = buildSnapshot(inputElement)

        snapshot.setAttribute('foo', 'bar')

        const preprocessedSnapshot = preprocessDomElement(snapshot)

        expect(preprocessedSnapshot).to.have.property('tagName').that.equals('BODY')
        expect(preprocessedSnapshot).to.have.property('serializationKey').that.equals('dom')
        expect(preprocessedSnapshot).to.have.property('attributes').that.deep.equals({
          foo: 'bar',
        })

        expect(preprocessedSnapshot).to.have.property('innerHTML').that.equals(`<div><h1>Super Serial-izer</h1><input type="text" data-cy="bar" value="foo"></div>`)
      })

      it('reifies', () => {
        const preprocessedSnapshot = {
          tagName: 'BODY',
          serializationKey: 'dom',
          attributes: {
            foo: 'bar',
          },
          innerHTML: `<div><h1>Super Serial-izer</h1><input type="text" data-cy="bar" value="foo"></div>`,
        }

        const reifiedSnapshot = reifyDomElement(preprocessedSnapshot)

        expect(reifiedSnapshot).to.be.instanceOf(HTMLBodyElement)
        expect(reifiedSnapshot.getAttribute('foo')).to.equal('bar')
        expect(reifiedSnapshot.querySelector('input[type="text"][value="foo"][data-cy="bar"]')).to.be.instanceOf(HTMLInputElement)
      })
    })

    context('select', () => {
      it('preprocess', () => {
        const selectElement = document.createElement('select')

        selectElement.id = 'strickland-propane'
        selectElement.name = 'Strickland Propane Staff Members'

        const options = ['Hank Hill', 'Buck Strickland', 'Donna', 'Old Donna'].map((val) => {
          const option = document.createElement('option')

          option.value = val

          return option
        })

        options.forEach((option) => selectElement.appendChild(option))

        selectElement.selectedIndex = 1

        const snapshot = buildSnapshot(selectElement)

        const preprocessedSnapshot = preprocessDomElement(snapshot)

        expect(preprocessedSnapshot).to.have.property('tagName').that.equals('BODY')
        expect(preprocessedSnapshot).to.have.property('serializationKey').that.equals('dom')
        expect(preprocessedSnapshot).to.have.property('innerHTML').that.equals(`<div><h1>Super Serial-izer</h1><select id="strickland-propane" name="Strickland Propane Staff Members"><option value="Hank Hill"></option><option value="Buck Strickland" selected="true"></option><option value="Donna"></option><option value="Old Donna"></option></select></div>`)
      })

      it('reifies', () => {
        const preprocessedSnapshot = {
          tagName: 'BODY',
          serializationKey: 'dom',
          attributes: {},
          innerHTML: `<div><h1>Super Serial-izer</h1><select id="strickland-propane" name="Strickland Propane Staff Members"><option value="Hank Hill"></option><option value="Buck Strickland" selected="true"></option><option value="Donna"></option><option value="Old Donna"></option></select></div>`,
        }

        const reifiedSnapshot = reifyDomElement(preprocessedSnapshot)

        expect(reifiedSnapshot).to.be.instanceOf(HTMLBodyElement)
        expect(reifiedSnapshot.querySelector('select#strickland-propane option[selected]')).to.have.property('value').that.equals('Buck Strickland')
      })
    })

    context('textarea', () => {
      it('preprocess', () => {
        const textAreaElement = document.createElement('textarea')

        textAreaElement.rows = 4
        textAreaElement.cols = 20
        textAreaElement.value = 'Provide the community with propane and propane accessories'

        const snapshot = buildSnapshot(textAreaElement)

        const preprocessedSnapshot = preprocessDomElement(snapshot)

        expect(preprocessedSnapshot).to.have.property('tagName').that.equals('BODY')
        expect(preprocessedSnapshot).to.have.property('serializationKey').that.equals('dom')
        expect(preprocessedSnapshot).to.have.property('innerHTML').that.equals(`<div><h1>Super Serial-izer</h1><textarea rows="4" cols="20">Provide the community with propane and propane accessories</textarea></div>`)
      })

      it('reifies', () => {
        const preprocessedSnapshot = {
          tagName: 'BODY',
          serializationKey: 'dom',
          attributes: {},
          innerHTML: `<div><h1>Super Serial-izer</h1><textarea rows="4" cols="20">Provide the community with propane and propane accessories</textarea></div>`,
        }

        const reifiedSnapshot = reifyDomElement(preprocessedSnapshot)

        expect(reifiedSnapshot).to.be.instanceOf(HTMLBodyElement)
        expect(reifiedSnapshot.querySelector('textarea[rows="4"]')).to.have.property('textContent').that.equals('Provide the community with propane and propane accessories')
      })
    })

    context('radio', () => {
      it('preprocess', () => {
        const formElement = document.createElement('form')

        const radioInputs = ['Dale', 'Boomhauer', 'Bill'].map((val) => {
          const radioInput = document.createElement('input')

          radioInput.type = 'radio'
          radioInput.value = val

          return radioInput
        })

        radioInputs[1].checked = true

        radioInputs.forEach((radioInput) => formElement.appendChild(radioInput))

        const snapshot = buildSnapshot(formElement)

        const preprocessedSnapshot = preprocessDomElement(snapshot)

        expect(preprocessedSnapshot).to.have.property('tagName').that.equals('BODY')
        expect(preprocessedSnapshot).to.have.property('serializationKey').that.equals('dom')
        expect(preprocessedSnapshot).to.have.property('innerHTML').that.equals(`<div><h1>Super Serial-izer</h1><form><input type="radio" value="Dale"><input type="radio" value="Boomhauer" checked=""><input type="radio" value="Bill"></form></div>`)
      })

      it('reifies', () => {
        const preprocessedSnapshot = {
          tagName: 'BODY',
          serializationKey: 'dom',
          attributes: {},
          innerHTML: `<div><h1>Super Serial-izer</h1><form><input type="radio" value="Dale"><input type="radio" value="Boomhauer" checked=""><input type="radio" value="Bill"></form></div>`,
        }

        const reifiedSnapshot = reifyDomElement(preprocessedSnapshot)

        expect(reifiedSnapshot).to.be.instanceOf(HTMLBodyElement)
        expect(reifiedSnapshot.querySelector('form input[value="Boomhauer"]')).to.have.property('checked').that.equals(true)
      })
    })

    context('checkbox', () => {
      it('preprocess', () => {
        const formElement = document.createElement('form')

        const checkboxInputs = ['Dale', 'Boomhauer', 'Bill'].map((val) => {
          const checkboxInput = document.createElement('input')

          checkboxInput.type = 'checkbox'
          checkboxInput.value = val

          return checkboxInput
        })

        checkboxInputs[1].checked = true

        checkboxInputs.forEach((checkboxInput) => formElement.appendChild(checkboxInput))

        const snapshot = buildSnapshot(formElement)

        const preprocessedSnapshot = preprocessDomElement(snapshot)

        expect(preprocessedSnapshot).to.have.property('tagName').that.equals('BODY')
        expect(preprocessedSnapshot).to.have.property('serializationKey').that.equals('dom')
        expect(preprocessedSnapshot).to.have.property('innerHTML').that.equals(`<div><h1>Super Serial-izer</h1><form><input type="checkbox" value="Dale"><input type="checkbox" value="Boomhauer" checked=""><input type="checkbox" value="Bill"></form></div>`)
      })

      it('reifies', () => {
        const preprocessedSnapshot = {
          tagName: 'BODY',
          serializationKey: 'dom',
          attributes: {},
          innerHTML: `"<div><h1>Super Serial-izer</h1><form><input type="checkbox" value="Dale"><input type="checkbox" value="Boomhauer" checked=""><input type="checkbox" value="Bill"></form></div>"`,
        }

        const reifiedSnapshot = reifyDomElement(preprocessedSnapshot)

        expect(reifiedSnapshot).to.be.instanceOf(HTMLBodyElement)
        expect(reifiedSnapshot.querySelector('form input[value="Boomhauer"]')).to.have.property('checked').that.equals(true)
      })
    })
  })

  // purpose of these 'DOM Elements' tests is to give a very basic understanding of how DOM element serialization works in the log serializer
  context('Functions', () => {
    it('does NOT try to serialize a function unless `attemptToSerializeFunctions` is set to true', () => {
      const serializedFunction = preprocessLogLikeForSerialization(() => 'foo')

      expect(serializedFunction).to.be.null
    })

    it('Tries to serialize EXPLICIT/KNOWN serializable functions by setting `attemptToSerializeFunctions` to true', () => {
      const functionContents = [
        'foo',
        {
          bar: 'baz',
        },
        document.createElement('html'),
      ]

      const myKnownSerializableFunction = () => functionContents

      const serializedFunction = preprocessLogLikeForSerialization(myKnownSerializableFunction, true)

      expect(serializedFunction).to.deep.equal({
        serializationKey: 'function',
        value: [
          'foo',
          {
            bar: 'baz',
          },
          {
            tagName: 'HTML',
            serializationKey: 'dom',
            attributes: {},
            innerHTML: '',
          },
        ],
      })
    })
  })
})
