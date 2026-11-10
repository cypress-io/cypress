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

## Related

Orchestration (route matching, subscription planning, handler merge) lives in `NetworkInterceptionCore`; net-stubbing keeps the I/O it drives — body streaming and the `InterceptedRequest` lifecycle in `handle-intercept-request.ts`, and the middleware that calls the core in `lib/server/middleware/`.

[#33919](https://github.com/cypress-io/cypress/issues/33919)
