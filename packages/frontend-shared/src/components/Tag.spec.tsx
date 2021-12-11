import Tag from './Tag.vue'

describe('<Tag />', () => {
  it('default', () => {
    cy.mount(() => (<p>
      Create a <Tag>sample_spec.js</Tag> file.
    </p>))
  })

  it('looks code for code', () => {
    cy.mount(() => (<p>
      Create a <Tag code>sample_spec.js</Tag> file.
    </p>))
  })

  it('looks code for code colored', () => {
    cy.mount(() => (<p>
      Create a <Tag class="text-red-500" code>sample_spec.js</Tag> file.
    </p>))
  })
})
