import type { ForStubbing } from '@packages/network-interception'
import type { CyIntercept } from '../cy-intercept'

export function resetStubbingState (stubbing: ForStubbing | CyIntercept): void {
  if ('reset' in stubbing && typeof stubbing.reset === 'function') {
    stubbing.reset()
  } else {
    stubbing.routes = []
  }
}
