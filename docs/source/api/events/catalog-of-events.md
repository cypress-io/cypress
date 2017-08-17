---
title: Catalog of Events
comments: false
---

Here's the complete list of Cypress events, with arguments.

Event | Args | Description
----- | ---- | ----------
`"test:before:run"` | log, runnable |
`"test:before:run:async"` | log, runnable |
`"runnable:after:run:async"` | log, runnable |
`"test:after:run"` | log, runnable |
`"test:set:state"` | log, function |
`"log:added"` | command, event |
`"log:changed"` | command, event |
`"fail"` | error, runnable |
`"stability:changed"` | bool, eventName |
`"paused"` | |
`"canceled"` | |
`"visit:failed"` | |
`"viewport:changed"` | viewport sizes, function |
`"app:scrolled"` | subject, subject type|
`"command:enqueued"` | command |
`"command:start"` | command |
`"command:end"` | command |
`"command:retry"` | command |
`"command:queue:before:end"` | - |
`"command:queue:end"` | - |
`"url:changed"` | url |
`"next:subject:prepared"` | subject, jQuery wrapped subject |
`"collect:run:state"` | |
`"uncaught:exception"` | error, runnable |
`"page:loading"` | bool |
`"before:window:load"` | window |
`"navigation:changed"` | eventName |
`"form:submitted"` | |
`"window:load"` | window |
`"before:window:unload"` | beforeUnload event |
`"window:unload"` | unload event |
`"script:error"` | |
