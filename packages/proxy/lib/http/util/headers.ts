export const hasServiceWorkerHeader = (headers: Record<string, string | string[] | undefined>) => {
  return headers?.['service-worker'] === 'script' || headers?.['Service-Worker'] === 'script'
}
