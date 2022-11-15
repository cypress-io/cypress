import type { CyHttpMessages } from '../../types'
import type { NetStubbingState } from '../types'
import _ from 'lodash'

export const onNetworkLoadingFailedEvent = async (netStubbingState: NetStubbingState, data) => {
  //Find the matching pre-request
  const request = Object.values(netStubbingState.requests).find((req) => {
    return req?.req?.browserPreRequest?.requestId === data.requestId
  })

  if (!request) {
    // the original request was not intercepted, nothing to do
    return
  }

  // Currently we're only handling when this request was canceled.
  if (data.canceled) {
    await request.handleSubscriptions<CyHttpMessages.NetworkLoadingFailed>({
      eventName: 'network:loadingFailed',
      data,
      mergeChanges: _.noop,
    })

    netStubbingState.removeRequest(request.id)
  }
}
