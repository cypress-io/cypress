import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import Debug from 'debug'

const debug = Debug('cypress:server:cloud:api')

export const logRequest = (req: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  debug(`${req.method} ${req.url}`)

  return req
}

export const logResponse = (res: AxiosResponse): AxiosResponse => {
  debug(`${res.config.method} ${res.config.url}: %d %s -> \n  %o`, res.status, res.statusText)

  return res
}

export const logResponseErr = (err: AxiosError): never => {
  debug(`${err.config?.method} ${err.config?.url}: %d -> \n  %o`, err.response?.statusText, err.response?.statusText, err.response?.data)
  throw err
}
