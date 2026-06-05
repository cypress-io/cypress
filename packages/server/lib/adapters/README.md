# Server adapters

**Adapters** for `@packages/network-interception` ports owned by the server composition root.

See [`packages/network-interception/README.md`](../../network-interception/README.md).

---

## Stage 2 — configurator policy registration (no server adapter)

`ForNetworkPolicyRegistration` is a **driving port** exported by `@packages/network-interception`. The composition root instantiates `NetworkPolicyRegistry` and registers policies via that port interface.

Policy **definitions and config mapping** live in server:

| File | Role |
| --- | --- |
| `lib/network-policies/blocked-hosts.ts` | Config policy factory conforming to `NetworkPolicy` |
| `register-default-network-policies.ts` | Maps config → policy instances, calls `policies.add()` |
| `network-runtime.ts` | Creates registry, calls `registerDefaultNetworkPolicies()` before `NetworkProxy` |

| Config | Policy (stage 2) |
| --- | --- |
| `blockHosts` | `createBlockedHosts()` |

Policies are **registered only** — middleware enforcement is stage 7.

### Tests

- `packages/server/test/unit/network-policies/blocked-hosts_spec.ts`
- `packages/server/test/unit/register-default-network-policies_spec.ts`
- `packages/server/test/unit/network-runtime_spec.ts`

[#33919](https://github.com/cypress-io/cypress/issues/33919)
