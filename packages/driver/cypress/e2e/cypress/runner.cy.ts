export {} // make typescript see this as a module

const { _ } = Cypress

const pending: Cypress.ObjectLike[] = []
const testAfterRunEvents: Cypress.ObjectLike[] = []

Cypress.on('test:after:run', (test) => {
  testAfterRunEvents.push(test)
  if (test.state === 'pending') {
    pending.push(test)
  }
})

describe('src/cypress/runner', () => {
  context('pending tests', () => {
    it('is not pending', () => {})

    it('is pending 1')

    it('is pending 2')

    it('has 2 pending tests', () => {
      expect(pending).to.have.length(2)

      expect(pending[0].title).to.eq('is pending 1')

      expect(pending[1].title).to.eq('is pending 2')
    })
  })
})

describe('async timeouts', () => {
  it('does not timeout during cypress command', (done) => {
    cy.timeout(100)
    cy.wait(200)
    cy.then(() => done())
  })
})

// https://github.com/cypress-io/cypress/issues/3253
describe('Command Log taller than the runner', () => {
  it('does not scroll or resize the top html element', () => {
    const html = window.top!.document.documentElement

    const beforeScrollY = window.top!.scrollY
    const beforeClientRect = html.getBoundingClientRect()
    const beforeRect = _.pick(beforeClientRect, _.keysIn(beforeClientRect))

    cy.viewport(300, 300)
    // this bug only happens when the command log
    // extends below the height of the html and aut
    _.times(100, (i) => {
      cy.wrap(i)
    })

    cy.wrap(null).then(() => {
      // try to scroll the page down a lot
      window.scroll(0, 10000)

      const afterScrollY = window.top!.scrollY
      const afterClientRect = html.getBoundingClientRect()
      const afterRect = _.pick(afterClientRect, _.keysIn(afterClientRect))

      // the html should not be scrollable
      // we only want the Command Log to scroll
      // so no scrolling should have happened
      expect(beforeScrollY).to.deep.eq(afterScrollY)

      // the width of the html should not have changed
      // meaning, the width of the scrollbar was not subtracted
      expect(beforeRect).to.deep.eq(afterRect)
    })
  })
})

describe('getAllTestsState', () => {
  it('serializes every test of the spec keyed by id, run or not', () => {
    const tests = Cypress.runner.getAllTestsState()
    const byTitle = _.keyBy(_.values(tests), 'title')

    _.each(tests, (test, id) => {
      expect(test.id, 'key is the test id').to.eq(id)
      expect(test.prevAttempts, 'prevAttempts is serialized').to.be.an('array')
    })

    expect(byTitle['is not pending']._titlePath).to.deep.eq(['src/cypress/runner', 'pending tests', 'is not pending'])
    expect(byTitle['is not pending'].state).to.eq('passed')
    expect(byTitle['is pending 1'].state).to.eq('pending')

    // Unlike getTestsState, the currently running test and tests that have
    // not run yet are included — with no state set.
    expect(byTitle['serializes every test of the spec keyed by id, run or not'].state).to.be.undefined
    expect(byTitle['test 2'].state).to.be.undefined
  })
})

describe('getSnapshotPropsForLog', () => {
  let attempts = 0

  it('is retried once', { retries: 1 }, () => {
    attempts++

    cy.wrap(attempts).then((attempt) => {
      if (attempt === 1) {
        throw new Error('failing the first attempt so the test is retried')
      }
    })
  })

  // A retried test keeps each attempt's logs on its own attempt, so a lookup
  // that searches the latest attempt alone answers "no such log" for every row
  // of an earlier one — leaving the reporter's prior-attempt rows and the tap's
  // --attempt with no snapshot to show for a command that has one.
  it('resolves a log of an earlier attempt', () => {
    const retried = _.find(_.values(Cypress.runner.getAllTestsState()), { title: 'is retried once' })

    expect(retried.prevAttempts, 'the test was retried').to.have.length(1)

    const earlier = _.find(retried.prevAttempts[0].commands, { name: 'wrap' })
    const latest = _.find(retried.commands, { name: 'wrap' })

    expect(Cypress.runner.getSnapshotPropsForLog(retried.id, latest.id), 'latest attempt').to.include({ id: latest.id, testId: retried.id })
    expect(Cypress.runner.getSnapshotPropsForLog(retried.id, earlier.id), 'earlier attempt').to.include({ id: earlier.id, testId: retried.id })
  })
})

// NOTE: this test must remain the last test in the spec
// so we can test the root after hook
// https://github.com/cypress-io/cypress/issues/2296
describe('fires test:after:run after root after hook', () => {
  it('test 1', () => {
  })

  it('test 2', () => {
  })
})

// https://github.com/cypress-io/cypress/issues/2296
after(() => {
  expect(_.last(testAfterRunEvents)?.title, 'test:after:run for test 2 should not have fired yet').eq('test 1')
})
