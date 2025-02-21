import DebugSpec, { Spec, TestResults } from './DebugSpec.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

const resultCounts = (min: number, max: number) => {
  return {
    min,
    max,
  }
}

const multipleGroups: {[groupId: string]: any} = {
  '123': {
    os: {
      name: 'Linux',
      nameWithVersion: 'Linux Debian',
    },
    browser: {
      formattedName: 'Chrome',
      formattedNameWithVersion: 'Chrome 106',
    },
    groupName: 'Staging',
    id: '123',
  },
  '456': {
    os: {
      name: 'Apple',
      nameWithVersion: 'macOS 12.3',
    },
    browser: {
      formattedName: 'Firefox',
      formattedNameWithVersion: 'Firefox 95.2',
    },
    groupName: 'Production',
    id: '456',
  },
}

const singleGroup: {[groupId: string]: any} = {
  '123': {
    os: {
      name: 'Linux',
      nameWithVersion: 'Linux Debian',
    },
    browser: {
      formattedName: 'Chrome',
      formattedNameWithVersion: 'Chrome 106',
    },
    groupName: 'Staging',
    id: '123',
  },
}

const testResultMultipleGroups: {[thumbprint: string]: TestResults[]} = {
  'abcd': [
    {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '123',
        status: 'FAILED',
        groupId: '123',
        hasReplay: true,
        hasScreenshots: true,
        hasStdout: true,
        hasVideo: true,
        replayUrl: 'www.cypress.io',
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
    {
      id: '78afba8sf89',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '456',
        status: 'FAILED',
        groupId: '456',
        hasReplay: true,
        hasScreenshots: true,
        hasStdout: true,
        hasVideo: true,
        replayUrl: 'www.cypress.io',
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
  ],
  'efgh': [
    {
      id: '78hjkdf987d9f',
      titleParts: ['Login', 'redirects to stored path after login'],
      instance: {
        id: '123',
        status: 'FAILED',
        groupId: '123',
        hasReplay: true,
        hasScreenshots: true,
        hasStdout: true,
        hasVideo: true,
        replayUrl: 'www.cypress.io',
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
    {
      id: '283sbd0snd8',
      titleParts: ['Login', 'redirects to stored path after login'],
      instance: {
        id: '456',
        status: 'FAILED',
        groupId: '456',
        hasScreenshots: true,
        hasStdout: true,
        hasVideo: true,
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
  ],
}

const testResultSingleGroup: {[thumbprint: string]: TestResults[]} = {
  'abcd': [
    {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '123',
        status: 'FAILED',
        groupId: '123',
        hasReplay: true,
        hasScreenshots: true,
        hasStdout: true,
        hasVideo: true,
        replayUrl: 'www.cypress.io',
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
  ],
  'efgh': [
    {
      id: '78hjkdf987d9f',
      titleParts: ['Login', 'redirects to stored path after login'],
      instance: {
        id: '123',
        status: 'FAILED',
        groupId: '123',
        hasReplay: true,
        hasScreenshots: true,
        hasStdout: true,
        hasVideo: true,
        replayUrl: 'www.cypress.io',
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
  ],
}

describe('<DebugSpec/> with multiple test results', () => {
  const spec = {
    id: '8879798756s88d',
    path: 'cypress/tests/',
    fileName: 'auth',
    fileExtension: '.spec.ts',
    fullPath: 'cypress/tests/auth.spec.ts',
    testsPassed: resultCounts(22, 22),
    testsFailed: resultCounts(2, 2),
    testsPending: resultCounts(1, 1),
    specDuration: {
      min: 143000,
      max: 143000,
    },
  }

  it('mounts correctly for single groups', () => {
    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec}
          testResults={testResultSingleGroup}
          groups={singleGroup}
          testingType={'e2e'}
          foundLocally={true}
          matchesCurrentTestingType={true}
        />
      </div>
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 3)
    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('stats-metadata').children().should('have.length', 5)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/auth.spec.ts')
    cy.contains('auth').should('be.visible')
    cy.findByTestId('run-failures').should('not.be.disabled')
    .contains(defaultMessages.debugPage.runFailures.btn)

    cy.findByTestId('spec-header-metadata').should('be.visible')
    cy.findByTestId('debugHeader-results').should('be.visible')

    // testing debugResultsCalc method
    cy.findByTestId('runResults-failed-count').should('have.text', 'failed 2')
    cy.findByTestId('runResults-passed-count').should('have.text', 'passed 22')
    cy.findByTestId('runResults-pending-count').should('have.text', 'pending 1')
    cy.findByTestId('metaData-Results-spec-duration').should('have.text', 'spec-duration 02:23')

    cy.findAllByTestId('test-group').each((ele) => {
      cy.wrap(ele).within(() => {
        cy.findByTestId('debug-artifacts').should('not.be.visible')
        cy.findByTestId('test-row').realHover().then(() => {
          cy.findByTestId('debug-artifacts').should('be.visible')
        })
      })
    })

    cy.percySnapshot()
  })
})

describe('<DebugSpec/> responsive UI', () => {
  it('renders complete UI on smaller viewports', { viewportHeight: 300, viewportWidth: 580 }, () => {
    const spec: Spec = {
      id: '8879798756s88d',
      path: 'cypress/tests/',
      fileName: 'AlertBar',
      fileExtension: '.spec.ts',
      fullPath: 'cypress/tests/AlertBar.spec.ts',
      testsPassed: resultCounts(2, 2),
      testsFailed: resultCounts(22, 22),
      testsPending: resultCounts(1, 1),
      specDuration: {
        min: 143000,
        max: 143000,
      },
    }

    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec} testResults={testResultSingleGroup} groups={singleGroup} testingType={'component'} foundLocally={true} matchesCurrentTestingType={true}/>
      </div>
    ))

    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/AlertBar.spec.ts')
    cy.contains('AlertBar').should('be.visible')
    cy.findByTestId('run-failures').should('be.visible')

    cy.percySnapshot()
  })

  it('shows complete spec component header with long relative filePath', { viewportHeight: 400, viewportWidth: 700 }, () => {
    const spec: Spec = {
      id: '547a0dG90s7f',
      path: 'src/shared/frontend/cow/packages/foo/cypress/tests/e2e/components/',
      fileName: 'AlertBar',
      fileExtension: '.spec.ts',
      fullPath: 'src/shared/frontend/cow/packages/foo/cypress/tests/e2e/components/AlertBar.spec.ts',
      testsPassed: resultCounts(2, 2),
      testsFailed: resultCounts(22, 22),
      testsPending: resultCounts(1, 1),
      specDuration: {
        min: 143000,
        max: 143000,
      },
    }

    const testResult: {[thumbprint: string]: TestResults[]} = {
      'abcd': [
        {
          id: '676df87878',
          titleParts: ['Login', 'Should redirect unauthenticated user to signin page', 'Enter Password', '.hook() should be called'],
          instance: {
            id: '123',
            status: 'FAILED',
            groupId: '123',
            hasReplay: true,
            hasScreenshots: true,
            hasStdout: true,
            hasVideo: true,
            replayUrl: 'www.cypress.io',
            screenshotsUrl: 'www.cypress.io',
            stdoutUrl: 'www.cypress.io',
            videoUrl: 'www.cypress.io',
          },
        },
      ],
      'efgh': [
        {
          id: '78hjkdf987d9f',
          titleParts: ['Login', 'redirects to stored path after login'],
          instance: {
            id: '123',
            status: 'FAILED',
            groupId: '123',
            hasReplay: true,
            hasScreenshots: true,
            hasStdout: true,
            hasVideo: true,
            replayUrl: 'www.cypress.io',
            screenshotsUrl: 'www.cypress.io',
            stdoutUrl: 'www.cypress.io',
            videoUrl: 'www.cypress.io',
          },
        },
      ],
    }

    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec} testResults={testResult} groups={singleGroup} testingType={'e2e'} matchesCurrentTestingType={true} foundLocally={true}/>
      </div>
    ))

    cy.findByTestId('spec-path').should('have.css', 'text-overflow', 'ellipsis')
    cy.findByTestId('run-failures').should('be.visible')

    cy.percySnapshot()
  })
})

describe('testing groupings', () => {
  it('tests debug spec with multiple groups', { viewportWidth: 1032 }, () => {
    const spec = {
      id: '8879798756s88d',
      path: 'cypress/tests/',
      fileName: 'auth',
      fileExtension: '.spec.ts',
      fullPath: 'cypress/tests/auth.spec.ts',
      testsPassed: resultCounts(22, 23),
      testsFailed: resultCounts(1, 2),
      testsPending: resultCounts(1, 2),
      specDuration: {
        min: 143000,
        max: 220000,
      },
    }

    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec} testResults={testResultMultipleGroups} groups={multipleGroups} foundLocally={true} testingType={'e2e'} matchesCurrentTestingType={true}/>
      </div>
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 3)
    cy.findByTestId('spec-contents').children().should('have.length', 2)

    cy.findByTestId('spec-header-metadata').should('be.visible')
    cy.findByTestId('spec-header-metadata').within(() => {
      cy.findByTestId('stats-metadata').children().should('have.length', 6)
    })

    cy.findAllByTestId('test-group').each((el) => {
      cy.wrap(el).within(() => {
        cy.findAllByTestId('grouped-row').should('have.length', 2)
      })
    })
  })

  it('test results with multiple groups and repeated browsers and a single group', { viewportWidth: 1200 }, () => {
    const spec = {
      id: '8879798756s88d',
      path: 'cypress/tests/',
      fileName: 'Debug',
      fileExtension: '.spec.ts',
      fullPath: 'cypress/tests/Debug.spec.ts',
      testsPassed: resultCounts(22, 25),
      testsFailed: resultCounts(1, 2),
      testsPending: resultCounts(1, 3),
      specDuration: {
        min: 143000,
        max: 220000,
      },
    }

    const repeatedValueGroups: {[groupId: string]: any} = {
      '456': {
        os: {
          name: 'Apple',
          nameWithVersion: 'MacOS 11.4',
        },
        browser: {
          formattedName: 'Chrome',
          formattedNameWithVersion: 'Chrome 106',
        },
        groupName: 'Staging',
        id: '456',
      },
      '123': {
        os: {
          name: 'Apple',
          nameWithVersion: 'MacOS 10.0',
        },
        browser: {
          formattedName: 'Chrome',
          formattedNameWithVersion: 'Chrome 106',
        },
        groupName: 'Production',
        id: '123',
      },
    }

    const tests: {[thumbprint: string]: TestResults[]} = {
      'abcd': [
        {
          id: '676df87878',
          titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
          instance: {
            id: '123',
            status: 'FAILED',
            groupId: '123',
            hasScreenshots: false,
            hasStdout: false,
            hasVideo: false,
          },
        },
        {
          id: '78afba8sf89',
          titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
          instance: {
            id: '456',
            status: 'FAILED',
            groupId: '456',
            hasScreenshots: false,
            hasStdout: false,
            hasVideo: false,
          },
        },
      ],
      'efgh': [
        {
          id: '78hjkdf987d9f',
          titleParts: ['Login', 'redirects to stored path after login'],
          instance: {
            id: '456',
            status: 'FAILED',
            groupId: '456',
            hasScreenshots: false,
            hasStdout: false,
            hasVideo: false,
          },
        },
      ],
    }

    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec} testResults={tests} groups={repeatedValueGroups} foundLocally={true} testingType={'component'} matchesCurrentTestingType={true}/>
      </div>
    ))

    // testing debugResultsCalc method
    cy.findByTestId('runResults-failed-count').should('have.text', 'failed 1-2')
    cy.findByTestId('runResults-passed-count').should('have.text', 'passed 22-25')
    cy.findByTestId('runResults-pending-count').should('have.text', 'pending 1-3')
    cy.findByTestId('metaData-Results-spec-duration').should('have.text', 'spec-duration 02:23-03:40')

    // testing single OS and browser UI
    cy.findByTestId('metaData-Results-operating-system-groups').should('have.text', 'operating-system-groups 1 operating system')
    cy.findByTestId('metaData-Results-browser-groups').should('have.text', 'browser-groups 1 browser')

    cy.findAllByTestId('test-group').should('have.length', 2)
    cy.findAllByTestId('grouped-row').should('have.length', 3)
  })
})

