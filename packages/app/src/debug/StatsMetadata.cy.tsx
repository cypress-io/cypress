import StatsMetadata from './StatsMetadata.vue'

describe('<StatsMetadata />', () => {
  const group_linux_chrome = {
    id: '123',
    os: {
      id: '123',
      name: 'Linux',
      nameWithVersion: 'Linux Debian',
    },
    browser: {
      id: '123',
      formattedName: 'Chrome',
      formattedNameWithVersion: 'Chrome 106',
    },
    groupName: 'Staging',
  }

  const group_macos_edge = {
    id: '123',
    os: {
      id: '123',
      name: 'Apple',
      nameWithVersion: 'macOS 12.3',
    },
    browser: {
      id: '123',
      formattedName: 'Edge',
      formattedNameWithVersion: 'Edge 100.2',
    },
    groupName: 'Production',
  }

  const group_windows_webkit = {
    id: '123',
    os: {
      id: '123',
      name: 'Windows',
      nameWithVersion: 'Windows 12.3',
    },
    browser: {
      id: '123',
      formattedName: 'Webkit',
      formattedNameWithVersion: 'Webkit 108',
    },
    groupName: 'Production',
  }

  const group_windows_chrome = {
    id: '123',
    os: {
      id: '123',
      name: 'Windows',
      nameWithVersion: 'Windows 12.3',
    },
    browser: {
      id: '123',
      formattedName: 'Chrome',
      formattedNameWithVersion: 'Chrome 106',
    },
    groupName: 'Production',
  }

  it('single values', () => {
    const testingOrder = ['spec-duration 2:23', 'operating-system Linux Debian', 'browser Chrome 106', 'testing-type Component']

    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['DURATION', 'OS', 'BROWSER', 'TESTING']}
          specDuration={'2:23'}
          testing={'component'}
          groups={[group_linux_chrome]}
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
      'testing-type E2E',
    ]

    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'e2e'}
          groups={[group_macos_edge, group_linux_chrome, group_windows_webkit]}
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

  it('group values with 1 browser', () => {
    const testingOrder = [
      'spec-duration 2:23-3:40',
      'group-server 2 groups',
      'operating-system-groups 2 operating systems',
      'browser-groups 1 browser',
      'testing-type E2E',
    ]

    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'e2e'}
          groups={[group_linux_chrome, group_windows_chrome]}
        />
      </div>
    ))

    cy.findByTestId('stats-metadata').children().should('have.length', 5)
    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      cy.wrap(ele).should('have.text', testingOrder[index])
      cy.findByTestId(testingOrder[index]).should('be.visible')
    })
  })

  it('group values with 1 os', () => {
    const testingOrder = [
      'spec-duration 2:23-3:40',
      'group-server 2 groups',
      'operating-system-groups 1 operating system',
      'browser-groups 2 browsers',
      'testing-type E2E',
    ]

    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'e2e'}
          groups={[group_windows_webkit, group_windows_chrome]}
        />
      </div>
    ))

    cy.findByTestId('stats-metadata').children().should('have.length', 5)
    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      cy.wrap(ele).should('have.text', testingOrder[index])
      cy.findByTestId(testingOrder[index]).should('be.visible')
    })
  })

  it('shows the correct groupName', () => {
    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['GROUP_NAME', 'OS', 'BROWSER']}
          groups={[group_linux_chrome]}
          groupName={group_linux_chrome.groupName}
        />
      </div>
    ))

    cy.findByTestId('group_name Staging').should('be.visible')
  })

  // This tests the functionality for arrMapping in StatsMetadata
  it('only displays unique browsers and calculates correct number of OS', () => {
    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
          specDuration={'2:23-3:40'}
          testing={'component'}
          groups={[group_macos_edge, group_linux_chrome, group_macos_edge]}
        />
      </div>
    ))

    const testingOrder = [
      'spec-duration 2:23-3:40',
      'group-server 3 groups',
      'operating-system-groups 2 operating systems',
      'browser-groups 2 browsers',
      'testing-type Component',
    ]

    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      cy.wrap(ele).should('have.text', testingOrder[index])
      cy.findByTestId(testingOrder[index]).should('be.visible')
    })
  })

  it('displays prefix slot', () => {
    const testingOrder = ['foo', 'spec-duration 2:23', 'operating-system Linux Debian', 'browser Chrome 106', 'testing-type Component']
    const slots = {
      prefix: () => <div>prefix</div>,
    }

    cy.mount(() => (
      <div class='flex bg-gray-50 gap-x-3'>
        <StatsMetadata
          order={['DURATION', 'OS', 'BROWSER', 'TESTING']}
          specDuration={'2:23'}
          testing={'component'}
          groups={[group_linux_chrome]}
          v-slots={slots}
        />
      </div>
    ))

    cy.findByTestId('stats-metadata').children().should('have.length', 5)
    cy.findByTestId('stats-metadata').children().each((ele, index) => {
      if (index === 0) {
        cy.wrap(ele).should('have.text', 'prefix').should('be.visible')
      } else {
        cy.wrap(ele).should('have.text', testingOrder[index])
        cy.findByTestId(testingOrder[index]).should('be.visible')
      }
    })
  })
})
