const top = window.parent

top.count = top.count || 0

describe('s1', {
  defaultCommandTimeout: 50,
}, () => {
  afterEach(function () {
    assert(true, `run ${top.count}`)
  })

  it('foo', () => {
    cy.once('test:after:run', () => {
      if (!top.count) {
        top.getEventManager().reporterBus.emit('runner:restart')
      }

      top.count++
    })
  })
})
