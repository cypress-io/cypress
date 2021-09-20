<template>
  <h3>{{ props.gql.healthCheck }}</h3>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import type { FooFragment } from './generated/graphql'

gql`
fragment Foo on Query {
  healthCheck
}
`

const props = defineProps<{
  gql: FooFragment
}>()
</script>>