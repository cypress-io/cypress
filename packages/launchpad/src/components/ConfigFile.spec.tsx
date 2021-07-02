import ConfigFile from './ConfigFile.vue'

describe('<ConfigFile />', () => {
  it('playground', { viewportWidth: 1280, viewportHeight: 1024 }, () => {
    cy.mount(() => (
      <ConfigFile>
        <div class="bg-gray-300 h-full flex items-center justify-center">
          content
        </div>
      </ConfigFile>
    ))
  })
})
