import { MessagePort } from 'worker_threads'

export type RewriteRequest = {
  url: string // used for resolving references in sourcemaps
  port: MessagePort
  isHtml?: boolean
  source: string
}

export type RewriteResponse = {
  threadMs: number
  code?: string
  error?: Error
}
