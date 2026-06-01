import childProcess from 'child_process'
import path from 'path'

const PROJECT_ROOT = path.join(path.dirname(require.resolve('@tooling/system-tests/package.json')), 'projects/kill-child-process')
// With require_async_child being converted to TypeScript, we need to use the .ts extension to ensure the correct file is loaded.
// This is also a true integration test of tsx and running the require_async_child file (though this lives in the unit test directory)
const REQUIRE_ASYNC_CHILD_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child.ts')
const CONFIG_FILE = path.join(PROJECT_ROOT, 'cypress.config.js')

describe('require_async_child', () => {
  it('exits with code 0 when the parent closes the IPC channel (disconnect handler)', function (done) {
    this.timeout(15_000)

    const child = childProcess.fork(REQUIRE_ASYNC_CHILD_PATH, ['--projectRoot', PROJECT_ROOT, '--file', CONFIG_FILE], {
      env: {
        ...process.env,
        // Match real config-child loading (see run_child_fixture / ProjectConfigIpc)
        NODE_OPTIONS: '--import tsx',
      },
    })

    let settled = false
    const finish = (err) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(watchdog)
      done(err)
    }

    const watchdog = setTimeout(() => {
      child.kill('SIGKILL')
      finish(new Error('timed out waiting for require_async_child to exit after IPC disconnect'))
    }, 12_000)

    child.on('exit', (code, signal) => {
      if (settled) {
        return
      }

      if (signal) {
        return finish(new Error(`Expected exit without signal after graceful IPC disconnect, got signal ${signal}`))
      }

      if (code !== 0) {
        return finish(new Error(`Expected exit code 0 after disconnect teardown (process.exit()), got ${code}`))
      }

      finish()
    })

    child.on('error', finish)

    child.on('message', (msg) => {
      if (msg?.event === 'ready') {
        // Closing the IPC channel triggers `process.on('disconnect')` in require_async_child,
        // which must call process.exit() so the child cannot run orphaned.
        child.disconnect()
      }
    })
  })

  it('disconnects if the parent ipc is closed', (done) => {
    const child = childProcess.fork(path.join(__dirname, 'run_child_fixture.ts'), {
      env: {
        // Match real config-child loading
        NODE_OPTIONS: '--import tsx',
      },
    })

    let childPid

    child.on('message', (msg) => {
      if (msg.childPid) {
        childPid = msg.childPid
        child.send({ msg: 'toChild', data: { event: 'loadConfig', args: [] } })
      } else if (msg.childMessage.event === 'loadConfig:reply') {
        child.send({
          msg: 'toChild',
          data: {
            event: 'setupTestingType',
            args: ['e2e', {
              ...JSON.parse(msg.childMessage.args[0].initialConfig),
              configFile: CONFIG_FILE,
              projectRoot: PROJECT_ROOT,
              testingType: 'e2e',
              env: {},
            }],
          },
        })
      } else if (msg.childMessage.event === 'setupTestingType:reply') {
        setTimeout(() => {
          // Kill the fixture process, which should signal that the child should also exit
          child.kill()
        }, 100)
      }
    })

    child.on('disconnect', () => {
      setTimeout(() => {
        try {
          process.kill(Number(childPid), 0)
          done(new Error('Child is running'))
        } catch (e) {
          if (e.code === 'EPERM' || e.code === 'ESRCH') {
            return done()
          }

          done(e)
        }
      }, 1000)
    })

    child.send({ msg: 'spawn', data: { projectRoot: PROJECT_ROOT } })
  })
})
