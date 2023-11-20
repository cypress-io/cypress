import cp from 'child_process'
import { defineConfig } from 'cypress'
import type { Browser as PuppeteerBrowser, Page } from 'puppeteer-core'

import { setup, retry } from './src/plugin'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8000',
    setupNodeEvents (on) {
      setup({
        on,
        onMessage: {
          async switchToTabAndGetContent (browser: PuppeteerBrowser) {
            // Utilize the retry since the page may not have opened and loaded by the time this runs
            const page = await retry<Promise<Page>>(async () => {
              const pages = await browser.pages()
              const page = pages.find((page) => page.url().includes('page-2.html'))

              // If we haven't found the page, throw an error to signal that it should retry
              if (!page) throw new Error('Could not find page')

              // Otherwise, return the page instance and it will be returned by the `retry` function itself
              return page
            })

            // Cypress will maintain focus on the Cypress tab within the browser. It's generally a good idea to bring the page to the front to interact with it.
            await page.bringToFront()

            const paragraph = (await page.waitForSelector('p'))!
            const paragraphText = await page.evaluate((el) => el.textContent, paragraph)

            // Clean up any references before finishing up
            paragraph.dispose()

            await page.close()

            // Return the paragraph text and it will be the value yielded by the `cy.puppeteer()` invocation in the spec
            return paragraphText
          },

          async createTabAndGetContent (browser: PuppeteerBrowser, text: string) {
            const page = await browser.newPage()

            // Text comes from the test invocation of `cy.puppeteer()`
            await page.goto(`http://localhost:8000/cypress/fixtures/page-4.html?text=${text}`)

            const paragraph = (await page.waitForSelector('p'))!
            const paragraphText = await page.evaluate((el) => el.textContent, paragraph)

            // Clean up any references before finishing up
            paragraph.dispose()

            await page.close()

            // Return the paragraph text and it will be the value yielded by the `cy.puppeteer()` invocation in the spec
            return paragraphText
          },
        },
      })

      return new Promise<void>((resolve) => {
        const serverProcess = cp.spawn('http-server', ['-p', '8000'], { stdio: 'inherit' })

        serverProcess.on('spawn', () => resolve())
      })
    },
  },
})
