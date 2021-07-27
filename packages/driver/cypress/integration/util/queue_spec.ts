import { create, Queueable } from '../../../src/util/queue'

const createQueueable = (data = {}): Queueable => {
  return {
    data,
    run () {},
  }
}

const ids = (queueables) => queueables.map((q) => q.id)

describe('src/util/queue', () => {
  let queue

  beforeEach(() => {
    queue = create([
      createQueueable({ id: '1' }),
      createQueueable({ id: '2' }),
      createQueueable({ id: '3' }),
    ])
  })

  context('#get', () => {
    it('returns list of queueable data', () => {
      const queueables = queue.get()

      expect(ids(queueables)).to.eql(['1', '2', '3'])
    })
  })

  context('#add', () => {
    it('adds queueable to end of queue', () => {
      queue.add(createQueueable({ id: '4' }))
      queue.add(createQueueable({ id: '5' }))

      expect(ids(queue.get())).to.eql(['1', '2', '3', '4', '5'])
    })
  })

  context('#insert', () => {
    it('inserts queueable into queue at index', () => {
      queue.insert(1, createQueueable({ id: '4' }))

      expect(ids(queue.get())).to.eql(['1', '4', '2', '3'])
    })

    it('returns the queueable', () => {
      const queueable = createQueueable({ id: '4' })
      const result = queue.insert(1, queueable)

      expect(result).to.equal(queueable.data)
    })

    it('works with start boundary index', () => {
      queue.insert(0, createQueueable({ id: '4' }))

      expect(ids(queue.get())).to.eql(['4', '1', '2', '3'])
    })

    it('works with end boundary index', () => {
      queue.insert(3, createQueueable({ id: '4' }))

      expect(ids(queue.get())).to.eql(['1', '2', '3', '4'])
    })

    it('throws when index is negative', () => {
      expect(() => {
        queue.insert(-1, createQueueable({ id: '4' }))
      })
      .to.throw('queue.insert must be called with a valid index - the index (-1) is out of bounds')
    })

    it('throws when index is out of bounds', () => {
      expect(() => {
        queue.insert(4, createQueueable({ id: '4' }))
      })
      .to.throw('queue.insert must be called with a valid index - the index (4) is out of bounds')
    })
  })

  context('#slice', () => {
    it('returns queueables data from the index', () => {
      const queueables = queue.slice(1)

      expect(ids(queueables)).to.eql(['2', '3'])
    })
  })

  context('#at', () => {
    it('returns queueable data at index', () => {
      const queueable = queue.at(1)

      expect(queueable.id).to.equal('2')
    })
  })

  context('#clear', () => {
    it('removes all queueables from queue', () => {
      queue.clear()

      expect(queue.get().length).to.equal(0)
    })
  })

  context('#reset', () => {
    it('resets queue.stopped to false', () => {
      queue.stop()
      queue.reset()

      expect(queue.stopped).to.false
    })
  })

  context('#stop', () => {
    it('sets queue.stopped to true', () => {
      queue.stop()

      expect(queue.stopped).to.true
    })
  })

  context('.length', () => {
    it('is the number of queueables in the queue', () => {
      expect(queue.length).to.equal(3)
      queue.insert(0, createQueueable({ id: '4' }))
      expect(queue.length).to.equal(4)
    })
  })

  context('.stopped', () => {
    it('is true when queue is stopped', () => {
      queue.stop()

      expect(queue.stopped).to.true
    })

    it('is false when queue is not stopped', () => {
      expect(queue.stopped).to.false
    })
  })
})
