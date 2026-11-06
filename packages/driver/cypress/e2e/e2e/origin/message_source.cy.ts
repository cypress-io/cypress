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
    let backend: sinon.SinonStub

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

      backend = cy.stub(Cypress, 'backend').log(false).callThrough()
      cy.visit(`${origin}/fixtures/other/message.html?${query}`)

      return cy.wrap(sent, { log: false })
      .then(() => Promise.resolve(backend.getCalls().find((call) => call.args[0] === 'cross:origin:set:cookie')?.returnValue).catch(() => {}))
    }

    const expectNoCookie = () => {
      cy.getAllCookies().then((cookies) => {
        expect(cookies.filter(({ name }) => name === 'foo')).to.be.empty
      })
    }

    it('sets a cookie for the frame host', () => {
      postFromAut({ cookieString: 'foo=bar', url: 'http://www.foobar.com:3500/' })

      cy.getCookie('foo', { domain: 'www.foobar.com' }).should('have.property', 'value', 'bar')
    })

    it('ignores a cookie whose url is another origin', () => {
      postFromAut({ cookieString: 'foo=bar', url: 'http://other.example.com:3500/' })
      .then(() => {
        expect(backend).not.to.be.calledWith('cross:origin:set:cookie')
      })
    })

    it('ignores a message without a cookie string', () => {
      postFromAut({ cookie: { name: 'foo', value: 'bar', domain: 'www.foobar.com' }, url: 'http://www.foobar.com:3500/' })
      .then(() => {
        expect(backend).not.to.be.calledWith('cross:origin:set:cookie')
      })
    })

    it('ignores a cookie whose domain is another host', () => {
      postFromAut({ cookieString: 'foo=bar; Domain=other.example.com', url: 'http://www.foobar.com:3500/' })

      expectNoCookie()
    })

    it('ignores an HttpOnly cookie', () => {
      postFromAut({ cookieString: 'foo=bar; HttpOnly', url: 'http://www.foobar.com:3500/' })

      expectNoCookie()
    })

    it('leaves an existing HttpOnly cookie unchanged', () => {
      cy.request('https://app.foobar.com:3503/set-cookie?cookie=foo=bar; Path=/; HttpOnly')

      postFromAut({ cookieString: 'foo=baz; Secure', url: 'https://app.foobar.com:3503/' }, 'https://app.foobar.com:3503')

      cy.getCookie('foo', { domain: 'app.foobar.com' }).then((existing) => {
        expect(existing).to.include({ value: 'bar', httpOnly: true })
      })
    })

    it('ignores a cookie for a public suffix', () => {
      postFromAut({ cookieString: 'foo=bar; Domain=com', url: 'http://www.foobar.com:3500/' })

      expectNoCookie()
    })

    it('ignores a Secure cookie from an http page', () => {
      postFromAut({ cookieString: 'foo=bar; Secure', url: 'http://www.foobar.com:3500/' })

      expectNoCookie()
    })

    it('ignores a __Host- cookie for a parent domain', () => {
      postFromAut({ cookieString: '__Host-foo=bar; Secure; Domain=foobar.com', url: 'https://app.foobar.com:3503/' }, 'https://app.foobar.com:3503')

      cy.getAllCookies().then((cookies) => {
        expect(cookies.filter(({ name }) => name === '__Host-foo')).to.be.empty
      })
    })

    it('ignores a SameSite=None cookie that is not Secure', () => {
      postFromAut({ cookieString: 'foo=bar; SameSite=None', url: 'https://app.foobar.com:3503/' }, 'https://app.foobar.com:3503')

      expectNoCookie()
    })

    it('leaves an existing Secure cookie unchanged from an http page', () => {
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com', secure: true })

      postFromAut({ cookieString: 'foo=baz', url: 'http://www.foobar.com:3500/' })

      cy.getCookies({ domain: 'www.foobar.com' }).then((cookies) => {
        expect(cookies.map(({ name, value, secure }) => ({ name, value, secure }))).to.deep.equal([{ name: 'foo', value: 'bar', secure: true }])
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
