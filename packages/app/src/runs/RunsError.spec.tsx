import RunsError from './RunsError.vue'
import PaperAirplaneIcon from '~icons/cy/paper-airplane_x16.svg'

describe('<RunsError />', () => {
  it('should show a normal error', () => {
    cy.mount({
      name: 'RunsError',
      render () {
        return (
          <div class="h-screen">
            <RunsError
              message="Cannot connect to the Cypress Dashboard"
              icon="error"
              buttonText="Request Access"
              buttonIcon={PaperAirplaneIcon}
            >
            The request timed out when trying to retrieve the recorded runs from the Cypress Dashboard. <br/>
            Please refresh the page to try again and visit our Status Page if this behavior continues.
            </RunsError>
          </div>
        )
      },
    })
  })

  it('should show access misconfigurations', () => {
    cy.mount({
      name: 'RunsError',
      render () {
        return (<div class="h-screen">
          <RunsError
            message="Request access to view the recorded runs."
            icon="access"
            buttonText="Request Access"
            buttonIcon={PaperAirplaneIcon}
          >
          This is a private project that you do not current have access to. <br/>
          Please request access from the project owner in order to view the list of runs.
          </RunsError>
        </div>)
      },
    })
  })
})
