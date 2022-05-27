import detectPort from 'detect-port'
import { exit } from '../utils/exitUtil'

export async function friendlyStartupWarnings () {
  const ALL_SERVER_PORTS_USED = [3000, 4000, 8484, 1234]
  const unavaiablePorts: number[] = []

  await Promise.all(
    ALL_SERVER_PORTS_USED.map(async (port) => {
      if (port !== (await detectPort(port))) {
        unavaiablePorts.push(port)
      }
    }),
  )

  if (unavaiablePorts.length > 0) {
    exit(
      `The following ports needed by Cypress are already in use: ${unavaiablePorts.join(', ')}.\nCheck that you don't have another web-server running.\nThe command "pkill node -9" can be used to kill all node processes.`,
    )
  }
}
