describe('window.open', () => {
  it('can access the child window', () => {
    cy
    .visit('/index.html')
    .window().then((win) => {
      return new Cypress.Promise((resolve, reject) => {
        win.foo = Cypress._.after(2, resolve)

        const child = win.open('/window_open.html', 'foo', 'width=371.58px,height=660px,left=1068.42px,menubar=no,scrollbars=no,status=no')

        const bar = () => {
          try {
            const b = child.bar

            if (b) {
              b()
            } else {
              setTimeout(bar, 100)
            }
          } catch (err) {
            reject(err)
          }
        }

        setTimeout(bar, 100)
      })
    })
  })
})
