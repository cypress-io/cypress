import _snapshot from 'snap-shot-it'
import mockfs from 'mock-fs'

// Type as any to avoid strict typing issues with rest parameters
const snapshotAny: any = _snapshot

const snapshot = (...args: any[]): void => {
  mockfs.restore()
  snapshotAny(...args)
}

export default snapshot
