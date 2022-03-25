require('../spec_helper')

import { RemoteStates } from '../../lib/remote_states'

describe('remote states', () => {
  context('#set', () => {
    beforeEach(function () {
      this.remoteStates = new RemoteStates(() => {
        return {
          serverPort: 9999,
          fileServerPort: 9998,
        }
      })
    })

    it('sets port to 443 when omitted and https:', function () {
      const ret = this.remoteStates.set('https://staging.google.com/foo/bar')

      expect(ret).to.deep.equal({
        auth: undefined,
        origin: 'https://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '443',
          domain: 'google',
          tld: 'com',
        },
      })
    })

    it('sets port to 80 when omitted and http:', function () {
      const ret = this.remoteStates.set('http://staging.google.com/foo/bar')

      expect(ret).to.deep.equal({
        auth: undefined,
        origin: 'http://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '80',
          domain: 'google',
          tld: 'com',
        },
      })
    })

    it('sets host + port to localhost', function () {
      const ret = this.remoteStates.set('http://localhost:4200/a/b?q=1#asdf')

      expect(ret).to.deep.equal({
        auth: undefined,
        origin: 'http://localhost:4200',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '4200',
          domain: '',
          tld: 'localhost',
        },
      })
    })

    it('sets local file', function () {
      const ret = this.remoteStates.set('/index.html')

      expect(ret).to.deep.equal({
        auth: undefined,
        origin: 'http://localhost:9999',
        strategy: 'file',
        domainName: 'localhost',
        fileServer: 'http://localhost:9998',
        props: null,
      })
    })

    it('sets <root>', function () {
      const ret = this.remoteStates.set('<root>')

      expect(ret).to.deep.equal({
        auth: undefined,
        origin: 'http://localhost:9999',
        strategy: 'file',
        domainName: 'localhost',
        fileServer: 'http://localhost:9998',
        props: null,
      })
    })
  })
})
