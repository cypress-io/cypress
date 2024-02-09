import detectPort from 'detect-port'
import { exit } from '../utils/exitUtil'

export async function friendlyStartupWarnings () {
  const ALL_SERVER_PORTS_USED = [3000, 4000, 8484, 1234]
  const unavailablePorts: number[] = []

  await Promise.all(
    ALL_SERVER_PORTS_USED.map(async (port) => {
      if (port !== (await detectPort(port))) {
        unavailablePorts.push(port)
      }
    }),
  )

  if (unavailablePorts.length > 0) {
    exit(
      `The following ports needed by Cypress are already in use: ${unavailablePorts.join(', ')}.\nCheck that you don't have another web-server running.\nThe command "pkill node -9" can be used to kill all node processes.`,
    )
  }
}
