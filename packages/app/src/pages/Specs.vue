<template>
  <div>
    <suspense>
      <template #default>
        <SpecsPageContainer />
      </template>

      <template #fallback>
        Loading...
      </template>
    </suspense>
  </div>
</template>

<script lang="ts" setup>
import SpecsPageContainer from '../runs/SpecsPageContainer.vue'
</script>

<route>
{
  name: "Specs Page"
}
</route>
