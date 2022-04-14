import { findCrossOriginLogs } from '../../../../support/utils'

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

  context('#consoleProps', () => {
    const { _ } = Cypress
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
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
})
