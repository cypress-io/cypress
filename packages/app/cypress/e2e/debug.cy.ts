import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { SinonStub } from 'sinon'

const gqlMockData = {
  '__typename': 'Query',
  'currentProject': {
    'id': 'Q3VycmVudFByb2plY3Q6L1VzZXJzL2xhY2hsYW5taWxsZXIvY29kZS9kdW1wL2VsZXV0aGVyaWEvcGFja2FnZXMvZnJvbnRlbmQ=',
    'cloudProject': {
      '__typename': 'CloudProject',
      'id': 'Q2xvdWRQcm9qZWN0OnZncXJ3cA==',
      'runByNumber': {
        'id': 'Q2xvdWRSdW46a0wzRVBlNTBHdw==',
        'runNumber': 129,
        'createdAt': '2023-01-25T00:20:20.549Z',
        'status': 'FAILED',
        'totalDuration': 89885,
        'commitInfo': {
          'sha': '7f70914881637df321edbeb398cdfd5e54de74ef',
          'authorName': 'Lachlan Miller',
          'summary': 'chore: add failing test',
          'branch': 'main',
          '__typename': 'CloudRunCommitInfo',
        },
        'url': 'https://cloud.cypress.io/projects/vgqrwp/runs/129',
        'totalPassed': 18,
        'totalFailed': 1,
        'totalPending': 2,
        'totalSkipped': 0,
        'totalFlakyTests': null,
        'cancelledBy': null,
        'cancelledAt': null,
        'errors': [],
        'overLimitActionType': 'UPGRADE',
        'overLimitActionUrl': 'https://cloud.cypress.io/organizations/021fea67-d608-4ab2-af17-3f8a2a23d019/pricing',
        'isHidden': false,
        'reasonsRunIsHidden': [],
        'totalTests': 21,
        'ci': {
          'id': 'Q2xvdWRDaUJ1aWxkSW5mbzowZTNkODU3OS00OWJjLTRmOGMtODZkOS00MjZlOTcwY2E3N2Q=',
          'ciBuildNumberFormatted': '4001616271',
          'formattedProvider': 'GitHub Actions',
          'url': 'https://github.com/lmiller1990/eleutheria/actions/runs/4001616271',
          '__typename': 'CloudCiBuildInfo',
        },
        'testsForReview': [
          {
            'id': 'Q2xvdWRUZXN0UmVzdWx0OjRjNmYwYmU4LTU2OWYtNDZjMi1hOWQ1LWY2ZjkxZWRhODY2OA==',
            'specId': 'Q2xvdWRTcGVjUnVuOjBlM2Q4NTc5LTQ5YmMtNGY4Yy04NmQ5LTQyNmU5NzBjYTc3ZDpNekExTlRVNE1UWXRNalZqTmkxak0yWmlMVEU0WWpFdFkyWTVaV1JrWkRFM05qTmk=',
            'title': 'InfoPanel > renders',
            'titleParts': [
              'InfoPanel',
              'renders',
            ],
            'duration': 4416,
            'isFlaky': false,
            'testUrl': 'https://cloud.cypress.io/projects/vgqrwp/runs/66372091/overview/4c6f0be8-569f-46c2-a9d5-f6f91eda8668',
            'thumbprint': 'c5505b0a8bdf0a7d0cf7acf4bf6bc6a3',
            'instance': {
              'id': 'Q2xvdWRSdW5JbnN0YW5jZToxMDAwNDI2OTE0OjRjNmYwYmU4LTU2OWYtNDZjMi1hOWQ1LWY2ZjkxZWRhODY2OA==',
              'status': 'FAILED',
              'groupId': 'Q2xvdWRSdW5Hcm91cDo2NjM3MjA5MTpsaW51eC1FbGVjdHJvbi0xMDYtZjlkOGIzNjdiNQ==',
              'totalPassed': 0,
              'totalFailed': 1,
              'totalPending': 0,
              'totalSkipped': 0,
              'totalRunning': 0,
              'hasStdout': true,
              'stdoutUrl': 'https://cloud.cypress.io/projects/vgqrwp/runs/129/overview/4c6f0be8-569f-46c2-a9d5-f6f91eda8668/stdout',
              'hasScreenshots': false,
              'screenshotsUrl': null,
              'hasVideo': true,
              'videoUrl': 'https://cloud.cypress.io/projects/vgqrwp/runs/129/overview/4c6f0be8-569f-46c2-a9d5-f6f91eda8668/video',
              '__typename': 'CloudRunInstance',
            },
            '__typename': 'CloudTestResult',
          },
        ],
        'specs': [
          {
            'id': 'Q2xvdWRTcGVjUnVuOjBlM2Q4NTc5LTQ5YmMtNGY4Yy04NmQ5LTQyNmU5NzBjYTc3ZDpNekExTlRVNE1UWXRNalZqTmkxak0yWmlMVEU0WWpFdFkyWTVaV1JrWkRFM05qTmk=',
            'path': 'src/components/InfoPanel/InfoPanel.cy.ts',
            'basename': 'InfoPanel.cy.ts',
            'extension': '.cy.ts',
            'shortPath': 'src/components/InfoPanel/InfoPanel.cy.ts',
            'groupIds': [
              'Q2xvdWRSdW5Hcm91cDo2NjM3MjA5MTpsaW51eC1FbGVjdHJvbi0xMDYtZjlkOGIzNjdiNQ==',
            ],
            'specDuration': {
              'min': 4521,
              'max': 4521,
              '__typename': 'SpecDataAggregate',
            },
            'status': 'FAILED',
            'testsPassed': {
              'min': 0,
              'max': 0,
              '__typename': 'SpecDataAggregate',
            },
            'testsFailed': {
              'min': 1,
              'max': 1,
              '__typename': 'SpecDataAggregate',
            },
            'testsPending': {
              'min': 0,
              'max': 0,
              '__typename': 'SpecDataAggregate',
            },
            '__typename': 'CloudSpecRun',
          },
        ],
        'groups': [
          {
            'id': 'Q2xvdWRSdW5Hcm91cDo2NjM3MjA5MTpsaW51eC1FbGVjdHJvbi0xMDYtZjlkOGIzNjdiNQ==',
            'testingType': 'component',
            'groupName': null,
            'os': {
              'id': 'Q2xvdWRPcGVyYXRpbmdTeXN0ZW06NjYzNzIwOTE6bGludXgtRWxlY3Ryb24tMTA2LWY5ZDhiMzY3YjU=',
              'name': 'Linux',
              'nameWithVersion': 'Linux Ubuntu - ',
              '__typename': 'CloudOperatingSystem',
            },
            'browser': {
              'id': 'Q2xvdWRCcm93c2VySW5mbzo2NjM3MjA5MTpsaW51eC1FbGVjdHJvbi0xMDYtZjlkOGIzNjdiNQ==',
              'formattedName': 'Electron',
              'formattedNameWithVersion': 'Electron 106',
              '__typename': 'CloudBrowserInfo',
            },
            '__typename': 'CloudRunGroup',
          },
        ],
        '__typename': 'CloudRun',
      },
    },
    'specs': [
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9EaWZmaWN1bHR5SXRlbS5jeS50cw==',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/DifficultyItem.cy.ts',
        'relative': 'src/components/DifficultyItem.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9EaWZmaWN1bHR5TGFiZWwuY3kudHM=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/DifficultyLabel.cy.ts',
        'relative': 'src/components/DifficultyLabel.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9EaWZmaWN1bHR5UGFuZWwuY3kudHM=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/DifficultyPanel.cy.ts',
        'relative': 'src/components/DifficultyPanel.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9QbGF5U3ltYm9sLmN5LnRz',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/PlaySymbol.cy.ts',
        'relative': 'src/components/PlaySymbol.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9Tb25nSW5mby5jeS50c3g=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/SongInfo.cy.tsx',
        'relative': 'src/components/SongInfo.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9Tb25nVGlsZS5jeS50c3g=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/SongTile.cy.tsx',
        'relative': 'src/components/SongTile.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9JbmZvUGFuZWwvSW5mb1BhbmVsLmN5LnRz',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/InfoPanel/InfoPanel.cy.ts',
        'relative': 'src/components/InfoPanel/InfoPanel.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9JbnB1dC9JbnB1dC5jeS50cw==',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/Input/Input.cy.ts',
        'relative': 'src/components/Input/Input.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9Nb2RpZmllclBhbmVsL01vZGlmaWVyUGFuZWwuY3kudHM=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/ModifierPanel/ModifierPanel.cy.ts',
        'relative': 'src/components/ModifierPanel/ModifierPanel.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9QbGFpblBhbmVsL1BsYWluUGFuZWwuY3kudHM=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/PlainPanel/PlainPanel.cy.ts',
        'relative': 'src/components/PlainPanel/PlainPanel.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9Ob25HYW1lcGxheVNjcmVlbi9Ob25HYW1lcGxheVNjcmVlbi5jeS50cw==',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/NonGameplayScreen/NonGameplayScreen.cy.ts',
        'relative': 'src/components/NonGameplayScreen/NonGameplayScreen.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9TY29yZUJhZGdlL1Njb3JlQmFkZ2UuY3kudHM=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/ScoreBadge/ScoreBadge.cy.ts',
        'relative': 'src/components/ScoreBadge/ScoreBadge.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9TaWduSW5Gb3JtL1NpZ25JbkZvcm0uY3kudHN4',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/SignInForm/SignInForm.cy.tsx',
        'relative': 'src/components/SignInForm/SignInForm.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvY29tcG9uZW50cy9TaWduVXBGb3JtL1NpZ25VcEZvcm0uY3kudHM=',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/components/SignUpForm/SignUpForm.cy.ts',
        'relative': 'src/components/SignUpForm/SignUpForm.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvc2NyZWVucy9Tb25nU2VsZWN0U2NyZWVuL0xvYWRpbmdTY3JlZW4uY3kudHN4',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/screens/SongSelectScreen/LoadingScreen.cy.tsx',
        'relative': 'src/screens/SongSelectScreen/LoadingScreen.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvc2NyZWVucy9Tb25nU2VsZWN0U2NyZWVuL09wdGlvbnNQYW5lLmN5LnRzeA==',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/screens/SongSelectScreen/OptionsPane.cy.tsx',
        'relative': 'src/screens/SongSelectScreen/OptionsPane.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvc2NyZWVucy9nYW1lcGxheS9HYW1lcGxheUxvYWRpbmcuY3kudHN4',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/screens/gameplay/GameplayLoading.cy.tsx',
        'relative': 'src/screens/gameplay/GameplayLoading.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvc2NyZWVucy9zdW1tYXJ5L1N1bW1hcnlTY3JlZW4uY3kudHN4',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/screens/summary/SummaryScreen.cy.tsx',
        'relative': 'src/screens/summary/SummaryScreen.cy.tsx',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvc2NyZWVucy9nYW1lcGxheS9jb21wb25lbnRzL0dhbWVwbGF5L0dhbWVwbGF5LmN5LnRz',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/screens/gameplay/components/Gameplay/Gameplay.cy.ts',
        'relative': 'src/screens/gameplay/components/Gameplay/Gameplay.cy.ts',
        '__typename': 'Spec',
      },
      {
        'id': 'U3BlYzovVXNlcnMvbGFjaGxhbm1pbGxlci9jb2RlL2R1bXAvZWxldXRoZXJpYS9wYWNrYWdlcy9mcm9udGVuZC9zcmMvc2NyZWVucy9nYW1lcGxheS9jb21wb25lbnRzL0dhbWVwbGF5L0dhbWVwbGF5U2NvcmUuY3kudHN4',
        'absolute': '/Users/lachlanmiller/code/dump/eleutheria/packages/frontend/src/screens/gameplay/components/Gameplay/GameplayScore.cy.tsx',
        'relative': 'src/screens/gameplay/components/Gameplay/GameplayScore.cy.tsx',
        '__typename': 'Spec',
      },
    ],
    'currentTestingType': 'component',
    '__typename': 'CurrentProject',
  },
}

