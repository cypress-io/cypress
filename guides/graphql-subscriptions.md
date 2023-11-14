## GraphQL Subscriptions Overview & Test Guide:

In GraphQL there are currently 3 types of Operations: `query`, `mutation`, `subscription`

Query is similar to a rest-ful `GET` request:

```graphql
query MyAppData {
  cloudUser { # CloudUser type
    id
    email
    fullName
  }
  currentProject { # Project type
    id
    name
    ...CurrentProjectCard
  }
  app { # App type
    localSettings {
      ...LocalSettingsView
    }
  }
}
```

Whereas a mutation is like a `POST` request, where you ask for what you want back (what changed b/c of the mutation):

```graphql
mutation MyAppMutation($testingType: TestingTypeEnum) {
  chooseTestingType(testingType: $testingType) { # Project type
    id
    currentTestingType
  }
}
```

A subscription is used when you want to receive information about data that has changed scoped to an individual event:

```graphql
subscription MyAppSubscription {
  projectUpdated { # Project type
    id
    isLoadingConfig
    isLoadingSetupNodeEvents
  }
}
```

The distinction between subscriptions & queries is that subscriptions can only have a single top-level field. You can think of the subscription like an "event name" in socket.io, except that it's strongly typed & part of the overall GraphQL schema, meaning that you don't need to do any extra work for it to merge into the normalized cache & refresh affected parts of the view. 

```ts
// will merge & update any views that depend on `isLoadingConfig` / `isLoadingSetupNodeEvents`
useSubscription({ query: MyAppSubscriptionDocument })
```

We can also use subscriptions more granularly as an event emitter, basically as a strongly typed socket.io emitter:

```graphql
subscription OnSpecChange {
  onSpecUpdate {
    specPath
    reason
  }
}
```

```ts
useSubscription({ query: OnSpecChangeDocument }, (prev, next) => {
  if (data.specPath === currentSpecPath && reason === 'DELETED') {
    // navigate to another page
  } else {
    // Rerun spec
  }
  return next
})
```

### Client Details:

- [API Docs for useSubscription](https://formidable.com/open-source/urql/docs/api/vue/#usesubscription)
- [Subscriptions overview](https://formidable.com/open-source/urql/docs/advanced/subscriptions/)

One thing to be aware of, is the subscription is only mounted/responded to when the containing component is mounted on the page. Therefore, one rule of thumb when using subscriptions is to ensure that they are declared in the subscription dependent view that is highest in the hierarchy so that the subscription can be active when it needs to be. This location is often alongside a query rather than a fragment.


### Server Docs

Subscriptions are implemented on the server as an `AsyncIterator`. This is handled for us by the [graphql-ws](https://github.com/enisdenjo/graphql-ws) package.

To add a new Subscription field, add a new entry in the [`gql-Subscriptions`](../packages/graphql/src/schemaTypes/objectTypes/gql-Subscription.ts):

```ts
t.field('browserStatusChange', {
  type: CurrentProject,
  description: 'Status of the currently opened browser',
  subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('browserStatusChange'),
  resolve: (source, args, ctx) => ({}),
})
```

And then add the corresponding method in [DataEmitterActions](../packages/data-context/src/actions/DataEmitterActions.ts)


```ts
browserStatusChange () {
  this._emit('browserStatusChange')
}
```

- [API Docs](https://github.com/enisdenjo/graphql-ws/tree/master/docs)
- [Transport layer protocol specification](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md)

### Testing

If you want to TDD the subscription being added & working directly in isolation, one recommended approach is to add one spec file per-subscription in the `/app/cypress/e2e/subscription` directory. This file can cover both the app & launchpad handling of a given subscription.

Example: [authChange-subscription.cy.ts](../packages/app/cypress/e2e/subscriptions/authChange-subscription.cy.ts)

