import { MessagePort } from 'worker_threads'

export type RewriteRequest = {
  port: MessagePort
  isHtml?: boolean
  source: string
}

export type RewriteResponse = {
  code?: string
  error?: Error
}
