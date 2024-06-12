describe('cy.origin test retries passes runnable', () => {
  context('withBeforeEach', () => {
    beforeEach(() => {
      cy.visit('/primary_origin.html')
      cy.get('a[data-cy="cross_origin_secondary_link"]').click()
    })

    it(`passes runnable state to the secondary origin first attempt`, { retries: 0 }, () => {
      const runnable = cy.state('runnable')
      const expectedRunnable = {
        clearTimeout: null,
        isPending: null,
        resetTimeout: null,
        timeout: null,
        id: runnable.id,
        _currentRetry: 0,
        _timeout: 4000,
        type: 'test',
        title: `passes runnable state to the secondary origin first attempt`,
        titlePath: [
          'cy.origin test retries passes runnable',
          'withBeforeEach',
            `passes runnable state to the secondary origin first attempt`,
        ],
        parent: {
          id: runnable.parent.id,
          type: 'suite',
          title: 'withBeforeEach',
          titlePath: [
            'withBeforeEach',
          ],
          parent: {
            id: runnable.parent.parent.id,
            type: 'suite',
            title: '',
            titlePath: undefined,
            ctx: {},
          },
          ctx: {},
        },
        ctx: {},
      }

      cy.origin('http://www.foobar.com:3500', { args: expectedRunnable }, (expectedRunnable) => {
        const actualRunnable = cy.state('runnable')

        expect(actualRunnable.titlePath()).to.deep.equal(expectedRunnable.titlePath)
        expectedRunnable.titlePath = actualRunnable.titlePath

        expect(actualRunnable.title).to.equal(expectedRunnable.title)
        expect(actualRunnable.id).to.equal(expectedRunnable.id)
        expect(actualRunnable.ctx).to.deep.equal(expectedRunnable.ctx)
        expect(actualRunnable._currentRetry).to.equal(expectedRunnable._currentRetry)
        expect(actualRunnable._timeout).to.equal(expectedRunnable._timeout)
        expect(actualRunnable.type).to.equal(expectedRunnable.type)
        expect(actualRunnable.callback).to.exist
        expect(actualRunnable.timeout).to.exist
        expect(actualRunnable.parent.title).to.equal(expectedRunnable.parent.title)
        expect(actualRunnable.parent.type).to.equal(expectedRunnable.parent.type)
      })
    })

    it(`passes runnable state to the secondary origin on retry`, { retries: 1 }, () => {
      const runnable = cy.state('runnable')
      const expectedRunnable = {
        clearTimeout: null,
        isPending: null,
        resetTimeout: null,
        timeout: null,
        id: runnable.id,
        _currentRetry: 0,
        _timeout: 4000,
        type: 'test',
        title: `passes runnable state to the secondary origin on retry`,
        titlePath: [
          'cy.origin test retries passes runnable',
          'withBeforeEach',
            `passes runnable state to the secondary origin on retry`,
        ],
        parent: {
          id: runnable.parent.id,
          type: 'suite',
          title: 'withBeforeEach',
          titlePath: [
            'withBeforeEach',
          ],
          parent: {
            id: runnable.parent.parent.id,
            type: 'suite',
            title: '',
            titlePath: undefined,
            ctx: {},
          },
          ctx: {},
        },
        ctx: {},
      }

      cy.origin('http://www.foobar.com:3500', { args: expectedRunnable }, (expectedRunnable) => {
        const actualRunnable = cy.state('runnable')

        expect(actualRunnable.titlePath()).to.deep.equal(expectedRunnable.titlePath)
        expectedRunnable.titlePath = actualRunnable.titlePath

        expect(actualRunnable.title).to.equal(expectedRunnable.title)
        expect(actualRunnable.id).to.equal(expectedRunnable.id)
        expect(actualRunnable.ctx).to.deep.equal(expectedRunnable.ctx)
        expect(actualRunnable._currentRetry).to.equal(expectedRunnable._currentRetry)
        expect(actualRunnable._timeout).to.equal(expectedRunnable._timeout)
        expect(actualRunnable.type).to.equal(expectedRunnable.type)
        expect(actualRunnable.callback).to.exist
        expect(actualRunnable.timeout).to.exist
        expect(actualRunnable.parent.title).to.equal(expectedRunnable.parent.title)
        expect(actualRunnable.parent.type).to.equal(expectedRunnable.parent.type)
      })
    })
  })
})
