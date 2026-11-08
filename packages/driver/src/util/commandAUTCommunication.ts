/**
 * This function attempts to communicate with the AUT window. We cannot communicate with the AUT if:
 * - win is undefined
 * - win.location is cross origin except when chrome web security is off.
 * @param autWindow - optional, window
 * @returns bool
 */
export const isRunnerAbleToCommunicateWithAut = (autWindow?: Window): boolean => {
  const win = autWindow || Cypress.state('window')

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- reading href throws when the AUT is cross-origin
    win.location.href

    return true
  } catch (err) {
    return false
  }
}
