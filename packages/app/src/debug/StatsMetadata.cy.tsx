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
    groupName: 'Staging',
  }

  const group2 = {
    os: {
      name: 'Apple',
      nameWithVersion: 'macOS 12.3',
    },
    browser: {
      formattedName: 'Edge',
      formattedNameWithVersion: 'Edge 100.2',
    },
    groupName: 'Production',
  }

  const group3 = {
    os: {
      name: 'Windows',
      nameWithVersion: 'Windows 12.3',
    },
    browser: {
      formattedName: 'Webkit',
      formattedNameWithVersion: 'Webkit 108',
    },
    groupName: 'Production',
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
      'group-server 3 groups',
      'operating-system-groups 3 operating systems',
      'browser-groups 3 browsers',
      'testing-type e2e',
    ]

    cy.mount(() => (
      <div class='bg-gray-50'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'e2e'}
          groups={[group2, group1, group3]}
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

  it('shows the correct groupName', () => {
    cy.mount(() => (
      <StatsMetadata
        order={['GROUP_NAME', 'OS', 'BROWSER']}
        groups={[group1]}
        groupName={group1.groupName}
      />
    ))

    cy.findByTestId('group_name Staging').should('be.visible')
  })

  // This tests the functionality for arrMapping in StatsMetadata
  it('only displays unique browsers and calculates correct number of OS', () => {
    cy.mount(() => (
      <div class='bg-gray-50'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'component'}
          groups={[group2, group1, group2]}
        />
      </div>
    ))

    const testingOrder = [
      'spec-duration 02:23-03:40',
      'group-server 3 groups',
      'operating-system-groups 2 operating systems',
      'browser-groups 2 browsers',
      'testing-type component',
    ]

    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      cy.wrap(ele).should('have.text', testingOrder[index])
      cy.findByTestId(testingOrder[index]).should('be.visible')
    })
  })
})
