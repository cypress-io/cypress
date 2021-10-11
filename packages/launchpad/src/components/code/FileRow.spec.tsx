/* eslint-disable no-irregular-whitespace */
import FileRow from './FileRow.vue'
import Button from '@cy/components/Button.vue'

const content = `const { defineConfig } = require(’cypress’)
const { devServer, defineDevServerConfig } = require(’@cypress/vite-dev-server’)

​module.exports = defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      entryHtmlFile: 'cypress/component/support/entry.html'
    }),
  },
})`

describe('FileRow', () => {
  it('renders', () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="valid"
          language="js"
          content={content}
          filePath="cypress/integration/support.js"
          description="Lorem ipsum dolor sit amet"
        />
        <FileRow
          status="changes"
          language="js"
          content={content}
          filePath="cypress/integration/command.js"
          description="Lorem ipsum dolor sit amet"
        />
      </div>
    ))
  })

  it('opens on click', () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="valid"
          language="js"
          content={content}
          filePath="cypress/integration/support.js"
          description="Lorem ipsum dolor sit amet"
        />
        <FileRow
          status="changes"
          language="js"
          content={content}
          filePath="cypress/integration/command.js"
          description="Lorem ipsum dolor sit amet"
          v-slots={{
            warningContents: <div class="flex items-center">
              <div class="flex-grow">
                <span class="font-semibold">Changes required:</span>{' '}
                Please merge the code below with your existing{' '}
                <span class="bg-warning-200 rounded px-1">cypress.config.js</span>
              </div>
              <Button>Learn More</Button>
            </div>,
          }}
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js').click()
    cy.contains('Changes required').should('be.visible')
    cy.get('pre').should('be.visible')
  })
})
