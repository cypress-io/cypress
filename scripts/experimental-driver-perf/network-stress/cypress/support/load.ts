export type Load = {
  // How many requests the page makes
  count: number
  // Response size, or request size for an upload
  bytes: number
  // Requests in flight at once
  concurrency?: number
  kind?: 'json' | 'text'
  transport?: 'fetch' | 'xhr'
  upload?: boolean
}

export const KB = 1024

export const MB = 1024 * KB

// The heaviest loads take a while under either driver, and these specs measure how long,
// so a load only fails if it never finishes
export const LOAD_TIMEOUT = 180_000

export const apiRoute = (load: Load) => {
  return load.upload ? '/api/upload*' : `/api/${load.kind ?? 'json'}*`
}

export const visitLoad = (load: Load) => {
  const params = new URLSearchParams({
    count: String(load.count),
    bytes: String(load.bytes),
    concurrency: String(load.concurrency ?? 6),
    kind: load.kind ?? 'json',
    transport: load.transport ?? 'fetch',
  })

  if (load.upload) {
    params.set('upload', '')
  }

  cy.visit(`/?${params}`)
}

export const runLoad = (load: Load) => {
  cy.get('#start').click()
  cy.get('#done', { timeout: LOAD_TIMEOUT }).should('have.text', String(load.count))
  cy.get('#errors').should('have.text', '0')
}
