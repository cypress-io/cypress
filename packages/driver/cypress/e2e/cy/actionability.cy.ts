// @ts-ignore
const { $, _ } = Cypress

describe('src/cy/actionability', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  describe('scrollBehavior', () => {
    // mirrors the alignment table in `src/cy/actionability.ts`. An axis missing
    // from the expectation is left out of the call so `scrollIntoView` applies
    // its own default.
    const alignments = {
      top: { block: 'start' },
      bottom: { block: 'end' },
      start: { block: 'start', inline: 'start' },
      end: { block: 'end', inline: 'end' },
      center: { block: 'center', inline: 'center' },
      nearest: { block: 'nearest', inline: 'nearest' },
    }

    describe('alignments', () => {
      _.each(alignments, (expected, alignment) => {
        it(`resolves '${alignment}' in options`, () => {
          cy.get('input:first').then((el) => {
            cy.spy(el[0], 'scrollIntoView')
          })

          cy.get('input:first').click({ scrollBehavior: alignment as any })

          cy.get('input:first').then((el) => {
            expect(el[0].scrollIntoView).calledWith(expected)
          })
        })

        it(`resolves '${alignment}' in config`, { scrollBehavior: alignment as any }, () => {
          cy.get('input:first').then((el) => {
            cy.spy(el[0], 'scrollIntoView')
          })

          cy.get('input:first').click()

          cy.get('input:first').then((el) => {
            expect(el[0].scrollIntoView).calledWith(expected)
          })
        })
      })
    })

    it('does not scroll when scrollBehavior is false in options', () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click({ scrollBehavior: false })

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).not.to.be.called
      })
    })

    it('does not scroll when scrollBehavior is false in config', { scrollBehavior: false }, () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click()

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).not.to.be.called
      })
    })

    it('calls scrollIntoView by default', () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click()

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).to.be.calledWith({ block: 'start' })
      })
    })

    it('can specify each scrollBehavior axis in options', () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click({ scrollBehavior: { block: 'end', inline: 'start' } })

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).calledWith({ block: 'end', inline: 'start' })
      })
    })

    it('can specify each scrollBehavior axis in config', { scrollBehavior: { block: 'center', inline: 'start' } }, () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click()

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).calledWith({ block: 'center', inline: 'start' })
      })
    })

    it('replaces the configured behavior rather than merging with it', { scrollBehavior: 'bottom' }, () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click({ scrollBehavior: { inline: 'start' } })

      // the configured block alignment is dropped, not inherited
      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).calledWith({ inline: 'start' })
      })
    })

    it('lets a single value in options replace both axes of a per-axis config', { scrollBehavior: { block: 'center' } }, () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click({ scrollBehavior: 'top' })

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).calledWith({ block: 'start' })
      })
    })

    it('omits axes missing from the config so the browser default applies', { scrollBehavior: { inline: 'start' } }, () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click()

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).calledWith({ inline: 'start' })
      })
    })

    it('omits axes when scrollBehavior is false in config and only inline is specified', { scrollBehavior: false }, () => {
      cy.get('input:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get('input:first').click({ scrollBehavior: { inline: 'start' } })

      cy.get('input:first').then((el) => {
        expect(el[0].scrollIntoView).calledWith({ inline: 'start' })
      })
    })

    // an omitted `block` relies on `scrollIntoView` defaulting it to `start`
    it('aligns the block axis to the top when only inline is specified', () => {
      cy.viewport(600, 400)

      const $body = cy.$$('body')

      $body.children().remove()

      $('<div></div>').css({ height: '800px' }).appendTo($body)

      const $target = $('<input id="below-fold" />').appendTo($body)

      $('<div></div>').css({ height: '800px' }).appendTo($body)

      cy.get('#below-fold').click({ scrollBehavior: { inline: 'nearest' } }).then(() => {
        expect($target[0].getBoundingClientRect().top, 'target top').to.be.closeTo(0, 5)
      })
    })

    it('can horizontally scroll an element away from a right-floating sticky element with inline: start', () => {
      cy.viewport(800, 400)

      const $body = cy.$$('body')

      $body.children().remove()

      const $container = $('<div></div>')
      .css({
        width: '512px',
        height: '128px',
        overflowX: 'scroll',
      })
      .appendTo($body)

      const $row = $('<div></div>')
      .css({
        width: '2048px',
        height: '128px',
        display: 'flex',
      })
      .appendTo($container)

      // spacer pushing the target to the right of the container's viewport
      $('<div></div>').css({ width: '512px', height: '128px' }).appendTo($row)

      const $target = $('<div></div>')
      .attr('id', 'target')
      .css({ width: '128px', height: '128px', background: 'green' })
      .appendTo($row)

      $('<div></div>').css({ width: '512px', height: '128px' }).appendTo($row)

      // a sticky element floating on the right edge of the scrollable container
      $('<div></div>')
      .attr('id', 'right-sticky')
      .css({
        position: 'sticky',
        right: '0',
        width: '256px',
        height: '128px',
        background: 'yellow',
      })
      .appendTo($row)

      const clicked = cy.stub()

      $target.on('click', clicked)

      // the default leaves the inline axis at `nearest`, which parks the target
      // under the right-sticky element where the click cannot reach it
      cy.get('#target').click({ scrollBehavior: 'start' }).then(() => {
        expect(clicked).to.be.calledOnce
      })
    })

    // the scrollport of a container, asserted against instead of pixel counts
    // since the offsets are subpixel-dependent across browsers
    const scrollPort = ($container) => {
      const el = $container[0]
      const { left, top } = el.getBoundingClientRect()

      return {
        left: left + el.clientLeft,
        right: left + el.clientLeft + el.clientWidth,
        top: top + el.clientTop,
        bottom: top + el.clientTop + el.clientHeight,
      }
    }

    describe('inline axis', () => {
      // a carousel-style container: it clips horizontally and positions its
      // slides itself, so a horizontal scroll leaves the layout broken
      const buildCarousel = () => {
        const $body = cy.$$('body')

        $body.children().remove()

        const $container = $('<div></div>')
        .attr('id', 'carousel')
        .css({ width: '400px', height: '128px', overflow: 'hidden' })
        .appendTo($body)

        const $row = $('<div></div>')
        .css({ width: '1600px', height: '128px', display: 'flex' })
        .appendTo($container)

        _.times(4, (i) => {
          const $slide = $('<div></div>')
          .css({ width: '400px', height: '128px', boxSizing: 'border-box', padding: '30px' })
          .appendTo($row)

          $(`<button id="slide-btn-${i}">slide ${i}</button>`).appendTo($slide)
        })

        return $container
      }

      it('leaves the container alone when the element is already horizontally visible', () => {
        const $container = buildCarousel()

        cy.get('#slide-btn-0').click().then(() => {
          expect($container[0].scrollLeft, 'container scrollLeft').to.eq(0)
        })
      })

      // the exact offset is subpixel-dependent across browsers, so only the
      // fact that the container moved matters here
      it('scrolls the container when the inline axis is aligned explicitly', () => {
        const $container = buildCarousel()

        cy.get('#slide-btn-0').click({ scrollBehavior: { inline: 'start' } }).then(() => {
          expect($container[0].scrollLeft, 'container scrollLeft').to.be.greaterThan(0)
        })
      })

      // a target off screen to the right of a scrollable container, so each inline
      // position lands it somewhere different
      const buildScroller = () => {
        const $body = cy.$$('body')

        $body.children().remove()

        const $container = $('<div></div>')
        .attr('id', 'scroller')
        .css({ width: '400px', height: '120px', overflowX: 'scroll' })
        .appendTo($body)

        const $row = $('<div></div>')
        .css({ width: '1600px', height: '90px', display: 'flex' })
        .appendTo($container)

        $('<div></div>').css({ width: '600px', flex: '0 0 600px' }).appendTo($row)

        const $target = $('<button id="scroller-target">target</button>')
        .css({ width: '100px', flex: '0 0 100px' })
        .appendTo($row)

        $('<div></div>').css({ width: '900px', flex: '0 0 900px' }).appendTo($row)

        return { $container, $target }
      }

      it('inline: \'start\' aligns the target\'s left edge to the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#scroller-target').click({ scrollBehavior: { inline: 'start' } }).then(() => {
          expect($target[0].getBoundingClientRect().left, 'target left').to.be.closeTo(scrollPort($container).left, 5)
        })
      })

      it('inline: \'end\' aligns the target\'s right edge to the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#scroller-target').click({ scrollBehavior: { inline: 'end' } }).then(() => {
          expect($target[0].getBoundingClientRect().right, 'target right').to.be.closeTo(scrollPort($container).right, 5)
        })
      })

      it('inline: \'center\' centers the target in the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#scroller-target').click({ scrollBehavior: { inline: 'center' } }).then(() => {
          const rect = $target[0].getBoundingClientRect()
          const { left, right } = scrollPort($container)

          expect((rect.left + rect.right) / 2, 'target center').to.be.closeTo((left + right) / 2, 5)
        })
      })

      it('inline: \'nearest\' scrolls an off-screen target the minimum amount', () => {
        const { $container, $target } = buildScroller()

        // the target is off screen to the right, so the minimum scroll brings its
        // right edge to the container's right edge
        cy.get('#scroller-target').click({ scrollBehavior: { inline: 'nearest' } }).then(() => {
          expect($target[0].getBoundingClientRect().right, 'target right').to.be.closeTo(scrollPort($container).right, 5)
        })
      })
    })

    describe('block axis', () => {
      // a target below the fold of a scrollable container, so each block position
      // lands it somewhere different
      const buildScroller = () => {
        const $body = cy.$$('body')

        $body.children().remove()

        const $container = $('<div></div>')
        .attr('id', 'v-scroller')
        .css({ width: '300px', height: '300px', overflowY: 'scroll' })
        .appendTo($body)

        $('<div></div>').css({ height: '600px' }).appendTo($container)

        const $target = $('<button id="v-scroller-target">target</button>')
        .css({ display: 'block', height: '40px' })
        .appendTo($container)

        $('<div></div>').css({ height: '900px' }).appendTo($container)

        return { $container, $target }
      }

      it('the default aligns the target\'s top edge to the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#v-scroller-target').click().then(() => {
          expect($target[0].getBoundingClientRect().top, 'target top').to.be.closeTo(scrollPort($container).top, 5)
        })
      })

      it('block: \'start\' aligns the target\'s top edge to the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#v-scroller-target').click({ scrollBehavior: { block: 'start' } }).then(() => {
          expect($target[0].getBoundingClientRect().top, 'target top').to.be.closeTo(scrollPort($container).top, 5)
        })
      })

      it('block: \'end\' aligns the target\'s bottom edge to the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#v-scroller-target').click({ scrollBehavior: { block: 'end' } }).then(() => {
          expect($target[0].getBoundingClientRect().bottom, 'target bottom').to.be.closeTo(scrollPort($container).bottom, 5)
        })
      })

      it('block: \'center\' centers the target in the container', () => {
        const { $container, $target } = buildScroller()

        cy.get('#v-scroller-target').click({ scrollBehavior: { block: 'center' } }).then(() => {
          const rect = $target[0].getBoundingClientRect()
          const { top, bottom } = scrollPort($container)

          expect((rect.top + rect.bottom) / 2, 'target center').to.be.closeTo((top + bottom) / 2, 5)
        })
      })

      it('block: \'nearest\' scrolls an off-screen target the minimum amount', () => {
        const { $container, $target } = buildScroller()

        // the target is below the fold, so the minimum scroll brings its bottom
        // edge to the container's bottom edge
        cy.get('#v-scroller-target').click({ scrollBehavior: { block: 'nearest' } }).then(() => {
          expect($target[0].getBoundingClientRect().bottom, 'target bottom').to.be.closeTo(scrollPort($container).bottom, 5)
        })
      })
    })

    describe('Cypress.config', () => {
      afterEach(() => {
        Cypress.config('scrollBehavior', 'top')
      })

      it('accepts a per-axis value at runtime', () => {
        Cypress.config('scrollBehavior', { block: 'center', inline: 'start' })

        expect(Cypress.config('scrollBehavior')).to.deep.eq({ block: 'center', inline: 'start' })

        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click()

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).calledWith({ block: 'center', inline: 'start' })
        })
      })

      // cast because the types already reject this; the assertion is that the
      // runtime validation rejects it too
      it('rejects a block alignment on an axis', () => {
        expect(() => Cypress.config('scrollBehavior', { block: 'top' } as any))
        .to.throw('Expected `scrollBehavior.block` to be one of these values: "center", "start", "end", "nearest" (use "start" instead of "top")')
      })
    })

    it('errors when scrollBehavior is false and element is out of view and is clicked', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.click()` failed because the center of this element is hidden from view')
        expect(cy.state('window').scrollY).to.equal(0)
        expect(cy.state('window').scrollX).to.equal(0)

        done()
      })

      // make sure the input is out of view
      const $body = cy.$$('body')

      $('<div>Long block 5</div>')
      .css({
        height: '500px',
        border: '1px solid red',
        marginTop: '10px',
        width: '100%',
      }).prependTo($body)

      cy.get('input:first').click({ scrollBehavior: false, timeout: 200 })
    })
  })
})
