import type Sinon from 'sinon'
import type { expect as Expect } from 'chai'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp-protocol/cdp_automation'
import { cdpNavigateHistory } from '../../../../lib/automation/commands/navigate_history'

const { expect, sinon }: { expect: typeof Expect, sinon: Sinon.SinonSandbox } = require('../../../spec_helper')

describe('navigate:aut:history automation command', () => {
  describe('cdp', () => {
    const autFrameId = 'def'
    const runnerUrl = 'http://localhost:3500/__/#/specs/runner?file=cypress/e2e/spec.cy.js'
    const otherOriginRunnerUrl = 'http://www.foobar.com:3500/__/#/specs/runner?file=cypress/e2e/spec.cy.js'

    // @ts-expect-error - partial mock of the execution context
    const autExecutionContext: Protocol.Runtime.ExecutionContextDescription = {
      id: 456,
      auxData: {
        frameId: autFrameId,
      },
    }

    // @ts-expect-error - partial mock of the frame
    const autFrame: Protocol.Page.Frame = {
      id: autFrameId,
    }

    let sendFn: Sinon.SinonStub<Parameters<SendDebuggerCommand>, ReturnType<SendDebuggerCommand>>
    let executionContexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>

    const stubNavigationHistory = (currentIndex: number, urls: string[]) => {
      sendFn.withArgs('Page.getNavigationHistory').resolves({
        currentIndex,
        entries: urls.map((url, index) => ({ id: index, url, userTypedURL: url, title: '', transitionType: 'link' })),
      })
    }

    beforeEach(() => {
      sendFn = sinon.stub()
      sendFn.withArgs('Runtime.evaluate').resolves({})
      executionContexts = new Map()
      executionContexts.set(autExecutionContext.id, autExecutionContext)
    })

    it('traverses history when the entry was created by the aut', async () => {
      stubNavigationHistory(2, [runnerUrl, runnerUrl, runnerUrl])

      const result = await cdpNavigateHistory(sendFn, executionContexts, autFrame, -1)

      expect(result).to.deep.equal({ traversed: true })
      expect(sendFn).to.have.been.calledWith('Runtime.evaluate', {
        expression: 'window.history.go(-1)',
        contextId: autExecutionContext.id,
      })
    })

    it('traverses history when there is no entry to traverse to', async () => {
      stubNavigationHistory(0, [runnerUrl])

      const result = await cdpNavigateHistory(sendFn, executionContexts, autFrame, -1)

      expect(result).to.deep.equal({ traversed: true })
      expect(sendFn).to.have.been.calledWith('Runtime.evaluate', {
        expression: 'window.history.go(-1)',
        contextId: autExecutionContext.id,
      })
    })

    // https://github.com/cypress-io/cypress/issues/23736
    it('does not traverse into an entry belonging to the runner', async () => {
      stubNavigationHistory(2, [runnerUrl, runnerUrl, otherOriginRunnerUrl])

      const result = await cdpNavigateHistory(sendFn, executionContexts, autFrame, -1)

      expect(result).to.deep.equal({ traversed: false })
      expect(sendFn).not.to.have.been.calledWith('Runtime.evaluate')
    })

    it('does not traverse into an entry belonging to the runner when going forward', async () => {
      stubNavigationHistory(0, [runnerUrl, otherOriginRunnerUrl])

      const result = await cdpNavigateHistory(sendFn, executionContexts, autFrame, 1)

      expect(result).to.deep.equal({ traversed: false })
      expect(sendFn).not.to.have.been.calledWith('Runtime.evaluate')
    })

    it('does not traverse past the runner when more than one entry is requested', async () => {
      stubNavigationHistory(3, [runnerUrl, otherOriginRunnerUrl, otherOriginRunnerUrl, otherOriginRunnerUrl])

      const result = await cdpNavigateHistory(sendFn, executionContexts, autFrame, -3)

      expect(result).to.deep.equal({ traversed: false })
      expect(sendFn).not.to.have.been.calledWith('Runtime.evaluate')
    })
  })
})
