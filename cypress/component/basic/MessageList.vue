<template>
  <ul>
    <li v-for="(message, index) in messages" :key="index" >
      {{ message }}
    </li>
  </ul>
</template>

<script>
// from https://alexjoverm.github.io/2017/08/21/Write-the-first-Vue-js-Component-Unit-Test-in-Jest/
export default {
  name: 'list',
  props: ['messages']
}
</script>
