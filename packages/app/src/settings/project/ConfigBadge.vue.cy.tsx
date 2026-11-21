import ConfigBadge from './ConfigBadge.vue'

describe('<ConfigBadge />', () => {
  it('renders a badge with a label and description', () => {
    const description = 'This is a pretty great badge'
    const label = 'Wonderful'

    cy.mount(() => {
      return <ConfigBadge label="Wonderful" class="bg-fuchsia-100 text-fuchsia-600">This is a pretty <pre class="inline">great</pre> badge</ConfigBadge>
    }).get('body').should('contain.text', description).and('contain.text', label)
  })

  it('playground', () => {
    cy.mount(() => (
      <div class="p-12 children:pb-4">
        <ConfigBadge label="Superb" class="bg-gray-100 text-gray-600">This is a pretty <pre class="inline">great</pre> badge</ConfigBadge>
        <ConfigBadge label="Sub-par" class="bg-orange-100 text-orange-600">A warning would probably go here</ConfigBadge>
        <ConfigBadge label="So cool" class="bg-indigo-100 text-indigo-600">Populated by lorem ipsum</ConfigBadge>
        <ConfigBadge label="...Super?" class="bg-rose-100 text-rose-600">...is <a>this</a> expected?</ConfigBadge>
      </div>
    ))
  })
})
