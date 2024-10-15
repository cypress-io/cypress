import FileMatchIndicator from './FileMatchIndicator.vue'
import { faker } from '@faker-js/faker'

faker.seed(1)

describe('<FileMatchIndicator />', () => {
  it('renders a reasonable length text', () => {
    cy.mount(() => (<div class="p-12">
      <FileMatchIndicator>
        No Matches
      </FileMatchIndicator>
    </div>))
  })

  it('renders a long bit of text', () => {
    cy.mount(() => (<div class="p-12">
      <FileMatchIndicator>
        { faker.lorem.paragraph(1) }
      </FileMatchIndicator>
    </div>))
  })
})
