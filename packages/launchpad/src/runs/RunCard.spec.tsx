import RunCard from './RunCard.vue'

describe('<RunCard />', { viewportHeight: 400 }, () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="bg-gray-100 h-screen p-3">
        <RunCard
          status="ko"
          name="Updating the hover state for the button component"
          branch="master"
          author="Ryan"
          timestamp={new Date().getTime()}
          results={{ pass: 5, fail: 0, skip: 0, flake: 2 }}/>
        <RunCard
          status="warn"
          name="Fixing broken tests"
          branch="master"
          author="Ryan"
          timestamp={new Date().getTime()}
          results={{ pass: 15, fail: 1, skip: 0, flake: 3 }}
        />
        <RunCard
          status="ok"
          name="Adding a hover state to the button component"
          branch="master"
          author="Ryan"
          timestamp={new Date().getTime()}
          results={{ pass: 20, fail: 2, skip: 0, flake: 0 }}
        />
        <RunCard
          status={25}
          name="In progress"
          branch="master"
          author="Bart"
          timestamp={new Date().getTime()}
          results={{ pass: 12, fail: 0, skip: 0, flake: 0 }}
        />
      </div>
    ))
  })
})
