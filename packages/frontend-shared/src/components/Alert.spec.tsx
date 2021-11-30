import Alert from './Alert.vue'
import CoffeeIcon from '~icons/mdi/coffee'

describe('<Alert />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="p-4 text-center space-y-2">
        <Alert status="success" type="collapsible" icon={CoffeeIcon} title="Coffee, please">Delicious. Yum.</Alert>
        <Alert status="info" type="collapsible" title="An info alert">Just letting you know what's up.</Alert>
        <Alert status="warning" type="static">Nothing good is happening here!</Alert>
        <Alert type="dismissible" status="error">Close me, please!</Alert>
        <Alert type="dismissible" status="default">A notice.</Alert>
      </div>
    ))
  })
})
