// Records how long each command takes and how many times it retried, for comparing
// driver performance. Nothing is recorded unless the run sets `perfOut`.
const ACTIONS = new Set([
  'blur',
  'check',
  'clear',
  'click',
  'dblclick',
  'focus',
  'rightclick',
  'scrollIntoView',
  'scrollTo',
  'select',
  'selectFile',
  'submit',
  'trigger',
  'type',
  'uncheck',
])

const ASSERTIONS = new Set(['should', 'and'])

type PerfRecord = {
  test: string
  name: string
  kind: string
  ms: number
  retries: number
  state: string
  agentCalls: { perfId: string, ms: number }[]
}

const kindOf = (cmd: any) => {
  if (cmd.get('query')) {
    return 'query'
  }

  if (ASSERTIONS.has(cmd.get('name'))) {
    return 'assertion'
  }

  if (ACTIONS.has(cmd.get('name'))) {
    return 'action'
  }

  return 'other'
}

// The flush below is itself a cy.task, and timing it would skew the 'other' bucket
const isPerfFlush = (cmd: any) => cmd.get('name') === 'task' && cmd.get('args')?.[0] === 'perf:record'

if (Cypress.expose('perfOut')) {
  const starts = new Map<string, number>()
  const retries = new Map<string, number>()
  const agentCalls = new Map<string, { perfId: string, ms: number }[]>()
  let currentId: string | undefined
  let nextPerfId = 1
  let records: PerfRecord[] = []

  // Times each round trip the experimental driver makes to its in-page agent, and tags it with
  // an id the server can record, to join the two sides. Safe because Cypress.automation
  // is internal and not part of the public types.
  const cypress = Cypress as any
  const automation = cypress.automation.bind(Cypress)

  cypress.automation = (eventName: string, data: any, ...rest: any[]) => {
    if (eventName !== 'remote:agent' || currentId === undefined) {
      return automation(eventName, data, ...rest)
    }

    // the support file reloads for each spec, so the spec keeps ids unique across the run
    const perfId = `${Cypress.spec.relative}#${nextPerfId++}`
    const id = currentId
    const started = performance.now()
    const record = () => {
      const calls = agentCalls.get(id) ?? []

      calls.push({ perfId, ms: performance.now() - started })
      agentCalls.set(id, calls)
    }

    return Promise.resolve(automation(eventName, { ...data, perfId }, ...rest)).finally(record)
  }

  Cypress.on('command:start', (cmd: any) => {
    currentId = cmd.get('id')
    starts.set(cmd.get('id'), performance.now())
  })

  // A query or action retries together with the assertions chained to it, so retries count against it
  Cypress.on('command:retry', () => {
    if (currentId !== undefined) {
      retries.set(currentId, (retries.get(currentId) ?? 0) + 1)
    }
  })

  const recordEnd = (state: string) => {
    return (cmd: any) => {
      const id = cmd.get('id')
      const started = starts.get(id)

      if (!isPerfFlush(cmd) && started !== undefined) {
        records.push({
          test: Cypress.currentTest.titlePath.join(' > '),
          name: cmd.get('name'),
          kind: kindOf(cmd),
          ms: performance.now() - started,
          retries: retries.get(id) ?? 0,
          state,
          agentCalls: agentCalls.get(id) ?? [],
        })
      }

      starts.delete(id)
      retries.delete(id)
      agentCalls.delete(id)
    }
  }

  Cypress.on('command:end', recordEnd('passed'))
  Cypress.on('command:failed', recordEnd('failed'))

  afterEach(() => {
    const batch = records

    records = []

    cy.task(
      'perf:record',
      { outFile: Cypress.expose('perfOut'), spec: Cypress.spec.relative, records: batch },
      { log: false },
    )
  })
}
