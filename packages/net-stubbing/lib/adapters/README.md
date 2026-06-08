# Net-stubbing adapters

**Adapters** for `@packages/network-interception` **ports** — implementations that delegate to existing net-stubbing code.

See [`packages/network-interception/README.md`](../../../network-interception/README.md) for port/adapter terminology and stack context.

---

## `DriverInterceptRegistrationAdapter`

| Hex role | Name |
| --- | --- |
| **Driving port** | `ForInterceptRegistration` |
| **Adapter** | `DriverInterceptRegistrationAdapter` (`driver-intercept-registration.ts`) |
| **Legacy delegate** | `onNetStubbingEvent` (`lib/server/driver-events.ts`) |

### Call path

```
SocketBase ('net' events from driver)
  → ForInterceptRegistration.handleEvent()
  → DriverInterceptRegistrationAdapter
  → onNetStubbingEvent()
```

Constructed with `NetStubbingState`, `SocketBroadcaster`, `getFixture`, `HttpInterception`, and `ForInterceptionEvents`.

---

## `DriverInterceptionEventsAdapter`

| Hex role | Name |
| --- | --- |
| **Driven port** | `ForInterceptionEvents` (`ForDriverNotification` + `ForPendingHandlerResolution`) |
| **Adapter** | `DriverInterceptionEventsAdapter` (`driver-interception-events-adapter.ts`) |

Wraps socket `emit` and `pendingEventHandlers` resolution. Used by `HttpInterception` for `before:request`, response subscriptions, and `after:response` driver events.

### Tests

- `packages/net-stubbing/test/unit/adapters/driver-intercept-registration.spec.ts`
- `packages/net-stubbing/test/unit/adapters/driver-interception-events-adapter.spec.ts`

[#33919](https://github.com/cypress-io/cypress/issues/33919)
