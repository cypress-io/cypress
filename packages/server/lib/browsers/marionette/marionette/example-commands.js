/* global Marionette */
(function(module, ns) {
  'use strict';

  function deepmerge(d) {
    for (var i = 1; i < arguments.length; ++i) {
      var o = arguments[i];
      for (var k in o) {
        var v = o[k];
        if (typeof v == 'object') {
          d[k] = deepmerge(d[k], v);
        } else {
          if (Array.isArray(d)) {
            if (d.indexOf(v) < 0) {
              d.push(v);
            }
          } else {
            d[k] = v;
          }
        }
      }
    }
    return d;
  }

  function cmd(defaults) {
    return function(override) {
      if (typeof(override) === 'undefined') {
        override = {};
      }
      return deepmerge(defaults, override);
    };
  }

  module.exports = {
    connectProto1: cmd({from: 'root', applicationType: 'gecko', traits: []}),
    connectProto2: cmd({applicationType: 'gecko', marionetteProtocol: 2}),

    getMarionetteID: cmd({type: 'getMarionetteID'}),
    getMarionetteIDResponse: cmd({from: 'root', id: 'con1'}),

    newSession: cmd({type: 'newSession'}),
    newSessionResponseProto1: cmd({
      from: 'actor',
      value: 'b2g-7',
    }),
    newSessionResponseProto2: cmd({
      sessionId: '{2dddca75-7f78-415f-a7de-63eb2bc9412b}',
      capabilities: {browserName: 'firefox'},
    }),

    getWindow: cmd({name: 'getWindow'}),
    getWindowResponse: cmd({value: '3-b2g'}),

    getWindows: cmd({name: 'getWindows'}),
    getWindowsResponseProto1: cmd({from: 'actor', value: ['1-b2g', '2-b2g']}),
    getWindowsResponseProto2: cmd(['1-b2g', '2-b2g']),

    getUrl: cmd({name: 'getUrl'}),
    getUrlResponse: cmd({value: 'http://localhost/'}),

    getLogsResponseProto1: cmd({
      from: 'actor',
      value: [
        ['debug', 'wow', 'Fri Apr 27 2012 11:00:32 GMT-0700 (PDT)'],
      ],
    }),
    getLogsResponseProto2: cmd([
      ['debug', 'wow', 'Fri Apr 27 2012 11:00:32 GMT-0700 (PDT)'],
    ]),

    screenshotResponse: cmd({
      value: 'data:image/png;base64,iVBOgoAAAANSUhEUgAAAUAAAAHMCAYAAACk4nEJA',
    }),

    elementEqualsResponse: cmd({value: false}),

    findElementResponse: cmd(
        {value: {ELEMENT: '{8056e6f7-2213-41d4-9db6-ad77ac7a96d3}'}}),
    findElementsResponseProto1: cmd({
      from: 'actor',
      value: [
        {ELEMENT: '{46982c9e-bb0c-486e-a514-d1cf20b42641}'},
        {ELEMENT: '{585e70ee-e088-43cc-9b07-a4b078c1b8db}'},
      ],
    }),
    findElementsResponseProto2: cmd([
      {ELEMENT: '{46982c9e-bb0c-486e-a514-d1cf20b42641}'},
      {ELEMENT: '{585e70ee-e088-43cc-9b07-a4b078c1b8db}'},
    ]),

    numberError: cmd({
      from: 'actor',
      error: {
        message: 'you fail',
        status: 7,
        stacktrace: 'fail@url\nother:300',
      },
    }),
    stringError: cmd({
      from: 'actor',
      error: {
        message: 'you fail',
        status: 'no such element',
        stacktrace: 'fail@url\nother:300',
      },
    }),
    modernError: cmd({
      error: 'no such element',
      message: 'you fail',
      stacktrace: 'fail@url\nother:300',
    }),

    //valueProto1: cmd({from: 'actor', value: 'zomg'}),
    value: cmd({value: 'zomg'}),

    capabilities: cmd({capabilities: {browserName: 'firefox'}}),

    //okProto1: cmd({from: 'actor', ok: true}),
    ok: cmd({}),
  };

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('example-commands'), Marionette] :
    [module, require('./marionette')]
));
