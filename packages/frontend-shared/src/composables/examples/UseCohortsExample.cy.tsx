import UseCohortsExample, { CopyOption } from './UseCohortsExample.vue'
import { UseCohorts_DetermineCohortDocument } from '../../generated/graphql'

describe('useCohorts example', () => {
  const copyOptions: CopyOption[] = [
    { cohort: 'A', value: 'Notification Title A' },
    { cohort: 'B', value: 'Notification Title B' },
  ]

  beforeEach(() => {
    cy.stubMutationResolver(UseCohorts_DetermineCohortDocument, (defineResult) => {
      return defineResult({ determineCohort: { __typename: 'Cohort', name: 'foo', cohort: 'A' } })
    })
  })

  it('should show value for one cohort with default algorithm', () => {
    cy.mount(() => <UseCohortsExample copyOptions={copyOptions}/>)
    cy.findByTestId('result').then((elem) => {
      expect(copyOptions.map((option) => option.value)).to.include(elem.text())
    })
  })

  it('should show value for one cohort with supplied algorithm', () => {
    const weighted25_75 = [25, 75]

    cy.mount(() => <UseCohortsExample copyOptions={copyOptions} weights={weighted25_75}/>)
    cy.findByTestId('result').then((elem) => {
      expect(copyOptions.map((option) => option.value)).to.include(elem.text())
    })
  })
})
