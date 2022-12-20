import StatsMetadata from './StatsMetadata.vue'

describe('mounts correctly', () => {
  const group1 = {
    os: {
      name: 'Linux',
      nameWithVersion: 'Linux Debian',
    },
    browser: {
      formattedName: 'Chrome',
      formattedNameWithVersion: 'Chrome 106',
    },
  }
  const group2 = {
    os: {
      name: 'Apple',
      nameWithVersion: 'macOS 12.3',
    },
    browser: {
      formattedName: 'Edge',
      formattedNameWithVersion: 'Webkit 95.2',
    },
  }

  it('single values', () => {
    const testingOrder = ['spec-duration 2:23', 'operating-system Linux Debian', 'browser Chrome 106', 'testing-type component']

    cy.mount(() => (
      <div class='bg-gray-50'>
        <StatsMetadata
          order={['DURATION', 'OS', 'BROWSER', 'TESTING']}
          specDuration={'2:23'}
          testing={'component'}
          groups={[group1]}
        />
      </div>
    ))

    cy.findByTestId('stats-metadata').children().should('have.length', 4)
    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      cy.wrap(ele).should('have.text', testingOrder[index])
      cy.findByTestId(testingOrder[index]).should('be.visible')
    })

    cy.percySnapshot()
  })

  it('group values', () => {
    const testingOrder = [
      'spec-duration 2:23-3:40',
      'group-server 2 groups',
      'operating-system-groups 2 operating systems',
      'browser-groups 2 browsers',
      'testing-type e2e',
    ]

    cy.mount(() => (
      <div class='bg-gray-50'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'e2e'}
          groups={[group2, group1]}
        />
      </div>
    ))

    cy.findByTestId('stats-metadata').children().should('have.length', 5)
    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      cy.wrap(ele).should('have.text', testingOrder[index])
      cy.findByTestId(testingOrder[index]).should('be.visible')
    })

    cy.percySnapshot()
  })
})
