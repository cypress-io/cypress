import RunIcon from './RunIcon.vue'

describe('<RunIcon />', { viewportWidth: 80, viewportHeight: 200 }, () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="p-3 flex flex-col align-middle justify-center w-screen">
        <RunIcon status="failed"/>
        <hr/>
        <RunIcon status="passed"/>
        <hr/>
        <RunIcon status="cancelled"/>
      </div>
    ))
  })
})
