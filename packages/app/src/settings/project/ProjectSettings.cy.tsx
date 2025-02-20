// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { ProjectSettingsFragmentDoc } from '../../generated/graphql-test'
import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', () => {
  it('displays the experiments section', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {

      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-[24px]">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.experiments.title).should('be.visible')
  })
})
