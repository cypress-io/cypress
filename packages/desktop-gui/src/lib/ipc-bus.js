import _ from 'lodash'
import Promise from 'bluebird'

let msgs = {}

const addMsg = (id, event, fn) => {
  msgs[id] = {
    event,
    fn,
  }
}

const nullifyUnserializableValues = (obj) => {
  // nullify values that cannot be cloned
  // https://github.com/cypress-io/cypress/issues/6750
  return _.cloneDeepWith(obj, (val) => {
    if (_.isFunction(val) || _.isElement(val)) {
      return null
    }
  })
}

const removeMsgsByEvent = (event) => {
  msgs = _.omitBy(msgs, (msg) => {
    return msg.event === event
  })
}

const removeMsgById = (id) => {
  msgs = _.omit(msgs, `${id}`)
}

const createIpc = () => {
  console.warn('Missing "ipc". Polyfilling in development mode.') // eslint-disable-line no-console

  return {
    on () {},
    send () {},
  }
}

const ipc = window.ipc != null ? window.ipc : (window.ipc = createIpc())

ipc.on('response', (event, obj = {}) => {
  const { id, __error, data } = obj
  const msg = msgs[id]

  // standard node callback implementation
  if (msg) {
    msg.fn(__error, data)
  }
})

const ipcBus = (...args) => {
  if (args.length === 0) {
    return msgs
  }

  // our ipc interface can either be a standard
  // node callback or a promise interface
  // we support both because oftentimes we want
  // to our async request to be resolved with a
  // singular value, and other times we want it
  // to be called multiple times akin to a stream

  // generate an id
  const id = Math.random()

  // first arg is the event
  const event = args[0]

  // get the last argument
  const lastArg = args.pop()

  let fn

  // enable the last arg to be a function
  // which changes this interface from being
  // a promise to just calling the callback
  // function directly
  if (lastArg && _.isFunction(lastArg)) {
    fn = () => {
      return addMsg(id, event, lastArg)
    }
  } else {
    // push it back onto the array
    args.push(lastArg)

    fn = () => {
      // return a promise interface and at the
      // same time store this callback function
      // by id in msgs
      return new Promise((resolve, reject) => {
        addMsg(id, event, (err, data) => {
          // cleanup messages using promise interface
          // automatically
          removeMsgById(id)

          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })
    }
  }

  args = nullifyUnserializableValues(args)

  // pass in request, id, and remaining args
  ipc.send(...['request', id].concat(args))

  return fn()
}

ipcBus.offById = removeMsgById
ipcBus.off = removeMsgsByEvent

export default ipcBus
