import { CloudRequest } from './cloud_request'

// TODO: generate these types like system-tests' cloudValidations
type CreateInstanceResponse = {
  instanceId: string
  claimedInstances: number
  estimatedWallClockDuration: number | null
  spec: string | null
  totalInstances: number
}

type CreateInstanceRequestData = {
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

export const createInstance = async (runId: string, instanceData: CreateInstanceRequestData, timeout: number = 0) => {
  const { data } = await CloudRequest.post<CreateInstanceResponse>(`/runs/${runId}/instances`, instanceData, {
    headers: {
      'x-route-version': '5',
      'x-cypress-run-id': runId,
      'x-cypress-request-attempt': '0',
    },
    timeout,
  })

  return data
}
