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
// will merge & update any views that depend on `isLoadingConfig`
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

- [API Docs for useSubscription](https://formidable.com/open-source/urql/docs/api/urql/#usesubscription)
- [Subscriptions overview](https://formidable.com/open-source/urql/docs/advanced/subscriptions/)

### Server Docs

Subscriptions are implemented on the server as an `AsyncIterator`. This is handled for us by the [graphql-ws](https://github.com/enisdenjo/graphql-ws) package.

- [API Docs](https://github.com/enisdenjo/graphql-ws/tree/master/docs) & a 
- [Transport layer protcol specification](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md)

### Testing

We should add one spec file per-subscription in the `/app/cypress/e2e/subscription` directory. This file can cover both the app & launchpad handling of a given subscription.

Example: [authChange-subscription.cy.ts](../packages/app/cypress/e2e/subscriptions/authChange-subscription.cy.ts)


