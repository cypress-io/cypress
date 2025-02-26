import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'
import { httpAgent, httpsAgent } from '@packages/network/lib/agent'
import axios, { CreateAxiosDefaults, AxiosInstance } from 'axios'
import { _create } from '../../../../lib/cloud/api/cloud_request'
import app_config from '../../../../config/app.json'
import os from 'os'
import pkg from '@packages/root'
import { transformError } from '../../../../lib/cloud/api/axios_middleware/transform_error'

chai.use(sinonChai)

describe('CloudRequest', () => {
  beforeEach(() => {
    sinon.stub(axios, 'create').callThrough()
  })

  afterEach(() => {
    (axios.create as sinon.SinonStub).restore()
  })

  const getCreatedConfig = (): CreateAxiosDefaults => {
    const { firstCall: { args: [config] } } = (axios.create as sinon.SinonStub)

    return config
  }

  it('instantiates with network lib http/s agents', () => {
    _create()
    const cfg = getCreatedConfig()

    expect(cfg.httpAgent).to.eq(httpAgent)
    expect(cfg.httpsAgent).to.eq(httpsAgent)
  })

  describe('headers', () => {
    const platform = 'sunos'
    const version = '0.0.0'

    let versionStub

    beforeEach(() => {
      sinon.stub(os, 'platform').returns(platform)
      versionStub = sinon.stub(pkg, 'version').get(() => version)
    })

    afterEach(() => {
      (os.platform as sinon.SinonStub).restore()

      versionStub.restore()
    })

    it('sets exepcted platform, version, and user-agent headers', () => {
      _create()
      const cfg = getCreatedConfig()

      expect(cfg.headers).to.have.property('x-os-name', platform)
      expect(cfg.headers).to.have.property('x-cypress-version', version)
      expect(cfg.headers).to.have.property('User-Agent', 'cypress/0.0.0')
    })
  })

  describe('interceptors', () => {
    let stubbedAxiosInstance: Partial<sinon.SinonStubbedInstance<AxiosInstance>>

    beforeEach(() => {
      stubbedAxiosInstance = {
        interceptors: {
          request: {
            use: sinon.stub(),
            eject: sinon.stub(),
            clear: sinon.stub(),
          },
          response: {
            use: sinon.stub(),
            eject: sinon.stub(),
            clear: sinon.stub(),
          },
        },
      }

      ;(axios.create as sinon.SinonStub).returns(stubbedAxiosInstance)

      _create()
    })

    it('registers error transformation interceptor', () => {
      expect(stubbedAxiosInstance.interceptors?.response.use).to.have.been.calledWith(undefined, transformError)
    })
  })

  ;[undefined, 'development', 'test', 'staging', 'production'].forEach((env) => {
    describe(`base url for CYPRESS_CONFIG_ENV "${env}"`, () => {
      let prevEnv

      beforeEach(() => {
        prevEnv = process.env.CYPRESS_CONFIG_ENV
        if (env) {
          process.env.CYPRESS_CONFIG_ENV = env
        } else {
          delete process.env.CYPRESS_CONFIG_ENV
        }
      })

      afterEach(() => {
        if (prevEnv) {
          process.env.CYPRESS_CONFIG_ENV = prevEnv
        } else {
          delete process.env.CYPRESS_CONFIG_ENV
        }
      })

      it('sets to the value defined in app config', () => {
        _create()
        const cfg = getCreatedConfig()

        expect(cfg.baseURL).to.eq(app_config[env ?? 'development']?.api_url)
      })
    })

    describe(`base url for CYPRESS_INTERNAL_ENV "${env}"`, () => {
      let prevEnv

      beforeEach(() => {
        prevEnv = process.env.CYPRESS_INTERNAL_ENV
        if (env) {
          process.env.CYPRESS_INTERNAL_ENV = env
        } else {
          delete process.env.CYPRESS_INTERNAL_ENV
        }
      })

      afterEach(() => {
        if (prevEnv) {
          process.env.CYPRESS_INTERNAL_ENV = prevEnv
        } else {
          delete process.env.CYPRESS_INTERNAL_ENV
        }
      })

      it('sets to the value defined in app config', () => {
        _create()
        const cfg = getCreatedConfig()

        expect(cfg.baseURL).to.eq(app_config[env ?? 'development']?.api_url)
      })
    })
  })
})
