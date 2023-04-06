import React from 'react'
import Tag from './tag'

describe('Tag', () => {
  const aliases = [
    'route',
    'agent',
    'primitive',
    'dom',
  ]

  const statuses = [
    'successful-status',
    'warned-status',
    'failed-status',
  ]

  const misc = [
    'count',
  ]

  const MockCommandContainer = ({ children }) => (
    <div style={{ backgroundColor: '#171926', minHeight: '20px' }}>
      {children}
    </div>
  )

  it('types', () => {
    cy.mount(
      <MockCommandContainer>
        <h1 style={{ fontSize: '16px', paddingBottom: '5px' }}>Tag Types</h1>
        <h2 style={{ paddingBottom: '5px' }}>Alias Tags:</h2>
        {aliases.map((type) => (
          <div key={type} style={{ height: '20px' }}>
            <Tag content={type} type={type} />
          </div>
        ))}
        <h2 style={{ paddingBottom: '5px' }}>Status Tags:</h2>
        {statuses.map((type) => (
          <div key={type} style={{ height: '20px' }}>
            <Tag content={type} type={type} />
          </div>
        ))}
        <h2 style={{ paddingBottom: '5px' }}>Misc Tags:</h2>
        {misc.map((type) => (
          <div key={type} style={{ height: '20px' }}>
            <Tag content={type} type={type} />
          </div>
        ))}
      </MockCommandContainer>,
    )

    aliases.concat(statuses).forEach((type) => {
      cy.contains(type)
    })

    cy.contains('dom').realHover()
    cy.get('.cy-tooltip').should('not.exist')

    cy.percySnapshot()
  })

  it('with count', () => {
    cy.mount(
      <MockCommandContainer>
        <h1 style={{ fontSize: '16px', paddingBottom: '5px' }}>Tag Types</h1>
        <h2 style={{ paddingBottom: '5px' }}>Alias Tags:</h2>
        {aliases.map((type, index) => (
          <div key={type} style={{ height: '20px' }}>
            <Tag content={type} type={type} count={index} />
          </div>
        ))}
      </MockCommandContainer>,
    )

    aliases.forEach((type, index) => {
      if (index === 0) {
        return cy.contains(type).should('not.contain', index)
      }

      return cy.contains(type).siblings().contains(index)
    })

    cy.percySnapshot()
  })

  it('with tooltip', () => {
    cy.mount(
      <MockCommandContainer>
        <Tag
          content={<span>Alias</span>}
          type='primitive'
          tooltipMessage={'Alias was referenced!'}
        />
      </MockCommandContainer>,
    )

    cy.contains('Alias').realHover()
    cy.get('.cy-tooltip').contains('Alias was referenced!')

    cy.percySnapshot()
  })

  it('with customClassName', () => {
    cy.mount(
      <MockCommandContainer>
        <Tag
          content="Alias"
          type='primitive'
          count={3}
          customClassName="command-alias"
        />
      </MockCommandContainer>,
    )

    cy.get('.reporter-tag').should('have.class', 'command-alias')
    cy.get('.reporter-tag-count').should('have.class', 'command-alias-count')

    cy.percySnapshot()
  })
})
