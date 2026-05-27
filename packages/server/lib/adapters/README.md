# Server adapters

**Adapters** for `@packages/network-interception` **driving ports** owned by the server composition root.

See [`packages/network-interception/README.md`](../../network-interception/README.md).

---

## Stage 2 — `ConfiguratorNetworkPolicyAdapter`

| Hex role | Name |
| --- | --- |
| **Driving port** | `ForNetworkPolicyRegistration` |
| **Adapter** | `ConfiguratorNetworkPolicyAdapter` |
| **Delegate** | `NetworkPolicyRegistry` (`@packages/network-interception/lib/registry/`) |

Forwards `add`, `getPolicies`, and `runPolicies` to a registry instance created in `createProxyRuntime()`.

### `registerDefaultNetworkPolicies`

Called from `createProxyRuntime()` before `NetworkProxy` construction:

| Config | Policy (stage 2) |
| --- | --- |
| `blockHosts` | `BlockedHosts` |

Policies are **registered only** — middleware enforcement is stage 7.

### Tests

- `packages/server/test/unit/adapters/configurator-network-policy_spec.ts`
- `packages/server/test/unit/register-default-network-policies_spec.ts`

[#33919](https://github.com/cypress-io/cypress/issues/33919)