describe('Run Failures button', () => {
  const spec: Spec = {
    id: '1',
    path: 'cypress/tests/',
    fileName: 'auth',
    fileExtension: '.spec.ts',
    fullPath: 'cypress/tests/auth.spec.ts',
    testsPassed: resultCounts(22, 25),
    testsFailed: resultCounts(1, 3),
    testsPending: resultCounts(1, 3),
    specDuration: {
      min: 143000,
      max: 220000,
    },
  }

  it('is disabled if spec is not found locally', () => {
    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec} testResults={testResultSingleGroup} groups={singleGroup} foundLocally={false} testingType={'e2e'} matchesCurrentTestingType={true}/>
      </div>
    ))

    cy.findByTestId('run-failures')
    .should('have.attr', 'aria-disabled', 'true')
    .should('not.have.attr', 'href')

    cy.findByTestId('run-failures').realHover()

    cy.findByTestId('run-all-failures-tooltip').should('be.visible').contains('Spec was not found locally')
  })

  it('is disabled if run testing-type differs from the current testing-type', () => {
    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec
          spec={spec}
          testResults={testResultSingleGroup}
          groups={singleGroup}
          foundLocally={true}
          testingType='e2e'
          matchesCurrentTestingType={false}
          onSwitchTestingType={cy.spy().as('switchTestingType')}
        />
      </div>
    ))

    cy.findByTestId('run-failures')
    .should('have.attr', 'aria-disabled', 'true')
    .should('not.have.attr', 'href')

    cy.findByTestId('run-failures').realHover()

    cy.findByTestId('run-all-failures-tooltip').should('be.visible').within(() => {
      cy.contains('span', 'There are 2 e2e tests failing in this spec. To run them locally switch to e2e testing.')
      cy.contains('button', 'Switch to e2e testing').click()

      cy.get('@switchTestingType').should('have.been.calledWith', 'e2e')
    })
  })

  it('is enabled if found locally and same testing type', () => {
    cy.mount(() => (
      <div class="p-[24px]">
        <DebugSpec spec={spec} testResults={testResultSingleGroup} groups={singleGroup} foundLocally={true} testingType={'e2e'} matchesCurrentTestingType={true}/>
      </div>
    ))

    cy.findByTestId('run-failures')
    .should('have.attr', 'href', '#/specs/runner?file=cypress/tests/auth.spec.ts&mode=debug')
    .and('not.have.attr', 'aria-disabled')
  })
})

