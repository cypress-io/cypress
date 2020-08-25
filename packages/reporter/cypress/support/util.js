const _ = Cypress._

const sendLog = (runner, log, event) => {
  const defaultLog = {
    event: false,
    hookName: 'test',
    id: _.uniqueId('l'),
    instrument: 'command',
    renderProps: {},
    state: 'passed',
    testId: 'r3',
    type: 'parent',
    url: 'http://example.com',
  }

  runner.emit(event, _.extend(defaultLog, log))
}

export const updateLog = (runner, log) => {
  sendLog(runner, log, 'reporter:log:state:changed')
}

export const addLog = (runner, log) => {
  sendLog(runner, log, 'reporter:log:add')
}

export const addLogs = (runner, logs) => {
  _.forEach(logs, addLog.bind(null, runner))
}
