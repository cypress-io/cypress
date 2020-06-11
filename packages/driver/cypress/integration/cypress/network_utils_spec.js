const $networkUtils = require('@packages/driver/src/cypress/network_utils')

describe('src/cypress/network_utils', () => {
  context('#fetch', () => {
    let xhr
    let win

    beforeEach(() => {
      xhr = {
        open: cy.stub(),
        send: cy.stub(),
      }

      win = {
        XMLHttpRequest: cy.stub().returns(xhr),
      }
    })

    it('fetches the resource via XHR', () => {
      $networkUtils.fetch('some/resource', win)
      expect(win.XMLHttpRequest).to.be.called
      expect(xhr.open).to.be.calledWith('GET', 'some/resource')
      expect(xhr.send).to.be.called
    })

    it('resolves the promise with the response text when it loads', () => {
      const getResource = $networkUtils.fetch('some/resource', win)

      expect(xhr.onload).to.be.a('function')
      xhr.onload.apply({ responseText: 'the response text' })

      return getResource.then((result) => {
        expect(result).to.equal('the response text')
      })
    })

    it('rejects the promise when it errors', () => {
      const getResource = $networkUtils.fetch('some/resource', win)

      expect(xhr.onerror).to.be.a('function')
      xhr.onerror.apply({ responseText: 'the response text' })

      return getResource.catch((err) => {
        expect(err.message).to.equal('Fetching resource at \'some/resource\' failed')
      })
    })
  })
})
