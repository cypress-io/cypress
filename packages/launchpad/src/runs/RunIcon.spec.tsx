import RunIcon from './RunIcon.vue'

describe('<RunIcon />', { viewportWidth: 80, viewportHeight: 200 }, () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="p-3 flex flex-col align-middle justify-center w-screen">
        <RunIcon status="ko"/>
        <hr/>
        <RunIcon status="ok"/>
        <hr/>
        <RunIcon status="warn"/>
        <hr/>
        <RunIcon status={45} />
      </div>
    ))
  })
})
