import WelcomeGuideLinks from './WelcomeGuideLinks.vue'

describe('<WelcomeGuideLinks />', () => {
  it('should render correctly', () => {
    // cy.viewport(600, 50)
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    const vSlots = {
      default ({ item }) {
        return (<p class="truncate">{ item.value }</p>)
      },
    }

    cy.mount(() => (<WelcomeGuideLinks class="grid max-w-400px" header="This is my header" items={[
      { value: lorem.slice(50, 200) },
      { value: lorem.slice(40, 100) },
      { value: lorem.slice(0, 40) },
    ]} vSlots={vSlots} />))
  })
})
