import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { getPathForPlatform } from '../../src/paths'

describe('Create from component card', () => {
  context('project with default spec pattern', () => {
    beforeEach(() => {
      cy.scaffoldProject('no-specs-vue-2')
      cy.openProject('no-specs-vue-2')
      cy.startAppServer('component')
      cy.visitApp()

      cy.findAllByTestId('card').eq(0).as('ComponentCard')
    })

    it('Shows create from component card for Vue projects with default spec patterns', () => {
      cy.get('@ComponentCard')
      .within(() => {
        cy.findByRole('button', {
          name: 'Create from component',
        }).should('be.visible')
        .and('not.be.disabled')
      })
    })

    it('Can be closed with the x button', () => {
      cy.get('@ComponentCard').click()

      cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')

      cy.get('@DialogCloseButton').click()
      cy.findByRole('dialog', {
        name: 'Choose a component',
      }).should('not.exist')
    })

    it('Lists Vue components in the project', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('2 Matches').should('be.visible')

      cy.findByText('App').should('be.visible')
      cy.findByText('HelloWorld').should('be.visible')
    })

    it('Allows for the user to search through their components', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('*.vue').should('be.visible')
      cy.findByText('2 Matches').should('be.visible')
      cy.findByLabelText('file-name-input').type('HelloWorld')

      cy.findByText('HelloWorld').should('be.visible')
      cy.findByText('1 of 2 Matches').should('be.visible')
      cy.findByText('App').should('not.exist')
    })

    it('shows success modal when component spec is created', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('HelloWorld').should('be.visible').click()

      cy.findByRole('dialog', {
        name: defaultMessages.createSpec.successPage.header,
      }).as('SuccessDialog').within(() => {
        cy.contains(getPathForPlatform('src/components/HelloWorld.cy.js')).should('be.visible')
        cy.findByRole('button', { name: 'Close' }).should('be.visible')

        cy.findByRole('link', { name: 'Okay, run the spec' })
        .should('have.attr', 'href', `#/specs/runner?file=src/components/HelloWorld.cy.js`)

        cy.findByRole('button', { name: 'Create another spec' }).click()
      })

      // 'Create from component' card appears again when the user selects "create another spec"
      cy.findByText('Create from component').should('be.visible')
    })

    it('runs generated spec', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('HelloWorld').should('be.visible').click()

      cy.findByRole('dialog', {
        name: defaultMessages.createSpec.successPage.header,
      }).as('SuccessDialog').within(() => {
        cy.contains(getPathForPlatform('src/components/HelloWorld.cy.js')).should('be.visible')
        cy.findByRole('button', { name: 'Close' }).should('be.visible')

        cy.findByRole('link', { name: 'Okay, run the spec' })
        .should('have.attr', 'href', `#/specs/runner?file=src/components/HelloWorld.cy.js`).click()
      })

      cy.findByText('<HelloWorld ... />').should('be.visible')
    })
  })

  context('project with custom spec pattern', () => {
    beforeEach(() => {
      cy.scaffoldProject('no-specs-vue-2')
      cy.openProject('no-specs-vue-2', ['--config-file', 'cypress-custom-spec-pattern.config.js'])
      cy.startAppServer('component')
      cy.visitApp()

      cy.findByText('New Spec').click()
      cy.findAllByTestId('card').eq(0).as('ComponentCard')
    })

    it('Shows create from component card for Vue projects with default spec patterns', () => {
      cy.get('@ComponentCard')
      .within(() => {
        cy.findByRole('button', {
          name: 'Create from component',
        }).should('be.visible')
        .and('not.be.disabled')
      })
    })

    it('Can be closed with the x button', () => {
      cy.get('@ComponentCard').click()

      cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')

      cy.get('@DialogCloseButton').click()
      cy.findByRole('dialog', {
        name: 'Choose a component',
      }).should('not.exist')
    })

    it('Lists Vue components in the project', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('2 Matches').should('be.visible')

      cy.findByText('App').should('be.visible')
      cy.findByText('HelloWorld').should('be.visible')
    })

    it('Allows for the user to search through their components', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('*.vue').should('be.visible')
      cy.findByText('2 Matches').should('be.visible')
      cy.findByLabelText('file-name-input').type('HelloWorld')

      cy.findByText('HelloWorld').should('be.visible')
      cy.findByText('1 of 2 Matches').should('be.visible')
      cy.findByText('App').should('not.exist')
    })

    it('shows success modal when component spec is created', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('HelloWorld').should('be.visible').click()

      cy.findByRole('dialog', {
        name: defaultMessages.createSpec.successPage.header,
      }).as('SuccessDialog').within(() => {
        cy.contains(getPathForPlatform('src/specs-folder/HelloWorld.cy.js')).should('be.visible')
        cy.findByRole('button', { name: 'Close' }).should('be.visible')

        cy.findByRole('link', { name: 'Okay, run the spec' })
        .should('have.attr', 'href', `#/specs/runner?file=src/specs-folder/HelloWorld.cy.js`)

        cy.findByRole('button', { name: 'Create another spec' }).click()
      })

      // 'Create from component' card appears again when the user selects "create another spec"
      cy.findByText('Create from component').should('be.visible')
    })

    it('runs generated spec', () => {
      cy.get('@ComponentCard').click()

      cy.findByText('HelloWorld').should('be.visible').click()

      cy.findByRole('dialog', {
        name: defaultMessages.createSpec.successPage.header,
      }).as('SuccessDialog').within(() => {
        cy.contains(getPathForPlatform('src/specs-folder/HelloWorld.cy.js')).should('be.visible')
        cy.findByRole('button', { name: 'Close' }).should('be.visible')

        cy.findByRole('link', { name: 'Okay, run the spec' })
        .should('have.attr', 'href', `#/specs/runner?file=src/specs-folder/HelloWorld.cy.js`).click()
      })

      cy.findByText('<HelloWorld ... />').should('be.visible')
    })
  })
})
