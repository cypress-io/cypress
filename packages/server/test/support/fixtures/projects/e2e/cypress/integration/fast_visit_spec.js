/* eslint-disable no-undef */
beforeEach(function () {
  cy.on('log:added', (attrs, log) => {
    if (attrs.name === 'visit') {
      this.lastLog = log
    }
  })

  return null
})

const fastVisitSpec = function (url) {
  cy.visit(url)

  const times = []

  Cypress._.times(100, () => {
    cy.visit(url)
    .then(function () {
      const time = this.lastLog.get('totalTime')

      times.push(time)
    })
  })

  cy.then(() => {
    times.sort((a, b) => {
      return a - b
    })

    const percentile = function (p) {
      const i = Math.floor((p / 100) * times.length) - 1

      return times[i]
    }

    const percentiles = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 97, 99, 100].map((p) => {
      return [p, percentile(p)]
    })

    cy.task('record:fast_visit_spec', {
      percentiles,
      url,
      browser: Cypress.config('browser').name,
      currentRetry: Cypress.env('currentRetry'),
    })
    .then(() => {
      expect(percentile(80)).to.be.lte(100)
      expect(percentile(95)).to.be.lte(250)
    })
  })
}

context('on localhost 95% of visits are faster than 250ms, 80% are faster than 100ms', () => {
  it('with connection: close', () => {
    fastVisitSpec('/close')
  })

  it('with connection: keep-alive', () => {
    fastVisitSpec('/keepalive')
  })
})
