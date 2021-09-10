import Layout from './Layout.vue'

describe('<Layout />', () => {
  it('playground', { viewportWidth: 1280, viewportHeight: 1024 }, () => {
    cy.mount(() => (
      <Layout>
        <div class="bg-gray-300 h-full flex items-center justify-center">
          content
        </div>
      </Layout>
    ))
  })
})
