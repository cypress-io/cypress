export const RUNNER_ID = 'unified-runner'

export const REPORTER_ID = 'unified-reporter'

export function getRunnerElement () {
  const runnerElement = document.getElementById(RUNNER_ID)

  if (!runnerElement) {
    throw Error(`Expected runner element with #${RUNNER_ID} but did not find it.`)
  }

  return runnerElement
}

export function getReporterElement () {
  return document.getElementById(REPORTER_ID)
}

export function empty (el: HTMLElement) {
  while (el.lastChild) {
    if (el && el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }
}
