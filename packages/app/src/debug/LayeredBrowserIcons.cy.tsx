import LayeredBrowserIcons from './LayeredBrowserIcons.vue'
import type { BrowserType } from './LayeredBrowserIcons.vue'

describe('<LayeredBrowserIcons/>', () => {
  const browsers: BrowserType[] = ['CHROME', 'CHROME-CANARY', 'CHROME BETA', 'FIREFOX', 'WEBKIT', 'EDGE', 'ELECTRON']

  it('mounts correctly for single browser', () => {
    browsers.forEach((ele) => {
      cy.mount(() => (
        <div class='bg-gray-50 p-[24px]'>
          <LayeredBrowserIcons browsers={[ele]}/>
        </div>
      ))

      cy.findByTestId('layered-browser-icons').children().should('have.length', 1)
    })
  })

  it('mounts correctly for multiple browsers', () => {
    cy.mount(() => (
      <div class='bg-gray-50 p-[24px]'>
        <LayeredBrowserIcons browsers={browsers} />
        <LayeredBrowserIcons browsers={['CHROME', 'FIREFOX', 'EDGE']}/>
        <LayeredBrowserIcons browsers={['CHROME-CANARY', 'WEBKIT', 'ELECTRON']} />
        <LayeredBrowserIcons browsers={['FIREFOX', 'WEBKIT', 'EDGE']}/>
        <LayeredBrowserIcons browsers={['FIREFOX', 'EDGE', 'CHROME-CANARY', 'WEBKIT']}/>
        <LayeredBrowserIcons browsers={['EDGE', 'CHROME', 'WEBKIT', 'ELECTRON']}/>
        <LayeredBrowserIcons browsers={['CHROME', 'CHROME BETA', 'CHROME-CANARY']} />
      </div>
    ))

    cy.findAllByTestId('layered-browser-icons').children().as('allIcons')
    cy.get('@allIcons').should('have.length', browsers.length + 20)
    cy.get('@allIcons').each((ele) => {
      cy.wrap(ele).find('svg').should('exist')
    })
  })
})
