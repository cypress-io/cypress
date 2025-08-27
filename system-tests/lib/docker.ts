import type { SpawnerResult, Spawner } from './system-tests'
import Docker from 'dockerode'
import stream from 'stream'
import EventEmitter from 'events'
import path from 'path'
import { promises as fs } from 'fs'
import execa from 'execa'
import Fixtures from './fixtures'
import { nock } from './spec_helper'

let docker: Docker | null = null

const getDocker = () => {
  return docker || (docker = new Docker())
}

const log = (...args) => {
  console.error('🐋', ...args)
}

class DockerProcess extends EventEmitter implements SpawnerResult {
  stdout = new stream.PassThrough()
  stderr = new stream.PassThrough()

  constructor (private dockerImage: string) {
    super()
  }

  pull () {
    return new Promise<void>((resolve, reject) => {
      log('Pulling image', this.dockerImage)
      getDocker().pull(this.dockerImage, null, (err, stream) => {
        if (err) return reject(err)

        const onFinished = (err) => {
          log('Pull complete', { err })
          if (err) return reject(err)

          resolve()
        }

        const onProgress = (event) => {
          log('Pull progress', JSON.stringify(event))
        }

        docker.modem.followProgress(stream, onFinished, onProgress)
      }, null)
    })
  }

  run (opts: {
    cmd: string
    args: string[]
    env: Record<string, string>
  }) {
    const containerCreateEnv = []

    for (const k in opts.env) {
      // skip problematic env vars that we don't wanna preserve from `process.env`
      if (
        ['DISPLAY', 'USER', 'HOME', 'USERNAME', 'PATH'].includes(k)
        || k.startsWith('npm_')
      ) {
        continue
      }

      containerCreateEnv.push([k, opts.env[k]].join('='))
    }

    log('Running image', this.dockerImage)

    const cmd = [opts.cmd, ...opts.args]

    log('Running cmd', cmd.join(' '))

    getDocker().run(
      this.dockerImage,
      cmd,
      [this.stdout, this.stderr],
      // option docs: https://docs.docker.com/engine/api/v1.37/#operation/ContainerCreate
      {
        AutoRemove: true,
        Entrypoint: 'bash',
        Tty: false, // so we can use stdout and stderr
        Env: containerCreateEnv,
        Privileged: true,
        Binds: [
          [path.join(__dirname, '..', '..'), '/cypress'],
          // map tmpDir to the same absolute path on the container to make it easier to reason about paths in tests
          [Fixtures.cyTmpDir, Fixtures.cyTmpDir],
        ].map((a) => a.join(':')),
      },
      // option docs: https://docs.docker.com/engine/api/v1.37/#operation/ContainerStart
      {},
      (err, data) => {
        if (err) {
          log('Docker run errored:', { err, data })

          return this.emit('error', err)
        }

        log('Docker run exited:', { err, data })
        this.emit('exit', data.StatusCode)
      },
    )
  }

  kill (): boolean {
    throw new Error('.kill not implemented for DockerProcess.')
  }
}

const checkBuiltBinary = async () => {
  try {
    await fs.stat(path.join(__dirname, '..', '..', 'cypress.zip'))
  } catch (err) {
    throw new Error('Expected built cypress.zip at project root. Run `yarn binary-build`, `yarn binary-package`, and `yarn binary-zip`.')
  }

  try {
    await fs.stat(path.join(__dirname, '..', '..', 'cli/build/package.json'))
  } catch (err) {
    throw new Error('Expected built CLI in /cli/build. Run `yarn build` in `cli`.')
  }
}

export const dockerSpawner: Spawner = async (cmd, args, env, options) => {
  await checkBuiltBinary()

  const projectPath = Fixtures.projectPath(options.project)

  log('Running chmod 0777 on', projectPath, 'to avoid Docker permissions issues.')
  await execa('chmod', `-R 0777 ${projectPath}`.split(' '))

  const proc = new DockerProcess(options.dockerImage)

  nock.enableNetConnect('localhost')

  await proc.pull()

  if (options.withBinary) {
    args = [cmd, ...args]
    cmd = `/cypress/system-tests/scripts/bootstrap-docker-container.sh`
  } else {
    throw new Error('Docker testing is only supported with built binaries (withBinary: true)')
  }

  env = {
    ...env,
    TEST_PROJECT_DIR: projectPath,
    REPO_DIR: '/cypress',
  }

  proc.run({
    cmd,
    args,
    env,
  })

  return proc
}
