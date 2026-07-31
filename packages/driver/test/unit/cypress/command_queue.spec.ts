/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { CommandQueue } from '../../../src/cypress/command_queue'
import $Command from '../../../src/cypress/command'

// Minimal cy.state() implementation: get with one arg, set with two, merge
// with an object. This is all cleanSubjects() touches on `cy`.
const makeState = () => {
  const store: Record<string, any> = {}

  return function state (key: any, value?: any) {
    if (typeof key === 'object') {
      Object.assign(store, key)

      return
    }

    if (arguments.length > 1) {
      store[key] = value

      return value
    }

    return store[key]
  }
}

const makeQueue = (isInteractive: boolean) => {
  (global as any).Cypress = {
    config: (key: string) => (key === 'isInteractive' ? isInteractive : undefined),
  }

  const cy: any = { state: makeState(), isCy: () => false }
  const queue = new CommandQueue(makeState(), {} as any, cy)

  return { queue, cy }
}

// Build `count` commands, each in its own single-command chain by default, and
// register their subjects in cy.state('subjects') the way the real queue does.
const fillQueue = (queue: CommandQueue, cy: any, count: number, chainerIdFor = (i: number) => `ch-${i}`) => {
  const subjects: Record<string, any> = {}

  for (let i = 0; i < count; i++) {
    const chainerId = chainerIdFor(i)
    const subject = { i }

    queue.add($Command.create({ chainerId, subject, fn: () => {} }))
    subjects[chainerId] = [subject]
  }

  cy.state('subjects', subjects)
}

describe('src/cypress/command_queue - cleanSubjects', () => {
  afterEach(() => {
    delete (global as any).Cypress
  })

  describe('in run mode', () => {
    let queue: CommandQueue
    let cy: any

    beforeEach(() => {
      ({ queue, cy } = makeQueue(false))
    })

    it('releases finished subjects that have aged past the trailing window', () => {
      fillQueue(queue, cy, 300)
      queue.index = 300

      queue.cleanSubjects()

      // boundary = 300 - 100 (trailing window) = 200
      for (let i = 0; i < 200; i++) {
        expect(queue.at(i).get('subject'), `command ${i} subject`).to.be.null
        expect(queue.at(i).get('fn'), `command ${i} fn`).to.be.null
      }

      // the trailing window is always retained
      for (let i = 200; i < 300; i++) {
        expect(queue.at(i).get('subject'), `command ${i} subject`).to.not.be.null
      }
    })

    it('prunes state("subjects") down to the chainers still reachable', () => {
      fillQueue(queue, cy, 300)
      queue.index = 300

      queue.cleanSubjects()

      const remaining = Object.keys(cy.state('subjects'))

      expect(remaining).to.have.length(100)
      expect(remaining).to.include('ch-200')
      expect(remaining).to.include('ch-299')
      expect(remaining).to.not.include('ch-0')
      expect(remaining).to.not.include('ch-199')
    })

    it('preserves subjects for chainers referenced by upcoming commands', () => {
      // one long chain occupies the whole queue; its subject is still reachable
      fillQueue(queue, cy, 300, () => 'ch-shared')
      queue.index = 300

      queue.cleanSubjects()

      for (let i = 0; i < 300; i++) {
        expect(queue.at(i).get('subject'), `command ${i} subject`).to.not.be.null
      }

      expect(Object.keys(cy.state('subjects'))).to.eql(['ch-shared'])
    })

    it('does nothing until enough commands have moved behind the window', () => {
      // boundary (150 - 100 = 50) is below the batch threshold of 100
      fillQueue(queue, cy, 150)
      queue.index = 150

      queue.cleanSubjects()

      for (let i = 0; i < 150; i++) {
        expect(queue.at(i).get('subject'), `command ${i} subject`).to.not.be.null
      }

      expect(Object.keys(cy.state('subjects'))).to.have.length(150)
    })

    it('advances incrementally across successive sweeps without re-scanning', () => {
      fillQueue(queue, cy, 500)

      queue.index = 300
      queue.cleanSubjects()
      expect((queue as any).cleanedSubjectsIndex).to.eq(200)

      queue.index = 500
      queue.cleanSubjects()
      expect((queue as any).cleanedSubjectsIndex).to.eq(400)

      for (let i = 0; i < 400; i++) {
        expect(queue.at(i).get('subject'), `command ${i} subject`).to.be.null
      }
    })

    it('resets its cursor when the queue is cleared between tests', () => {
      fillQueue(queue, cy, 300)
      queue.index = 300
      queue.cleanSubjects()
      expect((queue as any).cleanedSubjectsIndex).to.eq(200)

      queue.clear()

      expect((queue as any).cleanedSubjectsIndex).to.eq(0)
      expect(queue.length).to.eq(0)
    })
  })

  describe('in interactive mode', () => {
    it('never releases subjects, preserving command-log time travel', () => {
      const { queue, cy } = makeQueue(true)

      fillQueue(queue, cy, 300)
      queue.index = 300

      queue.cleanSubjects()

      for (let i = 0; i < 300; i++) {
        expect(queue.at(i).get('subject'), `command ${i} subject`).to.not.be.null
      }

      expect(Object.keys(cy.state('subjects'))).to.have.length(300)
    })
  })
})
