/**
 * Every runnable goes through these four stages
 * Processing -> [Passed, Failed, Pending]
 */
export type RunnableState = 'passed' | 'failed' | 'pending' | 'processing'
