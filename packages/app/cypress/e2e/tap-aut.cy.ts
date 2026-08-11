import type { TapAutFrameTree, TapAutInstance, TapAutOutcome, TapAutReadArgs } from '../tasks/tap-aut'

// The reads open a CDP connection, attach to the runner page, and can fetch a full
// accessibility tree, so they need more than the default command timeout.
const TASK_TIMEOUT_MS = 30000

const MAX_CHARS = 30000
const MAX_NODES = 200

// aria projects these away, so seeing any of them means projectNode stopped filtering.
const NOISE_ROLES = ['InlineTextBox', 'StaticText', 'LineBreak', 'generic', 'none', 'GenericContainer', 'paragraph']

const succeeds = <T>(task: string, args: unknown = null): Cypress.Chainable<T> => {
  return cy.task<TapAutOutcome>(task, args, { timeout: TASK_TIMEOUT_MS }).then((outcome) => {
    if (outcome.error) {
      throw new Error(`${task} was expected to succeed, got ${outcome.error.code}: ${outcome.error.message}`)
    }

    // Cast as withCtx does, so the chainable's type resolves to the read's result.
    return outcome.result as Cypress.Chainable<T>
  })
}

const fails = (task: string, args: unknown = null): Cypress.Chainable<{ code: string, message: string }> => {
  return cy.task<TapAutOutcome>(task, args, { timeout: TASK_TIMEOUT_MS }).then((outcome) => {
    if (!outcome.error) {
      throw new Error(`${task} was expected to fail, got ${JSON.stringify(outcome.result)}`)
    }

    return outcome.error as unknown as Cypress.Chainable<{ code: string, message: string }>
  })
}

const read = <T>(args: TapAutReadArgs): Cypress.Chainable<T> => succeeds<T>('tapAutRead', args)
const readFails = (args: TapAutReadArgs) => fails('tapAutRead', args)

interface DomResult {
  found?: boolean
  html?: string
  truncated?: true
}

interface AmbiguousResult {
  ambiguous: true
  selector: string
  count: number
  selectors: unknown[]
}

interface AriaNode {
  depth: number
  role: string
  name?: string
  value?: string
  states?: string[]
}

interface AriaResult {
  nodes: AriaNode[]
  nodeCount: number
  truncated?: true
}

interface InspectResult {
  selector: string
  found: boolean
  tag?: string
  attributes?: Record<string, string>
  aria?: { role?: string, name?: string, states?: string[] }
  box?: { x: number, y: number, width: number, height: number }
  styles?: Record<string, string>
}

const nodeNamed = (result: AriaResult, role: string, name: string): AriaNode | undefined => {
  return result.nodes.find((node) => node.role === role && node.name === name)
}

