/* eslint-disable no-irregular-whitespace */
import FileRow from './FileRow.vue'

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
  it('renders each status', () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="valid"
          language="js"
          content={content}
          filePath="cypress/integration/support.js"
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="changes"
          language="js"
          content={content}
          filePath="cypress/integration/command.js"
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="skipped"
          language="js"
          content={content}
          filePath="cypress.config.js"
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="fail"
          language="js"
          content={content}
          filePath="cypress/integration/index.js"
          description="Lorem ipsum dolor sit"
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
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="changes"
          language="js"
          content={content}
          filePath="cypress/integration/command.js"
          description="Lorem ipsum dolor sit"
          warning={{ description: 'Please merge the code below with your existing `cypress.config.js`', docsLink: '' }}
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js').click()
    cy.contains('Changes required').should('be.visible')
    cy.get('pre').should('be.visible')
  })
})
