# Server adapters

**Adapters** for `@packages/network-interception` ports owned by the server composition root.

See [`packages/network-interception/README.md`](../../network-interception/README.md).

---

## Configurator policy registration

`ForNetworkPolicyRegistration` is a **driving port** exported by `@packages/network-interception`. The composition root instantiates `ConfiguratorNetworkPolicyAdapter` and registers default policies via `registerDefaultNetworkPolicies()` from `@packages/network-interception`.

| File | Role |
| --- | --- |
| `lib/adapters/configurator-network-policy.ts` | `ForNetworkPolicyRegistration` adapter wrapping `NetworkPolicyRegistry` |
| `lib/network-runtime.ts` | Composition root: creates adapter, calls `registerDefaultNetworkPolicies()`, wires `NetworkInterceptionCore` |

Policy factories (`createBlockedHosts`, etc.) and config mapping live in `@packages/network-interception/lib/policies/`. The server injects transport-specific deps (e.g. `blocked.matches`) at the composition root.

### Tests

- `packages/network-interception/test/unit/register-default-network-policies.spec.ts`
- `packages/server/test/unit/network-runtime_spec.ts`
- `packages/server/test/unit/adapters/configurator-network-policy_spec.ts`

[#33919](https://github.com/cypress-io/cypress/issues/33919)
