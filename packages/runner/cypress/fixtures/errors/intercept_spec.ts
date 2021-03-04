import { SinonStub } from "sinon"

describe('cy.intercept', () => {
    const { $, sinon } = Cypress

    it('fails in req callback', () => {
        cy.intercept('/json-content-type', () => {
            expect('a').to.eq('b')
        })
        .then(() => {
            console.log('hi2')
            Cypress.emit('net:event', 'before:request', {
                eventId: '1',
                // @ts-ignore
                routeHandlerId: Object.keys(Cypress.state('routes'))[0],
                subscription: {
                    await: true,
                },
                data: {}
            })
            const { $ } = Cypress
            $.get('/json-content-type')
        })
    })

  it('fails in res callback', () => {
    cy.intercept('/json-content-type', (req) => {
        req.reply(() => {
            expect('b').to.eq('c')
        })
    })
    .then(() => $.get('/json-content-type'))
  })

  it('fails when erroneous response is received while awaiting response', () => {
    cy.intercept('/fake', (req) => {
        req.reply(() => {
            expect('this should not be reached').to.eq('d')
        })
    })
    .then(() => $.get('http://foo.invalid/fake'))
  })
})