describe('Open in IDE', () => {
  const spec = {
    id: '8879798756s88d',
    path: 'cypress/tests/',
    fileName: 'auth',
    fileExtension: '.spec.ts',
    fullPath: 'cypress/tests/auth.spec.ts',
    testsPassed: resultCounts(22, 22),
    testsFailed: resultCounts(2, 2),
    testsPending: resultCounts(1, 1),
    specDuration: {
      min: 143000,
      max: 143000,
    },
  }

  const renderDebugSpec = ({ foundLocally } = { foundLocally: true }) => cy.mount(() =>
    <div class="p-[24px]">
      <DebugSpec spec={spec}
        testResults={testResultSingleGroup}
        groups={singleGroup}
        testingType={'e2e'}
        foundLocally={foundLocally}
        matchesCurrentTestingType={true}
      />
    </div>)

  it('shows openInIDE if file is found locally', () => {
    renderDebugSpec()

    cy.findByLabelText(defaultMessages.debugPage.openFile.openInIDE).as('openInIDE').realHover()
    cy.findByTestId('open-in-ide-tooltip').should('be.visible').and('contain', defaultMessages.debugPage.openFile.openInIDE)

    cy.get('@openInIDE').click()

    cy.findByLabelText('External editor preferences').should('be.visible')
    cy.findByLabelText('Close').click()
  })

  it('shows disabled openInIDE if file is not found locally', () => {
    renderDebugSpec({ foundLocally: false })

    cy.findByLabelText(defaultMessages.debugPage.openFile.notFoundLocally).as('openInIDE').realHover()
    cy.findByTestId('open-in-ide-disabled-tooltip').should('be.visible').and('contain', defaultMessages.debugPage.openFile.notFoundLocally)
  })
})
