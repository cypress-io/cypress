<template>
  <div
    :key="pkg.name"
    v-for="(pkg, index) in gql.packagesToInstall ?? []"
    class="flex text-left"
    :class="index > 0 ? 'border-t border-t-gray-200' : undefined"
  >
    <div class="p-5">
      <h2 class="text-indigo-600 font-normal">{{ pkg.name }}</h2>
      <p class="text-gray-400 text-sm" v-html="pkg.description"/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { gql } from '@apollo/client'
import { PackagesListFragment } from "../generated/graphql";

gql`
fragment PackagesList on Wizard {
  packagesToInstall {
    name
    description
  }
}
`

export default defineComponent({
  props: {
    gql: {
      type: Object as PropType<PackagesListFragment>,
      required: true
    }
  },
  setup(props) {
    return { 
      gql: props.gql
    };
  },
});
</script>
