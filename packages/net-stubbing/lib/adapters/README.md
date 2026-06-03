# Net-stubbing adapters

**Adapters** for `@packages/network-interception` **ports** — implementations that delegate to existing net-stubbing code.

See [`packages/network-interception/README.md`](../../../network-interception/README.md) for port/adapter terminology and stack context.

---

## Stage 1 — `DriverInterceptRegistrationAdapter`

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

Constructed with `NetStubbingState`, `SocketBroadcaster`, `getFixture` — same dependencies the direct call path used.

### Tests

`packages/net-stubbing/test/unit/adapters/driver-intercept-registration.spec.ts`

---

## Later stages

Request/response I/O (`handle-intercept-request.ts`, middleware) remains in net-stubbing until stage 3 extracts orchestration into the core.

[#33919](https://github.com/cypress-io/cypress/issues/33919)
