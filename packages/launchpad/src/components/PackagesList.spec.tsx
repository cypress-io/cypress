import { gql } from '@urql/core'
import { PackagesListFragment, TestPackagesListDocument } from '../generated/graphql-test'
import PackagesList from './PackagesList.vue'

describe('<PackagesList />', () => {
  gql`
    query TestPackagesList {
      wizard {
        ...PackagesList
      }
    }
  `

  let gqlVal: PackagesListFragment

  beforeEach(() => {
    cy.testQuery(TestPackagesListDocument).then(({ wizard }) => {
      if (wizard) {
        gqlVal = wizard
      }
    })
  })

  it('playground', () => {
    cy.mount(() => <PackagesList gql={gqlVal} />)
  })
})
