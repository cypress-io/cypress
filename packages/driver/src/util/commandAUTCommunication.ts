export const isRunnerAbleToCommunicateWithAut = (autWindow?: Window): boolean => {
  const win = autWindow || Cypress.state('window')

  try {
    win.location.href

    return true
  } catch (err) {
    return false
  }
}
