module.exports =
  RemoteProxy:   new (require('./remote_proxy'))().handle
  RemoteInitial: new (require('./remote_initial'))().handle
  SpecProcessor: new (require('./spec_processor'))().handle
