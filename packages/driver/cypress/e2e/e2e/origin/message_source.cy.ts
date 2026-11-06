describe('cross-origin messages from other frames', () => {
  const postFromFrame = (event: string, args: unknown[]) => {
    cy.visit('/fixtures/primary-origin.html')

    return cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        win.addEventListener('message', ({ data }) => {
          if (data?.type === 'other:response') {
            resolve(data.data)
          }

          if (data?.type === 'other:sent') {
            setTimeout(() => resolve('no response'), 1000)
          }
        })

        const iframe = win.document.createElement('iframe')
        const query = new URLSearchParams({ event, args: JSON.stringify(args) })

        iframe.src = `http://www.foobar.com:3500/fixtures/other/message.html?${query}`
        win.document.body.appendChild(iframe)
      })
    })
  }

  it('ignores automation:request', () => {
    postFromFrame('automation:request', ['is:automation:client:connected', {}])
    .should('equal', 'no response')
  })

  it('ignores backend:request', () => {
    postFromFrame('backend:request', ['get:rendered:html:origins'])
    .should('equal', 'no response')
  })

  describe('aut:set:cookie', () => {
    const cookie = { name: 'foo', value: 'bar', path: '/', expiry: null, maxAge: null, httpOnly: false, hostOnly: true, sameSite: 'lax', secure: false }
    let automation: sinon.SinonStub

    const postFromAut = (data: unknown, origin = 'http://www.foobar.com:3500') => {
      const top = window.top!
      const sent = new Cypress.Promise<void>((resolve) => {
        const onMessage = ({ data }) => {
          if (data?.type === 'other:sent') {
            top.removeEventListener('message', onMessage)
            resolve()
          }
        }

        top.addEventListener('message', onMessage)
      })
      const query = new URLSearchParams({ event: 'aut:set:cookie', data: JSON.stringify(data) })

      automation = cy.stub(Cypress, 'automation').log(false).callThrough()
      cy.visit(`${origin}/fixtures/other/message.html?${query}`)

      const returnOf = (event: string) => automation.getCalls().find((call) => call.args[0] === event)?.returnValue

      // the handler looks up existing cookies before it writes, so wait for both
      return cy.wrap(sent, { log: false })
      .then(() => returnOf('get:cookies'))
      .then(() => new Cypress.Promise((resolve) => setTimeout(resolve)))
      .then(() => returnOf('set:cookie'))
    }

    it('sets a cookie for the frame host', () => {
      postFromAut({ cookie: { ...cookie, domain: 'www.foobar.com' }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })

      cy.getCookie('foo', { domain: 'www.foobar.com' }).should('have.property', 'value', 'bar')
    })

    it('ignores a cookie whose url is another host', () => {
      postFromAut({ cookie: { ...cookie, domain: 'www.foobar.com' }, url: 'http://other.example.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('ignores a cookie whose domain is another host', () => {
      postFromAut({ cookie: { ...cookie, domain: 'other.example.com' }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('ignores an HttpOnly cookie', () => {
      postFromAut({ cookie: { ...cookie, domain: 'www.foobar.com', httpOnly: true }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('leaves an existing HttpOnly cookie unchanged', () => {
      cy.request('https://app.foobar.com:3503/set-cookie?cookie=foo=bar; Path=/; HttpOnly')

      postFromAut({ cookie: { ...cookie, value: 'baz', domain: 'app.foobar.com', secure: true }, url: 'https://app.foobar.com:3503/', sameSiteContext: 'strict' }, 'https://app.foobar.com:3503')

      cy.getCookie('foo', { domain: 'app.foobar.com' }).then((existing) => {
        expect(existing).to.include({ value: 'bar', httpOnly: true })
      })
    })

    it('ignores a host-only cookie for a parent domain', () => {
      postFromAut({ cookie: { ...cookie, domain: 'foobar.com', hostOnly: true }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('ignores a cookie for a public suffix', () => {
      postFromAut({ cookie: { ...cookie, domain: 'com', hostOnly: false }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('ignores a cookie for part of an IP address', () => {
      postFromAut({ cookie: { ...cookie, domain: '0.0.1', hostOnly: false }, url: 'http://127.0.0.1:3500/', sameSiteContext: 'strict' }, 'http://127.0.0.1:3500')
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('ignores a Secure cookie from an http page', () => {
      postFromAut({ cookie: { ...cookie, domain: 'www.foobar.com', secure: true }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })

    it('leaves an existing Secure cookie unchanged from an http page', () => {
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com', secure: true })

      postFromAut({ cookie: { ...cookie, value: 'baz', domain: 'www.foobar.com' }, url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })

      cy.getCookies({ domain: 'www.foobar.com' }).then((cookies) => {
        expect(cookies.map(({ name, value, secure }) => ({ name, value, secure }))).to.deep.equal([{ name: 'foo', value: 'bar', secure: true }])
      })
    })

    it('ignores a message without a cookie', () => {
      postFromAut({ url: 'http://www.foobar.com:3500/', sameSiteContext: 'strict' })
      .then(() => {
        expect(automation).not.to.be.calledWith('get:cookies')
        expect(automation).not.to.be.calledWith('set:cookie')
      })
    })
  })

  it('ignores messages to the spec bridge from other windows', { browser: '!webkit' }, () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('[data-cy="cross-origin-secondary-link"]').click()
    cy.origin('http://www.foobar.com:3500', () => {})

    cy.then(() => {
      const top = window.top!
      const bridge = top.document.querySelector<HTMLIFrameElement>('.spec-bridge-iframe')!.contentWindow!

      return new Cypress.Promise((resolve) => {
        const onMessage = ({ data }) => {
          if (data?.event === 'cross:origin:snapshot:final:generated') {
            top.removeEventListener('message', onMessage)
            resolve('responded')
          }
        }

        top.addEventListener('message', onMessage)
        bridge.postMessage({ event: 'generate:final:snapshot', data: 'http://www.foobar.com:3500/fixtures/secondary-origin.html' }, '*')
        setTimeout(() => {
          top.removeEventListener('message', onMessage)
          resolve('no response')
        }, 1000)
      })
    })
    .should('equal', 'no response')
  })
})
