import CodeTag from './CodeTag.vue'

describe('<CodeTag />', () => {
  it('looks good in code', () => {
    cy.mount(() => (<p>
      Create a <CodeTag>sample_spec.js</CodeTag> file.
    </p>))
  })

  it('displays colored code', () => {
    cy.mount(() => (<p>
      Create a <CodeTag class="text-red-500">sample_spec.js</CodeTag> file.
    </p>))
  })

  it('displays colored code on a background', () => {
    cy.mount(() => (<p>
      Create a <CodeTag class="bg-red-50 text-red-500" bg>sample_spec.js</CodeTag> file.
    </p>))
  })
})
