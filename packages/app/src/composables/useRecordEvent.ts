import { gql, useMutation } from '@urql/vue'
import { UseRecordEvent_RecordEventDocument } from '../generated/graphql'
import { nanoid } from 'nanoid'
import { decodeBase64Unicode } from '@packages/frontend-shared/src/utils/base64'

gql`
mutation useRecordEvent_recordEvent ($messageId: String!, $campaign: String!, $medium: String!, $payload: String!, $includeMachineId: Boolean) {
  recordEvent(includeMachineId: $includeMachineId, messageId: $messageId, campaign: $campaign, medium: $medium, payload: $payload)
}
`

type EventParams = {
  campaign: string
  medium: string
  cohort?: string
  payload?: Record<string, string | number | undefined | null>
  includeMachineId?: boolean
}

export function useRecordEvent () {
  const recordEventMutation = useMutation(UseRecordEvent_RecordEventDocument)

  async function record (params: EventParams) {
    await recordEventMutation.executeMutation({
      ...params,
      messageId: nanoid(),
      includeMachineId: params.includeMachineId ?? false,
      payload: JSON.stringify(params.payload),
    })
  }

  function decodeCloudId (id?: string) {
    if (!id) {
      return
    }

    const decoded = decodeBase64Unicode(id)

    return decoded.split(':')[1]
  }

  return {
    record,
    decodeCloudId,
  }
}
