<template>
  <div class="rounded-md mx-auto border mt-20 text-center p-[20px] w-[400px]">
    <h1 class="text-2xl">
      You seem to have gotten lost...
    </h1>
    <p class="text-gray-600">
      Try one of these links instead
    </p>
    <nav class="space-y-2 mt-[40px]">
      <li
        v-for="route in routes"
        :key="route.path"
        class="text-left text-indigo-700 underline decoration-2 underline-offset-1 decoration-indigo-700 hover:text-indigo-500 hover:decoration-indigo-500"
      >
        <RouterLink :to="route.path">
          {{ route.name }}
        </RouterLink>
      </li>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { uniqBy } from 'lodash'

const routes = computed(() => {
  return uniqBy(useRouter().getRoutes(), 'path').filter((r) => r.meta?.layout !== 'error' && !r.meta?.error)
})
</script>

<route>
{
  meta: {
    layout: "default",
    error: true
  },
  meta: {
    title: "404"
  }
}
</route>
