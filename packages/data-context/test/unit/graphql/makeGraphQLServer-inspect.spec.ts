import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'
import supertest from 'supertest'

// Redirect descriptor writes into tmpdir, matching ServersActions.spec.ts.
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-gql-'))
const runningPath = path.join(tmpRoot, 'running')

jest.mock('../../../src/util/app-data-paths', () => {
  const pathMod = require('path')

  return {
    runningDir: () => runningPath,
    descriptorFilePath: (pid: number) => pathMod.join(runningPath, `${pid}.json`),
  }
})

// eslint-disable-next-line import/first
import { clearCtx, setCtx } from '../../../src'
// eslint-disable-next-line import/first
import { makeGraphQLServer } from '../../../graphql/makeGraphQLServer'
// eslint-disable-next-line import/first
import { createTestDataContext } from '../helper'

describe('makeGraphQLServer — inspect mount + origin middleware', () => {
  let port: number
  let token: string
  let baseURL: string

  beforeAll(async () => {
    const ctx = createTestDataContext('open')

    setCtx(ctx)

    port = await makeGraphQLServer()
    token = ctx.coreData.servers.inspect!.token
    baseURL = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    // `clearCtx()` destroys the GQL server via server-destroy.
    try {
      await clearCtx()
    } catch {
      // best-effort cleanup
    }
  })

  const typenameQuery = { query: '{ __typename }' }

  describe('/__launchpad/graphql origin allow-list', () => {
    it('allows requests with no Origin header', async () => {
      const res = await supertest(baseURL)
      .post('/__launchpad/graphql')
      .send(typenameQuery)

      expect(res.status).toBe(200)
      expect(res.body.data.__typename).toBe('Query')
    })

    it('rejects requests from a foreign Origin with 403', async () => {
      const res = await supertest(baseURL)
      .post('/__launchpad/graphql')
      .set('Origin', 'http://evil.example')
      .send(typenameQuery)

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ error: 'Origin not allowed' })
    })

    it('allows requests from http://127.0.0.1:{port}', async () => {
      const res = await supertest(baseURL)
      .post('/__launchpad/graphql')
      .set('Origin', `http://127.0.0.1:${port}`)
      .send(typenameQuery)

      expect(res.status).toBe(200)
      expect(res.body.data.__typename).toBe('Query')
    })

    it('allows requests from http://localhost:{port}', async () => {
      const res = await supertest(baseURL)
      .post('/__launchpad/graphql')
      .set('Origin', `http://localhost:${port}`)
      .send(typenameQuery)

      expect(res.status).toBe(200)
      expect(res.body.data.__typename).toBe('Query')
    })

    it('allows requests with Origin: null', async () => {
      const res = await supertest(baseURL)
      .post('/__launchpad/graphql')
      .set('Origin', 'null')
      .send(typenameQuery)

      expect(res.status).toBe(200)
      expect(res.body.data.__typename).toBe('Query')
    })
  })

  describe('/__inspect/graphql token + origin middleware', () => {
    it('allows a request with the correct token and no Origin', async () => {
      const res = await supertest(baseURL)
      .post('/__inspect/graphql')
      .set('X-Cypress-Inspect-Token', token)
      .send(typenameQuery)

      expect(res.status).toBe(200)
      expect(res.body.data.__typename).toBe('Query')
    })

    it('rejects with 403 when Origin is foreign (origin check runs before token)', async () => {
      const res = await supertest(baseURL)
      .post('/__inspect/graphql')
      .set('Origin', 'http://evil.example')
      .set('X-Cypress-Inspect-Token', token)
      .send(typenameQuery)

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ error: 'Origin not allowed' })
    })

    it('rejects with 401 when no token is provided', async () => {
      const res = await supertest(baseURL)
      .post('/__inspect/graphql')
      .send(typenameQuery)

      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: 'Invalid inspect token' })
    })

    it('rejects with 401 when a wrong token is provided', async () => {
      const res = await supertest(baseURL)
      .post('/__inspect/graphql')
      .set('X-Cypress-Inspect-Token', 'nope')
      .send(typenameQuery)

      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: 'Invalid inspect token' })
    })

    it('returns Query typename when the correct token is provided', async () => {
      const res = await supertest(baseURL)
      .post('/__inspect/graphql')
      .set('X-Cypress-Inspect-Token', token)
      .send(typenameQuery)

      expect(res.status).toBe(200)
      expect(res.body.data.__typename).toBe('Query')
    })
  })
})
