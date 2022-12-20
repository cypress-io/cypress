import LayeredBrowserIcons from './LayeredBrowserIcons.vue'

describe('<LayeredBrowserIcons/>', () => {
  const browsers = ['CHROME', 'CHROME-CANARY', 'FIREFOX', 'WEBKIT', 'EDGE', 'ELECTRON']
  const browsersB = ['EDGE', 'FIREFOX', 'ELECTRON']

  it('mounts correctly for single browser', () => {
    browsers.forEach((ele) => {
      cy.mount(() => (
        <div class='p-24px bg-gray-50'>
          <LayeredBrowserIcons order={[ele]}/>
        </div>
      ))

      cy.findByTestId('layered-browser-icons').children().should('have.length', 1)
    })
  })

  it('mounts correctly for multiple browsers', () => {
    cy.mount(() => (
      <div class='p-24px bg-gray-50'>
        <LayeredBrowserIcons order={browsersB}/>
      </div>
    ))

    cy.findByTestId('layered-browser-icons').children().should('have.length', 3)
  })
})
