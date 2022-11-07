<template>
  <globally-registered-component />
  <h2>{{ msg }}</h2>
</template>

<script>
export default {
  props: {
    msg: String,
  },
  data () {
    return {
      foo: 'bar',
    }
  },
}
</script>
