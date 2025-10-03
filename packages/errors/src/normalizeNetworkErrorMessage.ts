const AXIOS_ERROR_NAME = 'AxiosError'

export const normalizeNetworkErrorMessage = (error: Error): string => {
  return error.name === AXIOS_ERROR_NAME ? error.message : `${error.name}: ${error.message}`
}
