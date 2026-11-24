import { getPathForPlatform } from '../../src/paths'

interface FrameworkOptions {
  name: 'Vue' | 'React'
  listTitle: string
  glob: string
  matchCount: number
  listed: string[]
  search: { term: string, hidden: string[] }
  selectComponent: () => void
  waitForDevServer?: boolean
}

const vue: FrameworkOptions = {
  name: 'Vue',
  listTitle: 'Lists Vue components in the project',
  glob: '*.vue',
  matchCount: 9,
  listed: ['App', 'HelloWorld'],
  search: { term: 'HelloWorld', hidden: ['App'] },
  selectComponent: () => {
    cy.findByText('HelloWorld').should('be.visible').click()
  },
}

const react: FrameworkOptions = {
  name: 'React',
  listTitle: 'Lists files in the project',
  glob: '*.{js,jsx,tsx}',
  matchCount: 5,
  listed: ['App', 'index'],
  search: { term: 'App', hidden: ['index', 'component'] },
  selectComponent: () => {
    // Expand the row
    cy.findByText('App').should('be.visible').click()

    // Click on 'app' component
    cy.findByTestId('react-component-row').should('contain', 'App').click()
  },
  waitForDevServer: true,
}

function reactOnlyTests () {
  it('shows \'No components found\' if there are no exported components', () => {
    cy.get('@ComponentCard').click()

    cy.findByText('index').should('be.visible').click()

    cy.findByTestId('react-component-row').should('not.exist')
    cy.contains('No components found').should('be.visible')
  })

  it('shows \'Unable to parse file\' if there was an error parsing the file', () => {
    cy.get('@ComponentCard').click()

    // This component has a syntax error so we will fail to parse it
    cy.findByText('Invalid').should('be.visible').click()

    cy.findByTestId('react-component-row').should('not.exist')
    cy.contains('Unable to parse file').should('be.visible')
  })
}

function validateCreateFromComponentCard (framework: FrameworkOptions, beforeEachFn: () => void, expectedSpecPath: string) {
  beforeEach(beforeEachFn)

  const createSpecFromComponent = (inSuccessDialog: () => void) => {
    cy.get('@ComponentCard').click()
    framework.selectComponent()

    cy.getByRole('dialog', {
      name: 'Great! The spec was successfully added',
      native: false,
    }).within(() => {
      cy.contains(getPathForPlatform(expectedSpecPath)).should('be.visible')
      cy.getByRole('button', { name: 'Close' }).should('be.visible')

      inSuccessDialog()
    })
  }

  it(`Shows create from component card for ${framework.name} projects`, () => {
    cy.get('@ComponentCard')
    .within(() => {
      cy.getByRole('button', {
        name: 'Create from component',
      }).should('be.visible')
      .and('not.be.disabled')
    })
  })

  it('Can be closed with the x button', () => {
    cy.get('@ComponentCard').click()

    cy.getByRole('button', { name: 'Close' }).as('DialogCloseButton')

    cy.get('@DialogCloseButton').click()
    cy.getByRole('dialog', {
      name: 'Choose a component',
      native: false,
    }).should('not.exist')
  })

  it(framework.listTitle, () => {
    cy.get('@ComponentCard').click()

    cy.findByText(`${framework.matchCount} matches`).should('be.visible')

    framework.listed.forEach((item) => {
      cy.findByText(item).should('be.visible')
    })
  })

  it('Allows for the user to search through their components', () => {
    cy.get('@ComponentCard').click()

    cy.findByText(framework.glob).should('be.visible')
    cy.findByText(`${framework.matchCount} matches`).should('be.visible')
    cy.findByLabelText('Search by filename').type(framework.search.term)

    cy.findByText(framework.search.term).should('be.visible')
    cy.findByText(`1 of ${framework.matchCount} matches`).should('be.visible')
    framework.search.hidden.forEach((item) => {
      cy.findByText(item).should('not.exist')
    })
  })

  it('shows success modal when component spec is created', () => {
    createSpecFromComponent(() => {
      cy.getByRole('link', { name: 'Okay, run the spec' })
      .should('have.attr', 'href', `#/specs/runner?file=${expectedSpecPath}`)

      cy.getByRole('button', { name: 'Create another spec' }).click()
    })

    // 'Create from component' card appears again when the user selects "create another spec"
    cy.findByText('Create from component').should('be.visible')
  })

  it('runs generated spec', () => {
    createSpecFromComponent(() => {
      if (framework.waitForDevServer) {
        // The dialog can appear before the new spec is written and picked up by
        // the component dev server, and running it before then fails
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- the dev server exposes no signal that it has picked up the spec
        cy.wait(2000)
      }

      cy.getByRole('link', { name: 'Okay, run the spec' })
      .should('have.attr', 'href', `#/specs/runner?file=${expectedSpecPath}`).click()
    })

    cy.waitForSpecToFinish({ passCount: 1 })
  })
}

describe('Create from component card', () => {
  context('Vue', () => {
    context('project with default spec pattern', () => {
      validateCreateFromComponentCard(vue, () => {
        cy.scaffoldProject('no-specs-vue')
        cy.openProject('no-specs-vue', ['--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible('new-project')

        cy.findAllByTestId('card').eq(0).as('ComponentCard')
      }, 'src/components/HelloWorld.cy.ts')
    })

    context('project with custom spec pattern', () => {
      validateCreateFromComponentCard(vue, () => {
        cy.scaffoldProject('no-specs-vue')
        cy.openProject('no-specs-vue', ['--config-file', 'cypress-custom-spec-pattern.config.ts', '--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible('no-specs')

        cy.findByText('New spec').click()
        cy.findAllByTestId('card').eq(0).as('ComponentCard')
      }, 'src/specs-folder/HelloWorld.cy.ts')
    })
  })

  context('React', () => {
    context('project with default spec pattern', () => {
      validateCreateFromComponentCard(react, () => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs', ['--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible('new-project')

        cy.findAllByTestId('card').eq(0).as('ComponentCard')
      }, 'src/App.cy.jsx')

      reactOnlyTests()
    })

    context('project with custom spec pattern', () => {
      validateCreateFromComponentCard(react, () => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs', ['--config-file', 'cypress-custom-spec-pattern.config.ts', '--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible('no-specs')

        cy.findByText('New spec').click()
        cy.findAllByTestId('card').eq(0).as('ComponentCard')
      }, 'src/specs-folder/App.cy.jsx')

      reactOnlyTests()
    })

    // This test verifies that the Create from Component functionality works correctly
    // even when a project has a conflicting babel configuration file.
    // The babel config in this test project includes TypeScript preset and transform plugins
    // that interfere with react-docgen parsing without passing `configFile: false` to the babel parser.
    context('project with conflicting babel config', () => {
      it('parses components out of a file', () => {
        cy.scaffoldProject('no-specs-babel-conflict')
        cy.openProject('no-specs-babel-conflict', ['--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible('new-project')

        cy.findAllByTestId('card').eq(0).as('ComponentCard')

        cy.get('@ComponentCard').click()

        // Expand the row
        cy.findByText('App').should('be.visible').click()

        // Click on 'app' component
        cy.get('[data-cy="react-component-row"]').should('have.length', 2)
        cy.get('[data-cy="react-component-row"]').eq(0).should('contain', 'App')
        cy.get('[data-cy="react-component-row"]').eq(1).should('contain', 'AppWithDefaults')
      })
    })
  })
})
