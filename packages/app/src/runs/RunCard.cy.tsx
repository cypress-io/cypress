import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunCard from './RunCard.vue'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const generateTags = (num): any => new Array(num).fill(null).map((_, i) => ({ id: `${i}`, name: `tag${i}`, __typename: 'CloudRunTag' }))

describe('<RunCard />', { viewportHeight: 400 }, () => {
  context('when there is all run information', () => {
    it('renders at viewport - 1536', { viewportWidth: 1536 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(3)
          result.totalFlakyTests = 1
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} showDebug debugEnabled />
            </div>
          )
        },
      })

      cy.percySnapshot()
    })

    it('renders at viewport - 1280', { viewportWidth: 1280 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(3)
          result.totalFlakyTests = 1
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} showDebug debugEnabled />
            </div>
          )
        },
      })

      cy.percySnapshot()
    })

    it('renders at viewport - 1024', { viewportWidth: 1024 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(3)
          result.totalFlakyTests = 1
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} showDebug debugEnabled />
            </div>
          )
        },
      })

      cy.percySnapshot()
    })

    it('renders at viewport - 768', { viewportWidth: 768 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = generateTags(3)
          result.totalFlakyTests = 1
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} showDebug debugEnabled />
            </div>
          )
        },
      })

      cy.percySnapshot()
    })

    it('renders at viewport - 600', { viewportWidth: 600 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.tags = [1, 2, 3].map((i) => ({ id: `${i}`, name: `tag${i}`, __typename: 'CloudRunTag' }))
          result.totalFlakyTests = 1
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} showDebug debugEnabled />
            </div>
          )
        },
      })

      cy.percySnapshot()
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
            <div class="h-screen bg-gray-100 p-3">
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
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      // this is the human readable commit time from the stub
      cy.contains('an hour ago').should('be.visible')
    })
  })

  context('run timing', () => {
    it('displays HH:mm:ss format for run duration', { viewportWidth: 1536 }, () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.totalDuration = HOUR + MINUTE + SECOND
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      // this is the human readable commit time from the stub
      cy.contains('01h 01m 01s').should('be.visible')
    })

    it('displays mm:ss format for run duration if duration is less than an hour', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          result.totalDuration = MINUTE + SECOND
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
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
            <div class="h-screen bg-gray-100 p-3">
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
            <div class="h-screen bg-gray-100 p-3">
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
            <div class="h-screen bg-gray-100 p-3">
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
            <div class="h-screen bg-gray-100 p-3">
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
