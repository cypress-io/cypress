describe('e2e performance', function () {
  const { _ } = Cypress

  const beginMeanTickLengthMeasurement = (onMeasurement?: (tickLengths: number[]) => void) => {
    const { setTimeout, clearTimeout, requestAnimationFrame, cancelAnimationFrame } = window.top

    let rafHandle
    let scheduleTimer
    let tickLengths: number[] = []

    const schedule = () => {
      rafHandle = requestAnimationFrame(() => {
        let lastTickTs = Date.now()

        rafHandle = requestAnimationFrame(() => {
          const currentTickTs = Date.now()

          tickLengths.push(currentTickTs - lastTickTs)
          lastTickTs = currentTickTs

          // sample once every 100ms, or else the mean will be biased towards faster frames
          scheduleTimer = setTimeout(schedule, 100)
          onMeasurement && onMeasurement(tickLengths)
        })
      })
    }

    schedule()

    const finish = () => {
      cancelAnimationFrame(rafHandle)
      clearTimeout(scheduleTimer)

      return tickLengths
    }

    return finish
  }

  context('tick length stays the same', () => {
    before((done) => {
      const finish = beginMeanTickLengthMeasurement((tickLengths) => {
        if (tickLengths.length === 10) {
          const tickLengths = finish()

          // around 60fps
          expect(_.mean(tickLengths)).to.be.closeTo(16.67, 5)
          done()
        }
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/6783
    it('average tick length does not increase when doing many XHRs', { defaultCommandTimeout: 1e8 }, (done) => {
      let finish

      cy.visit('/fixtures/generic.html')
      .then(() => {
        finish = beginMeanTickLengthMeasurement((tickLengths) => {
          if (tickLengths.length < 20) return

          try {
            // at least 15fps avg over the last 20 samples
            expect(_.mean(tickLengths.slice(-20))).to.be.below(67)
          } catch (err) {
            finish()
            done(err)
          }
        })
      })

      _.times(500, (i) => {
        cy.then(() => {
          // @ts-ignore
          const autWindow: Window = Cypress.state('$autIframe')[0].contentWindow

          return new Cypress.Promise((resolve) => {
            const xhr = new autWindow.XMLHttpRequest

            xhr.open('GET', `/timeout?i=${i}`)
            xhr.send()
            xhr.onloadend = () => {
              cy.get('body').click()
              resolve()
            }
          })
        })
      })

      cy.then(finish)
      .then(done)
    })
  })
})
