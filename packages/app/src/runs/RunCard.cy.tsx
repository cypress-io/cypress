import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunCard from './RunCard.vue'
import _ from 'lodash'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const generateTags = (num): any => new Array(num).fill(null).map((_, i) => ({ id: `${i}`, name: `tag${i}`, __typename: 'CloudRunTag' }))

describe('<RunCard />', { viewportHeight: 400 }, () => {
  context('when there is all run information', () => {
    [1600, 1536, 1280, 1024, 768, 600].forEach((viewportWidth) => {
      it(`renders at viewport - ${viewportWidth}`, { viewportWidth }, () => {
        cy.mountFragment(RunCardFragmentDoc, {
          onResult (result) {
            result.tags = generateTags(3)
            result.totalFlakyTests = 1
          },
          render: (gqlVal) => {
            const withLongBranchName = _.cloneDeep(gqlVal)

            if (withLongBranchName.commitInfo) {
              withLongBranchName.commitInfo.branch = 'user/this-is-a-really-long-branch-name-that-should-truncate'
            }

            return (
              //left margins mimic the app sidebar
              //min width mimics the overall grid layout
              <div class="p-3 ml-[64px] lg:ml-[248px] min-w-[728px]">
                <RunCard gql={gqlVal} showDebug debugEnabled />
                <RunCard gql={gqlVal} showDebug />
                <RunCard gql={gqlVal} />
                <RunCard gql={withLongBranchName} showDebug debugEnabled />
              </div>
            )
          },
        })

        let countTagIndex = 0

        switch (viewportWidth) {
          case 600:
          case 768:
          case 1024:
            countTagIndex = 2
            break
          case 1280:
            countTagIndex = 1
            break
          default:
            break
        }

        cy.get('[data-cy="runTagCount"]').eq(countTagIndex).realHover()

        if (countTagIndex === 0) {
          cy.get('[data-cy="runTagCount-tooltip"]')
          .should('be.visible')
          .and('not.contain', 'Flaky')
          .and('not.contain', 'main')
          .and('not.contain', 'tag0')
          .and('contain', 'tag1')
          .and('contain', 'tag2')
        }

        if (countTagIndex === 1) {
          cy.get('[data-cy="runTagCount-tooltip"]')
          .should('be.visible')
          .and('not.contain', 'Flaky')
          .and('not.contain', 'main')
          .and('contain', 'tag0')
          .and('contain', 'tag1')
          .and('contain', 'tag2')
        }

        if (countTagIndex === 2) {
          cy.get('[data-cy="runTagCount-tooltip"]')
          .should('be.visible')
          .and('contain', 'Flaky')
          .and('contain', 'main')
          .and('contain', 'tag0')
          .and('contain', 'tag1')
          .and('contain', 'tag2')
        }
      })
    })
  })

  context('when there is full commit info', { viewportWidth: 1536 }, () => {
    it('displays last commit info', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          Object.keys(result).forEach((key) => {
            result[key] = CloudRunStubs.allPassing[key]
          })
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      if (!CloudRunStubs.allPassing.commitInfo) {
        throw new Error('RunCard spec did not successfully import commit info, so the test cannot be completed')
      }

      cy.contains(CloudRunStubs.allPassing.commitInfo.authorName as string)
      .should('be.visible')

      cy.contains(CloudRunStubs.allPassing.commitInfo.branch as string)
      .should('be.visible')
    })
  })

  context('when there is missing commit info', { viewportWidth: 1536 }, () => {
    it('renders without errors', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          Object.keys(result).forEach((key) => {
            result[key] = CloudRunStubs.allPassing[key]
          })

          result.commitInfo = null
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      // this is the human readable commit time from the stub
      cy.contains('an hour ago').should('be.visible')
      cy.findByTestId('runCard-avatar').should('not.exist')
      cy.findByTestId('runCard-branchName').should('not.exist')
    })
  })

  context('run timing', () => {
    it('displays  HH[h] mm[m] ss[s] format for run duration', { viewportWidth: 1536 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.totalDuration = HOUR + MINUTE + SECOND
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      // this is the human readable commit time from the stub
      cy.contains('01h 01m 01s').should('be.visible')
    })

    it('displays mm[m] ss[s] format for run duration if duration is less than an hour', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.totalDuration = MINUTE + SECOND
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      // this is the human readable commit time from the stub
      cy.contains('01m 01s').should('be.visible')
    })
  })

  context('tags', { viewportWidth: 1536 }, () => {
    it('renders all tags if >= 1 with commitInfo', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(1)
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      cy.get('[data-cy="runCard-branchName"]').should('be.visible')
      cy.get('[data-cy="runTagCount"]').should('not.be.visible')
      cy.get('[data-cy="runTag"]').should('have.length', 1).each(($el, i) => {
        cy.wrap($el).contains(`tag${i}`)
      })
    })

    it('truncates tags if > 1  with commitInfo', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(6)
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      cy.get('[data-cy="runCard-branchName"]').should('be.visible')
      cy.get('[data-cy="runTagCount"]').should('be.visible').contains('+5')
      cy.get('[data-cy="runTag"]').should('have.length', 1).each(($el, i) => cy.wrap($el).contains(`tag${i}`))
    })

    it('renders all tags if >= 1', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(1)

          result.commitInfo = null
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      cy.get('[data-cy="runTagCount"]').should('not.be.visible')
      cy.get('[data-cy="runTag"]').should('have.length', 1).each(($el, i) => cy.wrap($el).contains(`tag${i}`))
    })

    it('truncates tags if > 1', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(6)

          result.commitInfo = null
        },
        render: (gqlVal) => {
          return (
            <div class="p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      cy.get('[data-cy="runTagCount"]').should('be.visible').contains('+5')
      cy.get('[data-cy="runTag"]').should('have.length', 1).each(($el, i) => cy.wrap($el).contains(`tag${i}`))
    })
  })
})
