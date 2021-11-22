import Markdown from './Markdown.vue'

describe('<Markdown />', () => {
  it('renders styled markdown', () => {
    const text = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nec justo feugiat, auctor nunc ac, volutpat arcu. Suspendisse faucibus aliquam ante, sit amet iaculis dolor posuere et. In ut placerat leo.

Has **bold text** and *italic text* and \`code\`.

- list 1
- list 2
- list 3

1. numbered list 1
2. numbered list 2
3. numbered list 3

[a link](https://example.com)

\`\`\`
const heres = {
  some: 'code',
}
\`\`\`

    `

    cy.mount(<Markdown
      text={text}
      codeClass='bg-gray-100 border-gray-300'
    />)

    cy.get('code').first().should('have.class', 'bg-gray-100 border-gray-300')
    cy.get('pre').first().should('have.class', 'bg-gray-100 border-gray-300')
    cy.get('ul').should('have.class', 'list-disc')
  })
})
