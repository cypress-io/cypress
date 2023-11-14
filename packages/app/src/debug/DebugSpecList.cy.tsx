import { SetTestsForDebugDocument } from '../generated/graphql-test'
import DebugSpecList from './DebugSpecList.vue'
import type { CloudDebugSpec } from './utils/DebugMapping'

const specs: CloudDebugSpec[] = [{
  spec: {
    id: '123',
    basename: '',
    extension: '.ts',
    groupIds: [],
    shortPath: '',
    specDuration: {
      max: 10,
      min: 10,
    },
    status: 'FAILED',
    testsFailed: {
      max: 2,
      min: 2,
    },
    testsPassed: {
      max: 0,
      min: 0,
    },
    testsPending: {
      max: 0,
      min: 0,
    },
    path: 'path/to/test.cy.ts',
  },
  tests: {
    'ab123': [{
      id: '123',
      specId: '',
      titleParts: ['Test', 'make it work'],
      duration: 10,
      instance: {
        id: '123',
        groupId: '',
        hasReplay: false,
        hasScreenshots: false,
        hasStdout: false,
        hasVideo: false,
        replayUrl: '',
        status: 'FAILED',
        screenshotsUrl: '',
        stdoutUrl: '',
        videoUrl: '',
        totalFailed: 3,
        totalPassed: 0,
        totalPending: 0,
        totalRunning: 0,
        totalSkipped: 0,
      },
      isFlaky: false,
      testUrl: '',
      thumbprint: 'ab123',
      title: 'Test > make it work',
    }],
  },
  testingType: 'component',
  foundLocally: true,
  matchesCurrentTestingType: true,
  groups: { '123': {
    testingType: 'component',
    browser: {
      id: '123',
      formattedName: '',
      formattedNameWithVersion: '',
    },
    groupName: 'group1',
    id: '123',
    os: {
      id: '123',
      name: 'MacOS',
      nameWithVersion: 'MacOS 10',
    },
  } },
}]

describe('<DebugSpecList />', () => {
  it('calls mutation to set tests for debug mode in runner on mount', (done) => {
    cy.stubMutationResolver(SetTestsForDebugDocument, (defineResult, variables) => {
      expect(variables.testsBySpec[0].specPath).to.eql(specs[0].spec.path)
      expect(variables.testsBySpec[0].tests[0]).to.eql(specs[0].tests['ab123'][0].titleParts.join(' '))
      done()
    })

    cy.mount(() => (
      <DebugSpecList
        specs={specs}
      />
    ))
  })
})
