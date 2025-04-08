import Config from './Config.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { each } from 'lodash'
import { ConfigFragmentDoc } from '../../generated/graphql-test'

describe('<Config/>', { viewportWidth: 1200, viewportHeight: 1600 }, () => {
  it('renders the title, description, code, and legend', () => {
    cy.mountFragment(ConfigFragmentDoc, {
      render (gql) {
        return (<div class="p-12 resize-x overflow-auto">
          <Config gql={gql}/>
        </div>)
      },
    })

    cy.get('[data-cy="config-code"]').contains('reporter')
    cy.get('[data-cy="config-legend"]').contains('default')
    cy.contains(defaultMessages.settingsPage.config.title)
    // TODO: write a support file helper for ignoring the {0} values etc
    each(defaultMessages.settingsPage.config.description.split('{0}'), (description) => {
      cy.contains(description)
    })
  })

  it('matches up legends with values', () => {
    cy.mountFragment(ConfigFragmentDoc, {
      onResult: (result) => {
        const sourceTypes = ['default', 'config', 'env', 'cli', 'plugin']

        sourceTypes.forEach((sourceType) => {
          result.config?.unshift({
            field: sourceType,
            value: `testValue-${sourceType}`,
            from: sourceType,
          })
        })
      },
      render (gql) {
        return (<div class="p-12 resize-x overflow-auto">
          <Config gql={gql}/>
        </div>)
      },
    });

    ['default', 'config', 'env', 'cli'].forEach((origin) => {
      cy.get('[data-cy="config-legend"]').contains(origin).then(($legend) => {
        const legendColor = $legend.css('background-color')

        cy.get('[data-cy="config-code"]').contains(`testValue-${origin}`).then(($code) => {
          const codeColor = $code.css('background-color')

          expect(codeColor).to.equal(legendColor)
        })
      })
    })
  })
})