// The AUT-frame reads are CLI-native, so unlike the binding commands they cannot be
// driven from the browser. These tests run the real extractors in Node — see
// cypress/tasks/tap-aut.ts — against the app under test of a real inner run.
//
// This covers the extraction layer against a proxy-served AUT in a Cypress-launched
// browser. The CLI around it — argument parsing, the run gate, the renderers, exit
// codes — is covered by system-tests/test/tap_open_spec.ts, which drives the real
// `cypress tap` binary against a non-nested open-mode instance.
//
// The fixture lives in its own project: adding a spec to the shared
// cypress-in-cypress project shifts its spec count, breaking the app e2e specs that
// assert exact counts against it.
describe('tap app-under-test reads', () => {
  beforeEach(() => {
    cy.scaffoldProject('tap-retries')
    cy.openProject('tap-retries')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    cy.visitApp('/specs/runner?file=cypress/e2e/aut-content.cy.js')
    cy.waitForSpecToFinish({ passCount: 1 })
  })

  it('discovers the running instance', () => {
    succeeds<TapAutInstance>('tapAutResolveInstance').then((instance) => {
      expect(instance.projectRoot, 'the scaffolded fixture project').to.include('tap-retries')
      expect(instance.testingType).to.eq('e2e')
      expect(instance.serverPort).to.be.a('number').and.be.greaterThan(0)

      // A single live record selects as `only`; a developer running other instances
      // locally makes it `cwd-match`, since cwd is the fixture's own root.
      expect(instance.reason).to.be.oneOf(['only', 'cwd-match'])
      expect(instance.candidateCount).to.be.at.least(1)

      // Deliberately not asserted: `hasBrowser`. The outer and inner Cypress share the
      // cypress-instances module singleton, so the outer run-mode client's lifecycle
      // nulls the CDP url the inner one recorded. The reads work around it — see
      // resolveReadyInstance in cypress/tasks/tap-aut.ts — and the browser-attached
      // gate is covered by the open-mode system test that owns discovery end to end.
    })
  })

  it('resolves the app-under-test frame in the runner page frame tree', () => {
    succeeds<TapAutFrameTree>('tapAutFrameTree').then((tree) => {
      // Any failure here is about tree shape, so make the tree the failure message.
      const shape = tree.frames
      .map((candidate) => `${'  '.repeat(candidate.depth)}${candidate.name || '(unnamed)'} — ${candidate.url}`)
      .join('\n')

      const frame = (id: string) => tree.frames.find((candidate) => candidate.id === id)!
      const innerApp = frame(tree.innerAppFrameId)
      const aut = frame(tree.autFrameId)

      // Nested, the shallowest `Your project:` frame is the inner Cypress app rather
      // than the app under test — the app under test is the frame below it. Both carry
      // the same name: the app hardcodes 'Test Project' for every project, so nothing
      // but structure distinguishes them.
      expect(innerApp.name, shape).to.eq(`Your project: 'Test Project'`)
      expect(innerApp.url, shape).to.include('/__/')

      expect(aut.name, shape).to.eq(`Your project: 'Test Project'`)
      expect(aut.url, shape).to.include('aut-content.html')
      expect(aut.parentId, 'the AUT frame hangs off the inner Cypress app').to.eq(innerApp.id)

      // Same-process: the AUT is reachable in the top target's tree, so one attached
      // session covers it and no per-target attach is needed.
      const siblings = tree.frames.filter((candidate) => candidate.parentId === innerApp.id)

      // The walk has to pick the AUT out from among the inner project's own snapshot
      // double-buffers, which carry a near-identical name.
      expect(siblings.filter((candidate) => candidate.name.startsWith('AUT Snapshot')), `snapshot double-buffers\n${shape}`).to.have.length(2)
      expect(siblings.filter((candidate) => candidate.name.startsWith('Your project:')), `exactly one AUT frame among the siblings\n${shape}`).to.have.length(1)
    })
  })

  it('reads the app-under-test DOM', () => {
    read<DomResult>({ command: 'dom', maxChars: MAX_CHARS }).then((result) => {
      // Whole-page mode has no selector to match, so it reports no match state.
      expect(result).to.not.have.property('found')
      expect(result).to.not.have.property('truncated')

      // `include`, not an equality: the proxy injects into the AUT document.
      expect(result.html).to.include('<h1>Tap fixture</h1>')
      expect(result.html).to.include('<div id="status" data-cy="status">ready</div>')
    })

    read<DomResult>({ command: 'dom', selector: '#status', maxChars: MAX_CHARS }).then((result) => {
      expect(result).to.deep.eq({ found: true, html: '<div id="status" data-cy="status">ready</div>' })
    })

    read<DomResult>({ command: 'dom', maxChars: 20 }).then((result) => {
      expect(result.truncated, 'the browser-side cap clipped the output').to.be.true
      expect(result.html).to.have.length(20)
    })

    // Matching nothing is an answer, not a failure.
    read<DomResult>({ command: 'dom', selector: '.not-in-the-fixture', maxChars: MAX_CHARS }).then((result) => {
      expect(result).to.deep.eq({ found: false })
    })

    readFails({ command: 'dom', selector: '#status[', maxChars: MAX_CHARS }).then((error) => {
      expect(error.code).to.eq('INVALID_SELECTOR')
    })
  })

  it('reports an ambiguous selector and indexes into it with --at', () => {
    read<AmbiguousResult>({ command: 'dom', selector: '.item', maxChars: MAX_CHARS }).then((result) => {
      expect(result.ambiguous).to.be.true
      expect(result.selector).to.eq('.item')
      expect(result.count).to.eq(3)

      // The disambiguating selectors come from the instance's own binding, which this
      // harness deliberately does not reach (see cypress/tasks/tap-aut.ts); the real
      // selector list is asserted in system-tests/test/tap_open_spec.ts.
      expect(result.selectors).to.deep.eq([])
    })

    read<DomResult>({ command: 'dom', selector: '.item', maxChars: MAX_CHARS, at: 1 }).then((result) => {
      expect(result).to.deep.eq({ found: true, html: '<li class="item">Item 2</li>' })
    })

    readFails({ command: 'dom', selector: '.item', maxChars: MAX_CHARS, at: 3 }).then((error) => {
      expect(error.code).to.eq('INVALID_INDEX')
      expect(error.message).to.include('pass --at 0-2')
    })
  })

  it('projects the app-under-test accessibility tree', () => {
    read<AriaResult>({ command: 'aria', maxNodes: MAX_NODES }).then((result) => {
      expect(result.nodes[0]).to.include({ depth: 0, role: 'RootWebArea' })
      expect(result.nodeCount).to.eq(result.nodes.length)
      expect(result).to.not.have.property('truncated')

      const roles = result.nodes.map((node) => node.role)

      expect(roles.filter((role) => NOISE_ROLES.includes(role)), 'noise roles are projected away').to.deep.eq([])

      expect(nodeNamed(result, 'heading', 'Tap fixture'), 'the heading').to.exist
      expect(nodeNamed(result, 'region', 'Controls'), 'the labelled region').to.exist
      expect(nodeNamed(result, 'button', 'Toggle'), 'the toggle button').to.exist
      expect(nodeNamed(result, 'textbox', 'Search'), 'the labelled textbox').to.exist
      expect(roles, 'the checkbox').to.include('checkbox')

      // The two states Chrome reports as plain booleans, so they survive
      // collectTrueStates' strict `=== true` filter. `pressed` and `checked` are
      // tristates ('true'/'false'/'mixed') and do not surface at all.
      expect(nodeNamed(result, 'button', 'Locked')?.states).to.deep.eq(['disabled'])
      expect(nodeNamed(result, 'textbox', 'Required field')?.states).to.deep.eq(['required'])
    })

    read<AriaResult>({ command: 'aria', maxNodes: 2 }).then((result) => {
      expect(result.nodes).to.have.length(2)
      expect(result.nodeCount).to.eq(2)
      expect(result.truncated, 'the node cap clipped the tree').to.be.true
    })
  })

  it('roots the accessibility tree at a selector', () => {
    read<AriaResult>({ command: 'aria', selector: '#panel', maxNodes: MAX_NODES }).then((result) => {
      // Depths are relative to the subtree, so the region is its root.
      expect(result.nodes[0]).to.include({ depth: 0, role: 'region', name: 'Controls' })

      const roles = result.nodes.map((node) => node.role)

      expect(roles, 'the document root is outside the subtree').to.not.include('RootWebArea')
      expect(roles, 'the heading is outside the subtree').to.not.include('heading')
      expect(roles).to.include('button')
    })

    read<AriaResult>({ command: 'aria', selector: '.not-in-the-fixture', maxNodes: MAX_NODES }).then((result) => {
      expect(result).to.deep.eq({ nodes: [], nodeCount: 0 })
    })
  })

  it('inspects an element in the app under test', () => {
    read<InspectResult>({ command: 'inspect', selector: '#status' }).then((result) => {
      expect(result.selector).to.eq('#status')
      expect(result.found).to.be.true
      expect(result.tag).to.eq('div')
      expect(result.attributes).to.deep.eq({ 'id': 'status', 'data-cy': 'status' })

      // The fixture sets these explicitly, so the computed values do not vary by platform.
      expect(result.styles).to.include({
        'color': 'rgb(0, 100, 0)',
        'background-color': 'rgb(240, 240, 240)',
        'display': 'block',
        'font-size': '16px',
      })

      expect(result.box?.width).to.eq(200)
      expect(result.box?.height).to.eq(24)
      expect(result.box?.x).to.be.a('number')
      expect(result.box?.y).to.be.a('number')
    })

    read<InspectResult>({ command: 'inspect', selector: '#locked' }).then((result) => {
      expect(result.tag).to.eq('button')
      expect(result.aria?.role).to.eq('button')
      expect(result.aria?.name).to.eq('Locked')
      expect(result.aria?.states).to.deep.eq(['disabled'])
    })

    read<InspectResult>({ command: 'inspect', selector: '#missing' }).then((result) => {
      expect(result).to.deep.eq({ selector: '#missing', found: false })
    })
  })
})
