import { isObject } from 'lodash'
import axios, { AxiosError, AxiosInstance } from 'axios'

declare module 'axios' {
  export interface AxiosError {
    isApiError?: boolean
  }
}

export const transformError = (err: AxiosError | Error & { error?: any, statusCode: number, isApiError?: boolean }): never => {
  const { data, status } = axios.isAxiosError(err) ?
    { data: err.response?.data, status: err.status } :
    { data: err.error, status: err.statusCode }

  if (isObject(data)) {
    const body = JSON.stringify(data, null, 2)

    err.message = [status, body].join('\n\n')
  }

  err.isApiError = true

  throw err
}

export const installErrorTransform = (axios: AxiosInstance) => {
  axios.interceptors.response.use(undefined, transformError)
}
