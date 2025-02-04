import type { ProjectFixtureDir } from '@tooling/system-tests'

function startSetupFor (project: ProjectFixtureDir) {
  cy.scaffoldProject(project)
  cy.openProject(project)
  cy.visitLaunchpad()

  cy.contains('Component Testing').click()
  cy.get(`[data-testid="select-framework"]`)
}

// TODO: assert against all scaffolded files once
// https://github.com/cypress-io/cypress/pull/20818 is merged
function verifyConfigFile (configFile: `cypress.config.${'js' | 'ts'}`) {
  cy.withCtx(async (ctx, o) => {
    const configStats = await ctx.file.checkIfFileExists(o.configFile)

    expect(configStats).to.not.be.null.and.not.be.undefined
  }, { configFile })
}

const ONE_MINUTE = 1000 * 60

describe('scaffolding component testing', {
  taskTimeout: ONE_MINUTE,
}, () => {
  context('webpack5vue3', () => {
    it('scaffolds component testing for Webpack 5 w/ Vue 3 project', () => {
      startSetupFor('vue3-webpack-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue.js 3(detected)')
      cy.get('button').should('be.visible').contains('Webpack(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('react-vite-ts-unconfigured', () => {
    it('scaffolds component testing for React and Vite', () => {
      startSetupFor('react-vite-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('React.js(detected)')
      cy.get('button').contains('Next step').click()

      for (const dep of ['vite', 'react', 'typescript']) {
        cy.findByTestId(`dependency-${dep}`).within(() => {
          cy.get('[aria-label="installed"]').should('exist')
        })
      }

      // this project is intentionally missing this dependency
      cy.findByTestId('dependency-react-dom').within(() => {
        cy.get('[aria-label="pending installation"]').should('exist')
      })

      cy.get('button').contains('Skip').click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')

      verifyConfigFile(`cypress.config.ts`)
    })

    it('detects react dependency even if `package.json` is not declared in `exports`', () => {
      cy.scaffoldProject('react-vite-ts-unconfigured')
      cy.openProject('react-vite-ts-unconfigured')
      cy.visitLaunchpad()

      cy.withCtx(async (ctx) => {
        const reactPackageFilePath = 'node_modules/react/package.json'
        const packageFileContent = await ctx.actions.file.readFileInProject(reactPackageFilePath)
        const newPackageFileContents = packageFileContent.replace('"./package.json": "./package.json",', '')

        await ctx.actions.file.writeFileInProject(reactPackageFilePath, newPackageFileContents)
      })

      cy.contains('Component Testing').click()
      cy.contains('button', 'React.js(detected)').should('be.visible')
      cy.contains('button', 'Next step').click()

      // react-dom dependency is missing
      cy.findByTestId('dependency-react-dom').within(() => {
        cy.get('[aria-label="pending installation"]')
      })

      // fake install
      cy.withCtx(async (ctx) => {
        await ctx.fs.mkdirp(ctx.path.join(ctx.currentProject!, 'node_modules', 'react-dom'))
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('node_modules', 'react-dom', 'package.json'),
          JSON.stringify({
            'version': '18.3.1',
          }),
        )
      })

      // now it is installed, launchpad should detect it and update the UI
      cy.findByTestId('dependency-react-dom').within(() => {
        cy.get('[aria-label="installed"]').should('exist')
      })

      // now clean up the state that we mutated
      cy.withCtx(async (ctx) => {
        await ctx.fs.rmSync(ctx.path.join(ctx.currentProject!, 'node_modules', 'react-dom', 'package.json'))
      })
    })
  })

  context('vue3-vite-ts-unconfigured', () => {
    it('scaffolds component testing for Vue 3 and Vite', () => {
      startSetupFor('vue3-vite-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue.js 3(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('angular-cli-unconfigured', () => {
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23452
    it('scaffolds component testing for Angular', { retries: 15 }, () => {
      startSetupFor('angular-cli-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', 'Angular(detected)').should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('svelte-vite-unconfigured', () => {
    it('Scaffolds component testing for Svelte using vite', () => {
      startSetupFor('svelte-vite-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', /Svelte\.js\s+Support is in\s+Alpha\(detected\)/).should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('svelte-webpack-unconfigured', () => {
    it('Scaffolds component testing for Svelte using webpack', () => {
      startSetupFor('svelte-webpack-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', /Svelte\.js\s+Support is in\s+Alpha\(detected\)/).should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('3rd party ct plugin', () => {
    it('Scaffolds component testing for Qwik using Vite', () => {
      cy.scaffoldProject('qwik-app')
      cy.openProject('qwik-app')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.removeFileInProject('./node_modules/cypress-ct-qwik')
        await ctx.actions.file.moveFileInProject('./cypress-ct-qwik', './node_modules/cypress-ct-qwik')
      })

      cy.visitLaunchpad()

      cy.contains('Component Testing').click()
      cy.contains('button', 'Qwik').should('be.visible')
      cy.contains('button', 'Next step').click()

      cy.findByTestId('dependencies-to-install').within(() => {
        cy.contains('li', '@builder.io/qwik').within(() => {
          cy.findByLabelText('installed')
        })

        cy.contains('li', 'vite').within(() => {
          cy.findByLabelText('installed')
        })
      })

      cy.contains('button', 'Continue').click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')

      verifyConfigFile('cypress.config.js')
    })

    it('Scaffolds component testing for Solid using Vite', () => {
      cy.scaffoldProject('ct-public-api-solid-js')
      cy.openProject('ct-public-api-solid-js')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.removeFileInProject('./node_modules/cypress-ct-solid-js')
        await ctx.actions.file.moveFileInProject('./cypress-ct-solid-js', './node_modules/cypress-ct-solid-js')
      })

      cy.visitLaunchpad()

      cy.contains('Component Testing').click()
      cy.contains('button', 'Solid').should('be.visible')
      cy.contains('button', 'Next step').click()

      cy.findByTestId('dependencies-to-install').within(() => {
        cy.contains('li', 'solid-js').within(() => {
          cy.findByLabelText('installed')
        })

        cy.contains('li', 'vite').within(() => {
          cy.findByLabelText('installed')
        })
      })

      cy.contains('button', 'Continue').click()
      cy.get('[data-cy="launchpad-Configuration files"]').should('be.visible')

      verifyConfigFile('cypress.config.js')
    })

    it('Scaffolds component testing for monorepos with hoisted dependencies', () => {
      cy.scaffoldProject('ct-monorepo-unconfigured')
      cy.openProject('ct-monorepo-unconfigured/packages/foo')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.removeFileInProject(ctx.path.join('..', '..', 'node_modules', 'cypress-ct-qwik'))
        await ctx.actions.file.moveFileInProject(
          ctx.path.join('..', '..', 'cypress-ct-qwik'),
          ctx.path.join('..', '..', 'node_modules', 'cypress-ct-qwik'),
        )
      })

      cy.visitLaunchpad()

      cy.contains('Component Testing').click()
      cy.get(`[data-testid="select-framework"]`).click()
      cy.contains('Qwik').should('be.visible')
    })

    it('Displays a warning message for dependencies that could not be parsed', () => {
      cy.scaffoldProject('qwik-app')
      cy.openProject('qwik-app')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.removeFileInProject('./node_modules/cypress-ct-bad-missing-value')
        await ctx.actions.file.moveFileInProject('./cypress-ct-bad-missing-value', './node_modules/cypress-ct-bad-missing-value')

        await ctx.actions.file.removeFileInProject('./node_modules/cypress-ct-bad-syntax')
        await ctx.actions.file.moveFileInProject('./cypress-ct-bad-syntax', './node_modules/cypress-ct-bad-syntax')
      })

      cy.visitLaunchpad()

      cy.contains('Component Testing').click()

      cy.findByTestId('alert-header').should('be.visible').contains('Community framework definition problem')

      cy.findByTestId('alert-body').within(() => {
        cy.get('li').should('have.length', 2)

        cy.contains('cy-projects/qwik-app/node_modules/cypress-ct-bad-missing-value/package.json').should('be.visible')
        cy.contains('cy-projects/qwik-app/node_modules/cypress-ct-bad-syntax/package.json').should('be.visible')
      })

      // Skipping the Percy snapshot here because it flakes
      // cy.percySnapshot()
    })
  })
})
