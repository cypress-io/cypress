import '../../spec_helper'

import { ArtifactQueue } from '../../../lib/util/artifact_queue'

const deferred = <T = void>() => {
  let resolve!: (value: T) => void
  let reject!: (err: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('lib/util/artifact_queue', () => {
  let queue: ArtifactQueue

  beforeEach(() => {
    queue = new ArtifactQueue()
  })

  context('.enqueue', () => {
    it('starts the task immediately and drains once it completes', async () => {
      let ran = false

      queue.enqueue('task', async () => {
        ran = true
      })

      await queue.drain()

      expect(ran).to.be.true
      expect(queue.hasPendingTasks).to.be.false
    })

    it('does not surface task failures as unhandled rejections or drain errors', async () => {
      queue.enqueue('failing task', async () => {
        throw new Error('task failed')
      })

      await queue.drain()

      expect(queue.hasPendingTasks).to.be.false
    })

    it('runs tasks enqueued by a draining task before drain resolves', async () => {
      const order: string[] = []

      queue.enqueue('first', async () => {
        order.push('first')
        queue.enqueue('follow-up', async () => {
          order.push('follow-up')
        })
      })

      await queue.drain()

      expect(order).to.deep.eq(['first', 'follow-up'])
    })
  })

  context('.enqueueVideoCompression', () => {
    it('runs compression tasks one at a time, in order', async () => {
      const order: string[] = []
      const first = deferred()

      queue.enqueueVideoCompression('compression 1', async () => {
        order.push('1 started')
        await first.promise
        order.push('1 finished')
      })

      queue.enqueueVideoCompression('compression 2', async () => {
        order.push('2 started')
      })

      // let any (incorrectly) concurrent task start
      await new Promise((resolve) => setImmediate(resolve))

      expect(order).to.deep.eq(['1 started'])

      first.resolve()
      await queue.drain()

      expect(order).to.deep.eq(['1 started', '1 finished', '2 started'])
    })

    it('still runs the next compression when the previous one fails', async () => {
      const order: string[] = []

      queue.enqueueVideoCompression('compression 1', async () => {
        throw new Error('ffmpeg failed')
      })

      queue.enqueueVideoCompression('compression 2', async () => {
        order.push('2 ran')
      })

      await queue.drain()

      expect(order).to.deep.eq(['2 ran'])
    })
  })

  context('.drain', () => {
    it('invokes deferred output callbacks in enqueue order', async () => {
      const output: string[] = []
      const blocker = deferred()

      queue.enqueue('slow task', async () => {
        await blocker.promise

        return () => output.push('slow task output')
      })

      queue.enqueue('fast task', async () => {
        return () => output.push('fast task output')
      })

      blocker.resolve()
      await queue.drain()

      expect(output).to.deep.eq(['slow task output', 'fast task output'])
    })
  })

  context('.hasPendingTasks', () => {
    it('is true only while a task is still running', async () => {
      const blocker = deferred()

      const task = queue.enqueue('task', async () => {
        await blocker.promise
      })

      expect(queue.hasPendingTasks).to.be.true

      blocker.resolve()
      await task

      expect(queue.hasPendingTasks).to.be.false
    })
  })
})
