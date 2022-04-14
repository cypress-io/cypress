import ListRowHeader from './ListRowHeader.vue'
import faker from 'faker'
import FileChangesAdded from '~icons/cy/file-changes-added_x24.svg'

const description = faker.hacker.phrase()
const header = faker.system.directoryPath()
const iconSelector = '[data-testid=file-added-icon]'
const listRowSelector = '[data-testid=list-row-header]'
const descriptionSelector = '[data-testid=list-row-description]'

describe('<ListRowHeader />', () => {
  it('renders the icon slot', () => {
    cy.mount(() => (
      <div class="p-4 text-center">
        <ListRowHeader
          // @ts-ignore - doesn't know about vSlots
          vSlots={{
            icon: () => <FileChangesAdded data-testid="file-added-icon" />,
            description: () => <p data-testid="list-row-description">{ description }</p>,
            header: () => <>{ header }</>,
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
      <div class="p-4 text-center" data-testid="list-row-header">
        <ListRowHeader
          icon={() => <FileChangesAdded data-testid="file-added-icon"/>}
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
