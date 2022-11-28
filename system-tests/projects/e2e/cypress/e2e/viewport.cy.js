/* eslint-disable no-undef */
const logs = []

Cypress.on('log:added', (attrs, log) => {
  return logs.push(log)
})

describe('viewport', () => {
  beforeEach(() => {
    cy.wrap({})
  })

  it('changes viewport to iphone-6', () => {
    cy.viewport(400, 300).get('body').viewport(240, 250)
  })

  it('does not use viewport', () => {
    cy.get('body')
  })

  it('ensures viewport in logs', () => {
    // first test wrap
    const visit1 = logs[0]

    expect(visit1.get('name')).to.eq('wrap')
    expect(visit1.get('viewportWidth')).to.eq(800)
    expect(visit1.get('viewportHeight')).to.eq(600)

    // first test viewport
    const viewport1 = logs[1]

    expect(viewport1.get('name')).to.eq('viewport')
    expect(viewport1.get('viewportWidth')).to.eq(400)
    expect(viewport1.get('viewportHeight')).to.eq(300)

    // first test get
    const get1 = logs[2]

    expect(get1.get('name')).to.eq('get')
    expect(get1.get('viewportWidth')).to.eq(400)
    expect(get1.get('viewportHeight')).to.eq(300)

    // first test viewport 2
    const viewport2 = logs[3]

    expect(viewport2.get('name')).to.eq('viewport')
    expect(viewport2.get('viewportWidth')).to.eq(240)
    expect(viewport2.get('viewportHeight')).to.eq(250)

    // second test wrap
    // which should have reverted back to original
    // viewport settings
    const visit2 = logs[4]

    expect(visit2.get('name')).to.eq('wrap')
    expect(visit2.get('viewportWidth')).to.eq(800)
    expect(visit2.get('viewportHeight')).to.eq(600)

    // second test get
    const get2 = logs[5]

    expect(get2.get('name')).to.eq('get')
    expect(get2.get('viewportWidth')).to.eq(800)

    expect(get2.get('viewportHeight')).to.eq(600)
  })
})
