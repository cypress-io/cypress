import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from 'axios'
import Debug from 'debug'

const debug = Debug('cypress:server:cloud:api')

const logRequest = (req: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  debug(`${req.method} ${req.url}`)

  return req
}

const logResponse = (res: AxiosResponse): AxiosResponse => {
  debug(`${res.config.method} ${res.config.url} Success: %d %s -> \n  Response: %o`, res.status, res.statusText, res.data)

  return res
}

const logResponseErr = (err: AxiosError): never => {
  debug(`${err.config?.method} ${err.config?.url} Error: %s -> \n  Response: %o`, err.response?.statusText || err.code, err.response?.data)
  throw err
}

export const installLogging = (axios: AxiosInstance) => {
  axios.interceptors.request.use(logRequest)
  axios.interceptors.response.use(logResponse, logResponseErr)
}
