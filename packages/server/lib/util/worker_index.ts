export const WORKER_INDEX_ENV = 'CYPRESS_WORKER_INDEX'

// the coordinator is worker 0
export const isSpawnedWorker = () => (process.env[WORKER_INDEX_ENV] ?? '0') !== '0'
