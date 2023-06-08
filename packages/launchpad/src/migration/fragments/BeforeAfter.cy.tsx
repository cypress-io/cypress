import BeforeAfter from './BeforeAfter.vue'

describe('<BeforeAfter/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="p-[16px]">
      <BeforeAfter v-slots={{
        before: () => <div class="bg-red-300">b-content</div>,
        after: () => <div class="bg-jade-300">a-content</div>,
      }} />
    </div>))
  })
})
