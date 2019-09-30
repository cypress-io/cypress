const { _ } = Cypress
const { document } = window.top

function makeAutIframeFillViewport () {
  document.querySelector('.reporter-wrap').style.display = 'none'
  document.querySelector('.runner header').style.display = 'none'
  document.querySelector('.runner').style.left = '0px'
  document.querySelector('.iframes-container').style.top = '0px'
  document.querySelector('.size-container').style = {}
}

function assertAutIframeFillsViewport () {
  const $autIframe = document.querySelector('.aut-iframe')

  ;[
    [0, 0],
    [0, window.top.innerWidth],
    [window.top.innerHeight, 0],
    [window.top.innerHeight, window.top.innerWidth],
  ].forEach(([x, y]) => {
    console.log([x, y])

    const $el = document.elementFromPoint(x, y)

    expect($el).to.eq($autIframe)
  })
}

describe('xvfb', function () {
  // https://github.com/cypress-io/cypress/issues/5186
  it('does not have a cursor hovering over the page', function (done) {
    makeAutIframeFillViewport()

    // assertAutIframeFillsViewport()

    const scrollOpts = {
      duration: 500,
    }

    function fail (e) {
      done(new Error(`mouse event fired on ${e.currentTarget}`))
    }

    document.addEventListener('mouseover', fail)
    document.addEventListener('mousemove', fail)

    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.document.addEventListener('mouseover', fail)
        win.document.addEventListener('mousemove', fail)
      },
    })
    .then(($win) => {
      $win.document.body.innerHTML = '<div style="height:100px;background-color:red;">foo</div>'.repeat(100)
    })
    .contains('foo')
    // .get('div:last-of-type')
    // .scrollIntoView(scrollOpts)
    // .get('div:first-of-type')
    // .scrollIntoView(scrollOpts)
    // .wait(1000)
    .then(_.ary(done, 0))
  })
  // it('', () => {
  //   cy.visit('/')
  //   .get('#tooltip.on')
  //   .should('not.exist', { timeout: 500 })
  // })
})
