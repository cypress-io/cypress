describe('automations', function () {
  it('get cross origin localStorage', () => {
    cy.visit('http://localhost:4466/cross_origin_iframe')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    cy.getLocalStorage({ origin: ['https://127.0.0.2:44665', 'current_origin'] })
    .then((result) => {
      console.log(result)
      expect(result).deep.eq([{ origin: 'http://localhost:4466', value: { key1: 'val1' } }, { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } }])
    })
  })

  it('set cross origin localStorage', () => {
    cy.visit('http://localhost:4466/cross_origin_iframe')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    cy.setLocalStorage({ value: { key1: 'val1' } })
    .then(() => {
      expect(window.localStorage.key1).eq('val1')
    })

    cy.setLocalStorage([
      // set localStorage on different origin
      { origin: 'https://127.0.0.2:44665', value: { key2: 'val' }, clear: true },
      // set localStorage on current origin
      { value: { key3: 'val' }, clear: true },
    ])

    cy.getLocalStorage({ origin: ['current_url', 'https://127.0.0.2:44665'] })
    .then((result) => {
      expect(result).deep.eq([
        { origin: 'http://localhost:4466', value: { key3: 'val' } },
        { origin: 'https://127.0.0.2:44665', value: { key2: 'val' } },
      ])
    })
  })

  it('get localStorage from all origins', () => {
    cy.visit('http://localhost:4466/cross_origin_iframe')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    cy.getLocalStorage({ origin: '*' })
    .then((result) => {
      console.log(result)
      expect(result).deep.eq([{ origin: 'http://localhost:4466', value: { key1: 'val1' } }, { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } }])
    })
  })

  it('only gets localStorage from origins visited in test', () => {
    cy.visit('http://localhost:4466/form')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    cy.getLocalStorage({ origin: '*' })
    .then((result) => {
      console.log(result)
      expect(result).deep.eq([{ origin: 'http://localhost:4466', value: { key1: 'val1' } }])
    })
  })
})
