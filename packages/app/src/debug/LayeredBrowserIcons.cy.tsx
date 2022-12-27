import LayeredBrowserIcons from './LayeredBrowserIcons.vue'
import type { BrowserType } from './LayeredBrowserIcons.vue'

describe('<LayeredBrowserIcons/>', () => {
  const browsers: BrowserType = ['CHROME', 'CHROME-CANARY', 'FIREFOX', 'WEBKIT', 'EDGE', 'ELECTRON']

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
        <LayeredBrowserIcons order={browsers} />
        <LayeredBrowserIcons order={['CHROME', 'FIREFOX', 'EDGE']}/>
        <LayeredBrowserIcons order={['CHROME-CANARY', 'WEBKIT', 'ELECTRON']} />
        <LayeredBrowserIcons order={['FIREFOX', 'WEBKIT', 'EDGE']}/>
        <LayeredBrowserIcons order={['FIREFOX', 'EDGE', 'CHROME-CANARY', 'WEBKIT']}/>
        <LayeredBrowserIcons order={['EDGE', 'CHROME', 'WEBKIT', 'ELECTRON']}/>
      </div>
    ))

    cy.percySnapshot()
  })
})
