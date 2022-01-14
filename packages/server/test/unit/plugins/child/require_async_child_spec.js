const childProcess = require('child_process')
const path = require('path')

const PROJECT_ROOT = path.join(path.dirname(require.resolve('@tooling/system-tests/package.json')), 'projects/kill-child-process')

describe('require_async_child', () => {
  it('disconnects if the parent ipc is closed', (done) => {
    const child = childProcess.fork(path.join(__dirname, 'run_child_fixture'))

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
              configFile: path.join(PROJECT_ROOT, 'cypress.config.js'),
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
