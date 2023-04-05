import ListRowHeader from './ListRowHeader.vue'
import faker from 'faker'
import { IconFileChangesAdded, IconActionAdd } from '@cypress-design/vue-icon'
import Button from '@cy/components/Button.vue'

faker.seed(1)

const description = faker.hacker.phrase()
const header = faker.system.directoryPath()
const iconSelector = '[data-testid=file-added-icon]'
const listRowSelector = '[data-testid=list-row-header]'
const descriptionSelector = '[data-testid=list-row-description]'

describe('<ListRowHeader />', () => {
  it('renders all supported slots', () => {
    cy.mount(() => (
      <div class="text-center p-4">
        <ListRowHeader
          // @ts-ignore - doesn't know about vSlots
          vSlots={{
            icon: () => <IconFileChangesAdded data-testid="file-added-icon" />,
            description: () => <p data-testid="list-row-description">{ description }</p>,
            header: () => <>{ header }</>,
            middle: () => <IconActionAdd data-testid="list-row-middle" />,
            right: () => <Button data-testid="list-row-right">Act</Button>,
          }}
        />
      </div>
    )).get(iconSelector)
    .should('be.visible')
    .get(descriptionSelector)
    .should('contain.text', description)
  })

  it('renders a minimal example with an icon and description', () => {
    cy.mount(() => (
      <div class="text-center p-4" data-testid="list-row-header">
        <ListRowHeader
          icon={() => <IconFileChangesAdded data-testid="file-added-icon"/>}
          description={description}
          // @ts-ignore - doesn't know about vSlots
          vSlots={{
            header: () => <>{ header }</>,
          }}
        />
      </div>
    ))
    .get(listRowSelector)
    .should('contain.text', description)
    .and('contain.text', header)
    .get(iconSelector)
    .should('be.visible')
  })
})
