import { gql } from '@urql/core'
import { ManualInstallFragment, TestManualInstallDocument } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'

describe('<ManualInstall />', () => {
  gql`
    query TestManualInstall {
      wizard {
        ...ManualInstall
      }
    }
  `

  let gqlVal: ManualInstallFragment

  beforeEach(() => {
    cy.graphql(TestManualInstallDocument).then((result) => {
      if (result.wizard) {
        gqlVal = result.wizard
      }
    })
  })

  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="m-10 border-1 rounded border-gray-400">
        <ManualInstall gql={gqlVal} />
      </div>
    ), {
      setupContext (ctx) {
        ctx.wizard.setFramework('nextjs')
        ctx.wizard.setBundler('webpack')
      },
    })
  })
})
