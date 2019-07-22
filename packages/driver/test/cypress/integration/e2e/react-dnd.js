/// <reference path="../../../../../../cli/types/index.d.ts" />
const { _ } = Cypress

describe('react-drag-and-drop', () => {
  it('can dnd', () => {
    cy.visit('http://react-dnd.github.io/react-dnd/examples/dustbin/single-target')

    const onAlert = cy.stub()

    cy.on('window:alert', onAlert)
    cy.window().then((win) => {
      win.addEventListener('selectend', () => {
        debugger
      })

      mouseevents.forEach((evtName) => {
        win.document.addEventListener(evtName, () => console.log(evtName))
      })
    })

    cy.contains('Using Hooks').click()
    // cy.contains('Using Decorators').click()

    let toOpts

    cy.contains('div', 'Drag a box here').then(($el) => {
      const rect = $el[0].getBoundingClientRect()

      toOpts = { clientX: rect.left, clientY: rect.top, log: true }

    }).then(() => {

      cy.contains('div', 'Paper')
      .trigger('mouseover')
      .trigger('mousedown')
      .trigger('dragstart')
      .trigger('selectstart')
      .trigger('mousemove', toOpts)
      .trigger('drag', toOpts)
      .trigger('dragover', toOpts)
      .trigger('mouseup', toOpts)
      .trigger('dragend')
      .trigger('selectend')
      .trigger('dragEnd', toOpts)
      .trigger('drop', toOpts)
    })

    cy.then(() => {

      expect(onAlert).calledOnce
    })

    // cy.wait(1000)
    // cy.window().then((win) => {
    //   // win.addEventListener('mousemove', () => {
    //   //   debugger
    //   // })
    //   mouseevents.forEach((evtName) => {
    //     win.addEventListener(evtName, () => console.log(evtName))
    //   })
    // })

    // cy.contains('div', 'Drag a box here').then(($toEl) => {

    //   cy.contains('div', 'Paper').dragTo($toEl)
    // })

  })

})

const mouseevents = ['dragstart', 'dragend', 'selectstart', 'selectend', 'pointerdown', 'pointerover', 'pointerdown', 'pointerup', 'mousedown', 'mouseover', 'mouseup']

  // const getCoords = ($el) => {
  //   const domRect = $el[0].getBoundingClientRect()
  //   const coords = { x: domRect.left + (domRect.width / 2 || 0), y: domRect.top + (domRect.height / 2 || 0) }

  //   return coords
  // }

  // const dragTo = (subject, to, opts) => {

  //   opts = Cypress._.defaults(opts, {
  //     // delay inbetween steps
  //     delay: 0,
  //     // interpolation between coords
  //     steps: 0,
  //     // >=10 steps
  //     smooth: false,
  //   })

  //   if (opts.smooth) {
  //     opts.steps = Math.max(opts.steps, 10)
  //   }

  //   const win = subject[0].ownerDocument.defaultView

  //   const elFromCoords = (coords) => win.document.elementFromPoint(coords.x, coords.y)
  //   const winMouseEvent = win.TouchEvent
  //   const winPointerEvent = win.PointerEvent

  //   const send = (type, coords, el, opts) => {

  //     el = el || elFromCoords(coords)

  //     opts = _.defaults({}, opts, {
  //       clientX: coords.x,
  //       clientY: coords.y,
  //       pageX: coords.x,
  //       pageY: coords.y,
  //       x: coords.x,
  //       y: coords.y,
  //       buttons: 1,
  //       button: 0,
  //     })

  //     if (type.startsWith('mouse')) {

  //       // console.log('mouseevent')
  //       el.dispatchEvent(
  //         new winMouseEvent(type, Object.assign({}, opts, { bubbles: true, cancelable: true }))
  //       )

  //       return
  //     }

  //     // console.log('pointerevent')
  //     el.dispatchEvent(
  //       new winPointerEvent(type, Object.assign({}, opts, { bubbles: true, cancelable: true }))
  //     )
  //   }

  //   const toSel = to

  //   function drag (from, to, steps = 1) {

  //     const fromEl = elFromCoords(from)

  //     const _log = Cypress.log({
  //       $el: fromEl,
  //       name: 'drag to',
  //       message: toSel,
  //     })

  //     _log.snapshot('before', { next: 'after', at: 0 })

  //     _log.set({ coords: to })

  //     send('mouseover', from, fromEl)
  //     send('mousemove', from, fromEl)
  //     send('mousedown', from, fromEl)

  //     cy.then(() => {
  //       return Cypress.Promise.try(() => {

  //         if (steps > 0) {

  //           const dx = (to.x - from.x) / steps
  //           const dy = (to.y - from.y) / steps

  //           return Cypress.Promise.map(Array(steps).fill(), (v, i) => {
  //             i = steps - 1 - i

  //             let _to = {
  //               x: from.x + dx * (i),
  //               y: from.y + dy * (i),
  //             }

  //             send('mousemove', _to, fromEl)

  //             return Cypress.Promise.delay(opts.delay)

  //           }, { concurrency: 1 })
  //         }
  //       })
  //       .then(() => {

  //         send('mousemove', to, fromEl)
  //         send('mouseover', to)
  //         send('mousemove', to)
  //         send('mouseup', to)
  //         _log.snapshot('after', { at: 1 }).end()

  //       })

  //     })

  //   }

  //   const $el = subject
  //   const fromCoords = getCoords($el)
  //   let toEl = to

  //   if (_.isString(to)) {
  //     toEl = cy.$$(to)
  //   }

  //   const toCoords = getCoords(toEl)

  //   drag(fromCoords, toCoords, opts.steps)
  // }

  // Cypress.Commands.addAll(
  //   { prevSubject: 'element' },
  //   {
  //     dragTo,
  //   }
  // )

;/*js*/`
e: DragEvent
altKey: false
bubbles: true
button: 0
buttons: 1
cancelBubble: false
cancelable: true
clientX: 655
clientY: 611
composed: true
ctrlKey: false
currentTarget: div
dataTransfer: DataTransfer
dropEffect: "none"
effectAllowed: "uninitialized"
files: FileList {length: 0}
items: DataTransferItemList {length: 0}
types: []
__proto__: DataTransfer
defaultPrevented: false
detail: 0
eventPhase: 2
fromElement: null
isTrusted: true
layerX: 275
layerY: 25
metaKey: false
movementX: 0
movementY: 0
offsetX: 36
offsetY: 25
pageX: 655
pageY: 611
path: (19) [div, div, div, div, div#react-tabs-37.react-tabs__tab-panel.react-tabs__tab-panel--selected, div.react-tabs, div, div.doc__HtmlContainer-sc-1s0952h-0.gswDSM, div.doc__Container-sc-1s0952h-1.jqhLew, div.layout__ChildrenContainer-sc-16juec5-1.iSfRoO, div.pagebody__SidebarContent-ivj5mq-2.hrlsNx, div.pagebody__Container-ivj5mq-0.hcXHj, div.layout__ContentContainer-sc-16juec5-2.lbwisx, div#gatsby-focus-wrapper, div#___gatsby, body, html, document, Window]
relatedTarget: null
returnValue: true
screenX: 1367
screenY: 444
shiftKey: false
sourceCapabilities: InputDeviceCapabilities {firesTouchEvents: false}
srcElement: div
target: div
timeStamp: 4224.634999991395
toElement: div
type: "dragstart"
view: Window {postMessage: ƒ, blur: ƒ, focus: ƒ, close: ƒ, parent: Window, …}
which: 1
x: 655
y: 611
__proto__: DragEvent
`
