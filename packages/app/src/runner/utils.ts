export const RUNNER_ID = 'unified-runner'

export const REPORTER_ID = 'unified-reporter'

export const SNAPSHOT_CONTROLS_ID = 'unified-messages'

function getElementById (id: string) {
  const el = document.querySelector<HTMLElement>(`#${id}`)

  if (!el) {
    throw Error(`Expected element with #${id} but did not find it.`)
  }

  return el
}

export function getRunnerElement () {
  return getElementById(RUNNER_ID)
}

export function getReporterElement () {
  return getElementById(REPORTER_ID)
}

export function empty (el: HTMLElement) {
  while (el.lastChild) {
    if (el && el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }
}