function moveToDebugPage (): void {
  cy.findByTestId('sidebar-link-debug-page').click()
  cy.findByTestId('debug-container').should('be.visible')
}

Cypress.on('window:before:load', (win) => {
  win.__CYPRESS_GQL_NO_SOCKET__ = 'true'
  console.log('on before load!!!')
})

describe('App: Debug', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    console.log('before')
    window.__CYPRESS_GQL_NO_SOCKET__ = 'true'
  })

  it('resolves the runs page', () => {
    cy.intercept('POST', '/__cypress/graphql/query-Debug', {
      body: {
        data: gqlMockData,
      },
    }).as('network')

    cy.remoteGraphQLIntercept(async (obj, testState) => {
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        console.log('need to do something here!', obj.result)
        if (obj.result?.data?.cloudProjectBySlug) {
          obj.result.data.cloudProjectBySlug.runsByCommitShas = [

            {
              id: 'Q2xvdWRSdW46a0wzRVBlNTBHdw==',
              runNumber: 129,
              status: 'FAILED',
              commitInfo: {
                sha: '7f70914881637df321edbeb398cdfd5e54de74ef',
                __typename: 'CloudRunCommitInfo',
              },
              __typename: 'CloudRun',
            },
          ]
        }
      }

      return obj.result
    })

    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.withCtx((ctx) => {
      ctx.git!.__testSetGitHashes(['7f70914881637df321edbeb398cdfd5e54de74ef'])
    })

    cy.loginUser()

    cy.visitApp()

    moveToDebugPage()
  })
})
