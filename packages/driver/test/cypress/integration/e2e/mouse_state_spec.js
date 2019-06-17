/// <reference path="@/../../../../../../../cli/types/index.d.ts"/>
/* eslint-disable quotes */
const _ = Cypress._

const chaiSubset = require('chai-subset')

const mouseEvents = ['pointerout', 'pointerleave', 'pointerover', 'pointerenter', 'mouseout', 'mouseleave', 'mouseover', 'mouseenter', 'pointerdown', 'mousedown', 'focus', 'pointerup', 'mouseup', 'click']

// eslint-disable-next-line no-undef
chai.use(chaiSubset)

describe('mouse state', () => {

  describe('mouse/pointer events', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3500/fixtures/dom.html')
    })
    describe('resets mouse state', () => {

      it('set state', () => {
        cy.get('div.item:first').then(($el) => {
          const mouseenter = cy.stub().as('mouseenter')

          cy.get('body').then(($el) => {
            $el[0].addEventListener('mouseenter', mouseenter)
          }).then(() => {
            cy.internal.mouse.mouseMove($el[0].getBoundingClientRect())
            expect(mouseenter).to.be.calledOnce
            expect(cy.state('mouseCoords')).ok
          })
        })
      })

      it('reset state', () => {
        const mouseenter = cy.stub().callsFake(() => { }).as('mouseenter')

        cy.get('body').then(($el) => {
          $el[0].addEventListener('mouseenter', mouseenter)
        }).then(() => {
          expect(cy.state('mouseCoords')).to.eq(undefined)
          expect(mouseenter).to.not.be.called
        })
        // expect(this.mousemove).to.have.been.called
      })
    })

    describe('mouseout', () => {
      it('can move mouse from a div to another div', () => {
        const mouseout = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: true,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'mouseout',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('mouseout')
        const mouseleave = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: false,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'mouseleave',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('mouseleave')
        const pointerout = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: true,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'pointerout',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('pointerout')
        const pointerleave = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: false,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'pointerleave',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('pointerleave')
        const mouseover = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: true,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'mouseover',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('mouseover')
        const mouseenter = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: false,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'mouseenter',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('mouseenter')
        const pointerover = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: true,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'pointerover',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('pointerover')
        const pointerenter = cy.stub().callsFake((e) => {
          expect(_.toPlainObject(e)).to.containSubset({
            altKey: false,
            bubbles: false,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            clientX: 492,
            clientY: 9,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            layerX: 492,
            layerY: 215,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            pageX: 492,
            pageY: 215,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            screenX: 492,
            screenY: 9,
            shiftKey: false,
            sourceCapabilities: null,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'pointerenter',
            view: cy.state('window'),
            // which: 0,
            x: 492,
            y: 9,
          })
        }).as('pointerenter')

        cy.get('div.item').eq(0)
        .should(($el) => {
          $el[0].addEventListener('mouseout', mouseout)
          $el[0].addEventListener('mouseleave', mouseleave)
          $el[0].addEventListener('pointerout', pointerout)
          $el[0].addEventListener('pointerleave', pointerleave)
        })
        .click()
        .then(() => {
          expect(cy.state('mouseCoords')).ok
        })

        cy.get('div.item').eq(1).should(($el) => {
          $el[0].addEventListener('mouseover', mouseover)
          $el[0].addEventListener('mouseenter', mouseenter)
          $el[0].addEventListener('pointerover', pointerover)
          $el[0].addEventListener('pointerenter', pointerenter)
        })
        .click()
        Cypress.Promise.delay(5000)
        .then(() => {
          expect(mouseout).to.be.calledOnce
          expect(mouseleave).to.be.calledOnce
          expect(pointerout).to.be.calledOnce
          expect(pointerleave).to.be.calledOnce
          expect(mouseover).to.be.calledOnce
          expect(mouseover).to.be.calledOnce
          expect(mouseenter).to.be.calledOnce
          expect(pointerover).to.be.calledOnce
          expect(pointerenter).to.be.calledOnce
        })
      })
    })
  })

  describe('more mouse state', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3500/fixtures/issue-2956.html')
    })

    describe('mouseleave mouseenter animations', () => {
      it('sends mouseenter/mouseleave event', () => {
        cy.get('#outer').click()
        cy.get('#inner').should('be.visible')
        cy.get('body').click()
        cy.get('#inner').should('not.be.visible')
      })
      it('will respect changes to dom in event handlers', () => {

        mouseEvents.forEach((evt) => {
          cy.$$('#sq4').on(evt, cy.spy().as(`sq4:${evt}`))
          cy.$$('#outer').on(evt, cy.spy().as(`outer:${evt}`))
          cy.$$('input:first').on(evt, cy.spy().as(`input:${evt}`))
        })

        cy.get('#sq4').click()
        cy.get('#outer').click({ timeout: 200 })

        cy.getAll('@sq4:mouseover @sq4:mousedown @sq4:mouseup @sq4:click').each((spy) => {
          expect(spy).to.be.calledTwice
        })
        cy.getAll('@sq4:mouseout').each((spy) => {
          expect(spy).to.be.calledOnce
        })
        cy.getAll('@outer:mousedown @outer:mouseup @outer:click').each((spy) => {
          expect(spy).to.not.be.called
        })
        cy.getAll('@outer:mouseover @outer:mouseout').each((spy) => {
          expect(spy).to.be.calledOnce
        })

        cy.get('input:first').click().should('not.have.focus')

        cy.getAll('@input:mouseover @input:mouseout').each((spy) => {
          expect(spy).to.be.calledOnce
        })
        cy.getAll('@input:mousedown @input:mouseup @input:click').each((spy) => {
          expect(spy).to.not.be.called
        })

      })
      // it('will continue to send mouseleave events', function (done) {
      //   cy.once('fail', (err) => {
      //     expect(err.message).to.contain('is being covered')
      //     done()
      //   })

      //   cy.get('#sq4').click()
      //   cy.timeout(500)
      //   cy.get('#outer').click()
      //   cy.get('input:last').click()//.click({ timeout: 200 })
      // })
    })

    it('handles disabled attr', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).appendTo(cy.$$('body'))

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))
      })

      btn.on('pointerover', () => {
        btn.attr('disabled', true)
      })

      cy.get('#btn').click()

      cy.getAll('@pointerover @pointerenter @pointerdown @pointerup').each((stub) => {
        expect(stub).to.be.calledOnce
      })
      cy.getAll('@mouseover @mouseenter @mousedown @mouseup @click').each((stub) => {
        expect(stub).to.not.be.called
      })

    })

    it('handles disabled attr added on mousedown', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).appendTo(cy.$$('body'))

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))
      })

      btn.on('mousedown', () => {
        btn.attr('disabled', true)
      })

      cy.get('#btn').click()

      cy.getAll('@pointerdown @mousedown @pointerup').each((stub) => {
        expect(stub).to.be.calledOnce
      })
      cy.getAll('@mouseup @click').each((stub) => {
        expect(stub).to.not.be.calledOnce
      })
    })

    it('can click new element after mousemove sequence', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).css({ display: 'block' }).appendTo(cy.$$('body'))
      const cover = cy.$$(/*html*/`<div id='cover'/>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: '50px',
        width: '300px',
        top: '-30px',
      }).appendTo(btn.parent())

      cover.on('mousemove', () => {
        cover.hide()
      })

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))
        cover.on(eventName, cy.stub().as(`cover:${eventName}`))
      })

      cy.get('#cover').click()

      cy.getAll('@cover:pointerdown @cover:mousedown @cover:pointerup @cover:mouseup @cover:click').each((stub) => {
        expect(stub).to.not.be.called
      })

      // should we send mouseover to newly hovered els?
      // cy.getAll('@mouseover').each((stub) => {
      //   expect(stub).to.be.calledOnce
      // })

      cy.getAll('@pointerdown @mousedown @mouseup @pointerup @click').each((stub) => {
        expect(stub).to.be.calledOnce
      })

    })

    it('can click new element after mousemove sequence [disabled]', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).css({ display: 'block' }).appendTo(cy.$$('body'))
      const cover = cy.$$(/*html*/`<div id='cover'/>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: '50px',
        width: '300px',
        top: '-30px',
      }).appendTo(btn.parent())

      btn.attr('disabled', true)

      cover.on('mousemove', () => {
        cover.hide()
      })

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))
      })

      cy.get('#cover').click()

      cy.getAll('@mousedown @mouseup @click').each((stub) => {
        expect(stub).to.not.be.called
      })

      // on disabled inputs, pointer events are still fired
      cy.getAll('@pointerdown @pointerup').each((stub) => {
        expect(stub).to.be.called
      })

    })

    it('can target new element after mousedown sequence', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).css({ display: 'block' }).appendTo(cy.$$('body'))
      const cover = cy.$$(/*html*/`<div id='cover'/>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: '50px',
        width: '300px',
        top: '-30px',
      }).appendTo(btn.parent())

      cover.on('mousedown', () => {
        cover.hide()
      })

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))
      })

      btn.on('mouseup', () => {
        btn.attr('disabled', true)
      })

      cy.get('#cover').click()

      cy.getAll('@mouseup @pointerup').each((stub) => {
        expect(stub).to.be.calledOnce
      })

    })

    it('can target new element after mouseup sequence', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).css({ display: 'block' }).appendTo(cy.$$('body'))
      const cover = cy.$$(/*html*/`<div id='cover'/>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: '50px',
        width: '300px',
        top: '-30px',
      }).appendTo(btn.parent())

      cover.on('mouseup', () => {
        cover.hide()
      })

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))
        cover.on(eventName, cy.stub().as(`cover:${eventName}`))
      })

      btn.on('mouseup', () => {
        btn.attr('disabled', true)
      })

      cy.get('#cover').click()

      return cy.getAll('@cover:click').each((stub) => {
        expect(stub).to.not.be.called
      }).then(() => {
        return cy.getAll('@cover:pointerdown @cover:mousedown @cover:mouseup').each((stub) => {
          expect(stub).to.be.calledOnce
        })
      })

    })

    it('responds to changes in move handlers', () => {
      const btn = cy.$$(/*html*/`<input id='btn'>`).css({ display: 'block' }).appendTo(cy.$$('body'))
      const cover = cy.$$(/*html*/`<div id='cover'/>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: '50px',
        width: '300px',
        top: '-30px',
      }).appendTo(btn.parent())

      cover.on('mouseover', () => {
        cover.hide()
      })

      mouseEvents.forEach((eventName) => {
        btn.on(eventName, cy.stub().as(eventName))

        cover.on(eventName, cy.stub().as(`cover:${eventName}`))
      })

      cy.get('#cover').click()

      cy.getAll('@cover:mousedown').each((stub) => {
        expect(stub).to.not.be.called
      })
      cy.getAll('@pointerdown @mousedown @mouseup @pointerup @click').each((stub) => {
        expect(stub).to.be.calledOnce
      })
    })

  })

})

Cypress.Commands.add('getAll', (aliases) => {
  return Cypress.Promise.all(
    aliases.split(' ').map((alias) => {
      return cy.now('get', alias)
    })
  )
})
