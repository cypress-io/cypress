---
title: Catalog of Events
comments: false
---

Here's the complete list of Cypress events emitted.

You can use the accompanying {% url "`on`" on %}, {% url "`once`" once %}, {% url "`removeListener`" removelistener %} and {% url "`removeAllListeners`" removealllisteners %} methods on either the `Cypress` or `cy` (automatically unbound between tests) object to work with these events.

Event | Args | Description
----- | ---- | ----------
`"test:before:run"` | log, runnable |
`"test:before:run:async"` | log, runnable |
`"runnable:after:run:async"` | log, runnable |
`"test:after:run"` | log, runnable |
`"test:set:state"` | log, function |
`"log:added"` | command, event | When log added to Command Log
`"log:changed"` | command, event |
`"fail"` | error, runnable | When test has failed
`"stability:changed"` | bool, eventName |
`"paused"` | | When test is paused using {% url `cy.pause()` pause %}
`"canceled"` | |
`"visit:failed"` | |
`"viewport:changed"` | viewport sizes, function |
`"app:scrolled"` | subject, subject type | When app under test is scrolled
`"command:enqueued"` | command |
`"command:start"` | command |
`"command:end"` | command |
`"command:retry"` | command | When command is retried
`"command:queue:before:end"` | - |
`"command:queue:end"` | - |
`"url:changed"` | url |
`"next:subject:prepared"` | subject, jQuery wrapped subject |
`"collect:run:state"` | |
`"uncaught:exception"` | error, runnable | When uncaught exception is thrown
`"page:loading"` | bool |
`"before:window:load"` | window |
`"navigation:changed"` | eventName |
`"form:submitted"` | |
`"window:load"` | window |
`"before:window:unload"` | beforeUnload event |
`"window:unload"` | unload event |
`"script:error"` | |
