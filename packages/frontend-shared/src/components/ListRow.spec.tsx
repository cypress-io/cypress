import ListRow from './ListRow.vue'
import IconCoffee from '~icons/mdi/coffee'

describe('<Badge />', () => {
  it('playground', { viewportWidth: 100, viewportHeight: 300 }, () => {
    cy.mount(() => (
      <div class="p-4 text-center">
        <ListRow
          v-slot={{
            icon: <IconCoffee />,
            header: 'Here is a run',
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laboriosam at temporibus nulla ratione a nam inventore esse facere vel nemo est veniam dolore, ullam fuga quidem, cum dolor quibusdam officiis.',
            slider: <div> this is a slider </div>,
          }}
        />
      </div>
    ))
  })
})
