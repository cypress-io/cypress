<template>
  <div>
    <div v-if="query.fetching.value">
      Loading...
    </div>
    <div v-else>
      <ul>
        <li v-for="spec of query.data.value?.app?.activeProject?.specs?.edges" :key="spec?.node?.absolute">
          <!-- is there really no better way than the null coercion ?? -->
          <button @click="setSpec(spec?.node ?? undefined)">
            {{ spec?.node?.relative }}
          </button>
        </li>
      </ul>

      <Specs 
        :gql="query.data.value?.app?.activeProject" 
        :spec="store.spec"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toJS } from 'mobx'
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
