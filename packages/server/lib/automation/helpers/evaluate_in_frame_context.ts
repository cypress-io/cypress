import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import Debug from 'debug'
import { isError } from 'lodash'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'

const debug = Debug('cypress:server:automation:helpers:evaluate_in_frame_context')

export async function evaluateInFrameContext (expression: string,
  send: SendDebuggerCommand,
  contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
  frame: Protocol.Page.Frame): Promise<ProtocolMapping.Commands['Runtime.evaluate']['returnType']> {
  for (const [contextId, context] of contexts.entries()) {
    if (context.auxData?.frameId === frame.id) {
      try {
        return await send('Runtime.evaluate', {
          expression,
          contextId,
        })
      } catch (e) {
        if (isError(e) && (e as Error).message.includes('Cannot find context with specified id')) {
          debug('found invalid context %d, removing', contextId)
          contexts.delete(contextId)
        }
      }
    }
  }
  throw new Error('Unable to find valid context for frame')
}
