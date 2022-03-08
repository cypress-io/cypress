## GraphQL Subscriptions

GraphQL Subscriptions are the used to declaratively update the UI with server-side changes.

### Client Side:

A Subscription Operation is structured like this:

```graphql
subscription SomeSubscription {
  specListChanged {  # CurrentProject
    id 
    specs {
      id
      ...SpecsList
    }
  }
}
```

### Server Side:

In the [gql-Subscriptions](../packages/graphql/src/schemaTypes/objectTypes/gql-Subscription.ts) directory, we define the different subscription operations, which are added to the `schema.graphql`.

```

```



