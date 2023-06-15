process.title = 'Cypress: Protocol'

import { ProtocolManager } from './protocol'

process.on('disconnect', () => {
  process.exit()
})

const protocol = new ProtocolManager()

process.on('message', async ({ event, args, ack }: {event: string, args: [], ack: string}) => {
  // console.log('protocol:child:process:', event)

  if (event !== 'ack') {
    await protocol[event].apply(protocol, args)
  }

  process.send({ event: ack })
})
