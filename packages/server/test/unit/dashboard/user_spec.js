require('../../spec_helper')

const api = require('../../../lib/dashboard/api')
const cache = require('../../../lib/cache')
const user = require('../../../lib/dashboard/user')

describe('lib/dashboard/user', () => {
  context('.get', () => {
    it('calls cache.getUser', () => {
      sinon.stub(cache, 'getUser').resolves({ name: 'brian' })

      return user.get().then((user) => {
        expect(user).to.deep.eq({ name: 'brian' })
      })
    })
  })

  context('.logOut', () => {
    it('calls api.postLogout + removes the session from cache', () => {
      sinon.stub(api, 'postLogout').withArgs('abc-123').resolves()
      sinon.stub(cache, 'getUser').resolves({ name: 'brian', authToken: 'abc-123' })
      sinon.spy(cache, 'removeUser')

      return user.logOut().then(() => {
        expect(cache.removeUser).to.be.calledOnce
      })
    })

    it('does not send to api.postLogout without a authToken', () => {
      sinon.spy(api, 'postLogout')
      sinon.stub(cache, 'getUser').resolves({ name: 'brian' })
      sinon.spy(cache, 'removeUser')

      return user.logOut().then(() => {
        expect(api.postLogout).not.to.be.called

        expect(cache.removeUser).to.be.calledOnce
      })
    })

    it('removes the session from cache even if api.postLogout rejects', () => {
      sinon.stub(api, 'postLogout').withArgs('abc-123').rejects(new Error('ECONNREFUSED'))
      sinon.stub(cache, 'getUser').resolves({ name: 'brian', authToken: 'abc-123' })
      sinon.spy(cache, 'removeUser')

      return user.logOut().catch(() => {
        expect(cache.removeUser).to.be.calledOnce
      })
    })
  })

  context('.syncProfile', () => {
    it('calls api.getMe then saves user to cache', () => {
      sinon.stub(api, 'getMe').resolves({
        name: 'foo',
        email: 'bar@baz',
      })

      sinon.stub(cache, 'setUser').resolves()

      return user.syncProfile('foo-123', 'bar-456')
      .then(() => {
        expect(api.getMe).to.be.calledWith('foo-123')

        expect(cache.setUser).to.be.calledWith({
          authToken: 'foo-123',
          name: 'foo',
          email: 'bar@baz',
        })
      })
    })
  })

  context('.getBaseLoginUrl', () => {
    it('calls api.getAuthUrls', () => {
      sinon.stub(api, 'getAuthUrls').resolves({
        'dashboardAuthUrl': 'https://github.com/login',
      })

      return user.getBaseLoginUrl().then((url) => {
        expect(url).to.eq('https://github.com/login')
      })
    })
  })
})
