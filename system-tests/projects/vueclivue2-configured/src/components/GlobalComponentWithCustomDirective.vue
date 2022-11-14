<template>
  <div class="child" v-custom="test" />
</template>

<script>
export default {
  name: 'GlobalComponentWithCustomDirective',
  data () {
    return {
      test: 'testing123'
    }
  }
}
</script>
