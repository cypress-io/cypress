import { CA } from './ca'
import { create as createServer, reset as resetServer } from './server'

export async function create (dir: string, port: number, options: any) {
  const ca = await CA.create(dir)

  const server = await createServer(ca, port, options)

  return server
}

export function reset () {
  return resetServer()
}
