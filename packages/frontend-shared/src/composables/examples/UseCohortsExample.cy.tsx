import { WEIGHTED } from '../../utils/weightedChoice'
import UseCohortsExample, { CopyOption } from './UseCohortsExample.vue'

describe('useCohorts example', () => {
  const copyOptions: CopyOption[] = [
    { id: 'A', value: 'Notification Title A' },
    { id: 'B', value: 'Notification Title B' },
  ]

  it('should show value for one cohort with default algorithm', () => {
    cy.mount(() => <UseCohortsExample copyOptions={copyOptions}/>)
    cy.findByTestId('result').contains('Notification Title')
  })

  it('should show value for one cohort with supplied algorithm', () => {
    const weighted25_75 = WEIGHTED([25, 75])

    cy.mount(() => <UseCohortsExample copyOptions={copyOptions} algorithm={weighted25_75}/>)
    cy.findByTestId('result').contains('Notification Title')
  })
})
