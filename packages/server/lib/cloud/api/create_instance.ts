import { CloudRequest, isRetryableCloudError } from './cloud_request'
import { asyncRetry, exponentialBackoff } from '../../util/async_retry'
import * as errors from '../../errors'
import { isAxiosError } from 'axios'

const MAX_RETRIES = 3

export interface CreateInstanceResponse {
  spec: string | null
  instanceId: string | null
  claimedInstances: number
  estimatedWallClockDuration: number | null
  totalInstances: number
}

export interface CreateInstanceRequestBody {
  spec: string | null
  groupId: string
  machineId: string
  platform: {
    browserName: string
    browserVersion: string
    osCpus: any[]
    osMemory: Record<string, any> | null
    osName: string
    osVersion: string
  }
}

export const createInstance = async (runId: string, instanceData: CreateInstanceRequestBody, timeout: number = 0): Promise<CreateInstanceResponse> => {
  let attemptNumber = 0

  return asyncRetry(async () => {
    try {
      const { data } = await CloudRequest.post<CreateInstanceResponse>(
        `/runs/${runId}/instances`,
        instanceData,
        {
          headers: {
            'x-route-version': '5',
            'x-cypress-run-id': runId,
            'x-cypress-request-attempt': `${attemptNumber}`,
          },
          timeout,
        },
      )

      return data
    } catch (err: unknown) {
      attemptNumber++

      throw err
    }
  }, {
    maxAttempts: MAX_RETRIES,
    retryDelay: exponentialBackoff(),
    shouldRetry: isRetryableCloudError,
    onRetry: (delay, err) => {
      errors.warning(
        'CLOUD_API_RESPONSE_FAILED_RETRYING', {
          delayMs: delay,
          tries: MAX_RETRIES - attemptNumber,
          response: isAxiosError(err) ? err : err instanceof Error ? err : new Error(String(err)),
        },
      )
    },
  })()
}
