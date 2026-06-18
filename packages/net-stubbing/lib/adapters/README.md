# Net-stubbing adapters

**Adapters** for `@packages/network-interception` **ports** — implementations that delegate to existing net-stubbing code.

See [`packages/network-interception/README.md`](../../../network-interception/README.md) for port/adapter terminology and stack context.

---

## `createDriverAdapter`

| Hex role | Name |
| --- | --- |
| **Driving port** | `ForInterceptRegistration` |
| **Factory** | `createDriverAdapter` (`create-driver-adapter.ts`) |
| **Legacy delegate** | `onNetStubbingEvent` (`lib/server/driver-events.ts`) |

### Call path

```
SocketBase ('net' events from driver)
  → ForInterceptRegistration.handleEvent()
  → createDriverAdapter().createInterceptRegistration()
  → onNetStubbingEvent()
```

Constructed with `ForStubbing`, `SocketBroadcaster`, optional shared `HttpIntercept`, and optional `onSyncInterceptSkipped`. Registers `CyInterceptIntercepter` on the stack and returns socket adapters plus `createInterceptRegistration`.

---

## `DriverInterceptionEventsAdapter`

| Hex role | Name |
| --- | --- |
| **Driven port** | `ForInterceptionEvents` (`ForDriverNotification` + `ForPendingHandlerResolution`) |
| **Adapter** | `DriverInterceptionEventsAdapter` (`driver-interception-events-adapter.ts`) |

Wraps socket `emit` and `pendingEventHandlers` resolution. Used by `HttpIntercept` for `before:request`, response subscriptions, and `after:response` driver events.

### Tests

- `packages/net-stubbing/test/unit/adapters/driver-intercept-registration.spec.ts`
- `packages/net-stubbing/test/unit/adapters/driver-interception-events-adapter.spec.ts`

[#33919](https://github.com/cypress-io/cypress/issues/33919)
