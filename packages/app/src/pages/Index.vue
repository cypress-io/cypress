<template>
  <div>
    <div v-if="query.fetching.value">
      Loading...
    </div>
    <div v-else>
      <Specs 
        :gql="query.data.value?.app?.activeProject" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import Specs from './Specs.vue'
import { store } from '../store'
import { IndexDocument } from '../generated/graphql'
import type { Specs_SpecFragment } from '../generated/graphql'


gql`
query Index {
  app {
    activeProject {
      ...Specs_Specs
    }
  }
}
`

const query = useQuery({ query: IndexDocument })

const setSpec = (spec?: Specs_SpecFragment) => {
  if (!spec) {
    return
  }

  store.setSpec({
    absolute: spec.absolute,
    relative: spec.relative,
    name: spec.name
  })

  // runSpec()
}
</script>

<route>
{
  name: "Home Page"
}
</route>
