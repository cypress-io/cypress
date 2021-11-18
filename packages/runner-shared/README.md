# Runner Shared

The runner-shared contains the shared components between the `runner` (use for  end-to-end testing) and the `runner-ct` (used for component testing) including:

- Shared empty states
- Shared error states
- Containers, headers and iframe components
- Selector playground and Cypress Studio

## Developing

The components are imported to the [`runner`](../runner/README.md#Developing)  and `runner-ct` packages respectively. Please see their instructions for develoment.

## Testing

### Unit Tests

```bash
yarn workspace @packages/runner-shared test
```
