import { machineId as nodeMachineId } from 'node-machine-id'

export async function machineId () {
  try {
    const machineId = await nodeMachineId()

    return machineId
  } catch (error) {
    return null
  }
}
