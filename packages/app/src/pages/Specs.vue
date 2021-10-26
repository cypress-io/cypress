<template>
  <HeaderBar />
  <SpecsPageContainer />
</template>

<script lang="ts" setup>
import SpecsPageContainer from '../specs/SpecsPageContainer.vue'
import HeaderBar from '../../../frontend-shared/src/layouts/HeaderBar.vue'
</script>

<route>
{
  name: "Specs Page"
}
</route>
