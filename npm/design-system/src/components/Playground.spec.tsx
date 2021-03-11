import React from 'react'
import { CypressLogo } from './CypressLogo/CypressLogo'
import { SearchInput } from './SearchInput/SearchInput'
import { mount } from '@cypress/react'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)
library.add(fab)

const Div: React.FC = (props) => {
  const { children, ...rest } = props
  return (
    <div {...rest}>
      {children}
    </div>
  )
}

const contents: TreeNode[] = [
  {
    type: 'file',
    name: 'README.md',
    element: Div,
    contents: []
  },
  {
    type: 'folder',
    name: 'src',
    element: Div,
    contents: [
      {
        type: 'file',
        name: 'foo.js',
        contents: [],
        element: Div
      },
    ]
  },
  {
    type: 'folder',
    name: 'tests',
    element: Div,
    contents: [
      {
        type: 'file',
        name: 'setup.js',
        contents: [],
        element: Div
      },
      {
        name: 'unit',
        type: 'folder',
        element: Div,
        contents: [
          {
            type: 'file',
            name: 'foo.spec.js',
            contents: [],
            element: Div,
          }
        ]
      }
    ]
  }
]

interface TreeNode {
  type: 'file' | 'folder'
  name: string
  contents: TreeNode[]
  element: React.FC<React.HTMLAttributes<HTMLDivElement>>
}

interface FileTreeProps {
  contents: TreeNode[]
  depth: number
}

const FileTree: React.FC<FileTreeProps> = (props) => {
  const style = {
    paddingLeft: props.depth * 30 + 'px'
  }

  return (
    <React.Fragment>
      {
        props.contents.map(item => (
          <item.element key={item.name}>
            <item.element style={style}>
              {item.name}
            </item.element>
            {
              item.type === 'folder' &&
              <FileTree 
                depth={props.depth + 1} 
                contents={item.contents}
              />
            }
          </item.element>
        ))
      }
    </React.Fragment>
  )
}

describe('Playground', () => {
  it.only('tree', () => {
    mount(
      <FileTree depth={0} contents={contents} />
    )
  })

  it('cypress logo', () => {
    mount(<>
      <CypressLogo size="small" />
      <br/>
      <CypressLogo size="medium" />
      <br/>
      <CypressLogo size="large" />
    </>)
  })

  it('search input', () => {
    const Wrapper = (props) => {
      const [value, setValue] = React.useState(props.value || '')
      const inputRef = React.useRef<HTMLInputElement>(null)

      return (<SearchInput
        prefixIcon={props.prefixIcon}
        onSuffixClicked={() => {
          setValue('')
          inputRef.current.focus()
        }}
        placeholder={props.placeholder}
        inputRef={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}>
      </SearchInput>)
    }

    mount(<>
      <Wrapper placeholder="Find components..." prefixIcon="search" />
      <br/>
      {/* <Wrapper placeholder="Find components..." prefixIcon="coffee"/> */}
      <br/>
      {/* <Wrapper placeholder="Find components..." prefixIcon="search" suffixIcon="times"/> */}
    </>)

    cy.get('input').should('exist')
    cy.get('input').should('exist').first()
    // .its('placeholder').should('be', placeholderText)
    // .click()

    cy.get('input').first().type('Hello World!').clear().type('WHATS UP ⚡️')
    cy.get('input').first().should('contain.value', '⚡️')

    cy.get('input')
    .click()
    .type('hello')
    .get('[data-testid=close]')
    .click()
    .get('input')
    .should('be.focused')
  })
})
