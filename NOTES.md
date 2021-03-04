* New `RouteMatcher` option: `middleware: boolean`
    * With `middleware: true`, will be called in the order they are defined and chained.
    * With `middleware: true`, only dynamic handlers are supported - makes no sense to support `cy.intercept({ middleware: true }, staticResponse)`
    * BREAKING CHANGE: `middleware: falsy` handlers will not be chained. For any given request, the most-recently-defined handler is always the one used.
* `req` is now an `EventEmitter` (regardless of `middleware` setting)
* Events on `req`:
    * `request - ()` - Request will be sent outgoing. If the response has already been fulfilled by `req.reply`, this event will not be emitted.
    * `before-response - (res)` - Response was received. Emitted before the response handler is run.
    * `response - (res)` - Response will be sent to the browser. If a response has been supplied via `res.send`, this event will not be emitted.