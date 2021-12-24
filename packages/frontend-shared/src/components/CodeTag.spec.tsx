import CodeTag from './CodeTag.vue'

describe('<CodeTag />', () => {
  it('looks good in code', () => {
    cy.mount(() => (<p>
      Create a <CodeTag>sample_spec.js</CodeTag> file.
    </p>))

    cy.contains('sample_spec.js').should('be.visible')
  })

  it('looks good for code colored', () => {
    cy.mount(() => (<p>
      Create a <CodeTag class="text-red-500">sample_spec.js</CodeTag> file.
    </p>))

    cy.contains('sample_spec.js').should('be.visible')
  })
})
