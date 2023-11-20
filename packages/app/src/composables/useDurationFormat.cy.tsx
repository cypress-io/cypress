import { ref } from 'vue'
import { useDurationFormat } from './useDurationFormat'

describe('useDurationFormat', () => {
  it('should format duration', () => {
    expect(useDurationFormat(1000).value).to.eq('00:01')
    expect(useDurationFormat(60000).value).to.eq('01:00')
    expect(useDurationFormat(6000000).value).to.eq('01:40:00')

    // expects 24 hours and greater to "roll over" and not include day information
    expect(useDurationFormat(86400000).value).to.eq('00:00')

    // expects values less than 1 sec to show milliseconds
    expect(useDurationFormat(456).value).to.eq('456ms')
  })

  it('should render with value', () => {
    const duration = 1000
    const formatted = useDurationFormat(duration)

    cy.mount(() => (<div>
      {formatted.value}
    </div>))

    cy.contains('00:01')
  })

  it('should render with ref and update if ref changes', () => {
    const duration = ref(1000)
    const formatted = useDurationFormat(duration)

    cy.mount(() => (<div>
      {formatted.value}
    </div>))

    cy.contains('00:01').then(() => {
      duration.value = 2000
    })

    cy.contains('00:02')
  })
})
