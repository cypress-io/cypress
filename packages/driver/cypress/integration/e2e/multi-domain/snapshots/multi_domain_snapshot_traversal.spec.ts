import _ from 'lodash'
import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('cross-origin snapshot traversal', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.children()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('children', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('by-id')
        expect(consoleProps.Command).to.equal('children')
        expect(consoleProps.Elements).to.equal(3)
        expect(consoleProps.Selector).to.equal('')
        expect(consoleProps.Yielded.length).to.equal(3)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('input')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[1]).to.have.property('id').that.equals('name')
        expect(consoleProps.Yielded[2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[2]).to.have.property('id').that.equals('age')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').children()
    })
  })

  it('.closest()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('closest', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('by-id')
        expect(consoleProps.Command).to.equal('closest')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('form')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('by-id')
        expect(consoleProps.Yielded.querySelector('input#input')).to.be.ok
        expect(consoleProps.Yielded.querySelector('input#name')).to.be.ok
        expect(consoleProps.Yielded.querySelector('input#age')).to.be.ok

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').closest('form')
    })
  })

  it('.eq()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('eq', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps['Applied To'].length).to.equal(3)
        expect(consoleProps['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('eq')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('1')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('name')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').eq(1)
    })
  })

  it('.filter()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('filter', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To'].length).to.equal(12)
        expect(consoleProps.Command).to.equal('filter')
        expect(consoleProps.Elements).to.equal(4)
        expect(consoleProps.Selector).to.equal('[name="dogs"]')

        expect(consoleProps.Yielded.length).to.equal(4)

        _.forEach(consoleProps.Yielded, (yielded) => {
          expect(yielded).to.have.property('tagName').that.equals('INPUT')
          expect(yielded).to.have.property('name').that.equals('dogs')
        })

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-name>input')
      .filter('[name="dogs"]')
    })
  })

  it('.find()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('find', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.Command).to.equal('find')
        expect(consoleProps.Elements).to.equal(3)
        expect(consoleProps.Selector).to.equal('input')

        expect(consoleProps.Yielded.length).to.equal(3)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('input')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[1]).to.have.property('id').that.equals('name')
        expect(consoleProps.Yielded[2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[2]).to.have.property('id').that.equals('age')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').find('input')
    })
  })

  it('.first()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('first', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To'].length).to.equal(3)
        expect(consoleProps['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('first')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('input')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').first()
    })
  })

  it('.last()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('last', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To'].length).to.equal(3)
        expect(consoleProps['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('last')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('age')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').last()
    })
  })

  it('.next()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('next', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.Command).to.equal('next')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('name')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').next()
    })
  })

  it('.nextAll()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('nextAll', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.Command).to.equal('nextAll')
        expect(consoleProps.Elements).to.equal(2)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded.length).to.equal(2)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('name')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[1]).to.have.property('id').that.equals('age')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').nextAll()
    })
  })

  it('.nextUntil()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('nextUntil', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.Command).to.equal('nextUntil')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('#age')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('name')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').nextUntil('#age')
    })
  })

  it('.not()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('not', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To'].length).to.equal(3)
        expect(consoleProps['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('not')
        expect(consoleProps.Elements).to.equal(2)
        expect(consoleProps.Selector).to.equal('#age')

        expect(consoleProps.Yielded.length).to.equal(2)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('input')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[1]).to.have.property('id').that.equals('name')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id>input').not('#age')
    })
  })

  it('.parent()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('parent', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.Command).to.equal('parent')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('dom')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').parent()
    })
  })

  it('.parents()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('parents', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.Command).to.equal('parents')
        expect(consoleProps.Elements).to.equal(3)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded.length).to.equal(3)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('dom')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('BODY')
        expect(consoleProps.Yielded[2]).to.have.property('tagName').that.equals('HTML')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').parents()
    })
  })

  it('.parentsUntil()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('parentsUntil', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.Command).to.equal('parentsUntil')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('body')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('dom')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').parentsUntil('body')
    })
  })

  it('.prev()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('prev', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('prev')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('name')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#age').prev()
    })
  })

  it('.prevAll()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('prevAll', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('prevAll')
        expect(consoleProps.Elements).to.equal(2)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded.length).to.equal(2)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('name')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[1]).to.have.property('id').that.equals('input')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#age').prevAll()
    })
  })

  it('.prevUntil()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('prevUntil', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('age')

        expect(consoleProps.Command).to.equal('prevUntil')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('#input')

        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('name')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#age').prevUntil('#input')
    })
  })

  it('.siblings()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('siblings', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.Command).to.equal('siblings')
        expect(consoleProps.Elements).to.equal(2)
        expect(consoleProps.Selector).to.equal('')

        expect(consoleProps.Yielded.length).to.equal(2)
        expect(consoleProps.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[0]).to.have.property('id').that.equals('name')
        expect(consoleProps.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Yielded[1]).to.have.property('id').that.equals('age')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input').siblings()
    })
  })
})
