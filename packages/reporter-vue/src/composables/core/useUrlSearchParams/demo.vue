
<script setup lang="ts">
import { useUrlSearchParams } from '.'

const params = useUrlSearchParams('history')
params.foo = 'bar'
params.vueuse = 'awesome'
</script>

<template>
  <div>
    <ul>
      <li v-for="key in Object.keys(params)" :key="key">
        {{ key }}={{ params[key] }}
      </li>
    </ul>
  </div>
</template>
