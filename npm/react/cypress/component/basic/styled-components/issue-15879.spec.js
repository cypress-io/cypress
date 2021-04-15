import * as React from 'react'
import { mount } from '@cypress/react'
import styled, { ThemeProvider } from 'styled-components'

const lightest = '#FFFEFD'
const light = '#FEFCF1'
const darker = '#C49A03'
const darkest = '#382E0A'

export const theme = {
  primaryDark: darkest,
  primaryLight: lightest,
  primaryLightDarker: light,
  primaryHover: darker,
}

const Line = styled.div`
  margin-bottom: 1rem
`

export const SearchResults = (props) => {
  console.log(props)

  return (
    <div>
      {props.results.map((result) => {
        return (
          <Line>
            {result.title}
          </Line>
        )
      })}
    </div>
  )
}

const mountComponent = ({ results }) => {
  return mount(
    <ThemeProvider theme={theme}>
      <div style={{ margin: '6rem', maxWidth: '105rem' }}>
        <SearchResults results={results} />
      </div>
    </ThemeProvider>,
  )
}

describe('SearchResults', () => {
  it('should render 1', () => {
    mountComponent({
      results: [{ title: 'Org 1' }, { title: 'Org 2' }],
    })
    // cy.screenshot('test-1')
  })

  it('should render 2', () => {
    mountComponent({
      results: [{ title: 'Org 1' }, { title: 'Org 2' }],
    })
    // cy.screenshot('test-2')
  })
})
