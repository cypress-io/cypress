<template>
  {{ spec }}
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import type { SpecsList_SpecsFragment } from "../generated/graphql";

gql`
fragment SpecsListRow on Spec {

}
`
defineProps<{
  spec: SpecsList_SpecsFragment
}>()
</script>
