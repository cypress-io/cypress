import { MessagePort } from 'worker_threads'

export type RewriteRequest = {
  port: MessagePort
  isHtml?: boolean
  source: string
}

export type RewriteResponse = {
  threadMs: number
  code?: string
  error?: Error
}
