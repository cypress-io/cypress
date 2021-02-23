<template>
  <div>
    <p>{{ greeting }} World! (A)</p>
    <B />
    <B />
    <B />
    <B />
    <button @click="emitEvent">Emit</button>
  </div>
</template>

<script>
const B = {
  name: 'B',
  data() {
    return {
      msg: 'Hello!'
    }
  },
  render(h) {
    return h('span', this.msg)
  }
}

export default {
  components: { B },
  methods: {
    emitEvent() {
      this.$emit('greet', (Math.random() * 1000).toFixed())
    }
  },
  data () {
    return {
      greeting: 'A'
    }
  },
}
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
