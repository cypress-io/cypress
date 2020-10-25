<template>
  <section>
    <slot name="header" v-bind:header="prettyTitle(header)">{{ header }}</slot>
  <table>
    <thead style="width: 100%;">
    <tr>
      <th v-for="header in headers">{{ prettyTitle(header) }}</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="prop in props">
      <td v-for="val in prop">{{ prettyValue(val) }}</td>
    </tr>
    </tbody>
  </table>
  </section>
</template>

<script>
  import _ from 'lodash'
  export default {
    props: ['props', 'header'],
    computed: {
      headers() {
        return Object.keys(this.props[0])
      }
    },
    methods: {
      prettyValue(val) {
        if (typeof val === 'object') {
          if (val.value) return val.value
          if (val.name) return val.name
        }
        return val
      },
      prettyTitle: _.startCase
    }
  }
</script>

<style>
  table {
    border-collapse: collapse;
    margin: 25px 0;
    font-size: 0.9rem;
    line-height: 160%;
    font-family: sans-serif;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  }
  table thead tr {
    background-color: var(--color-ocean);
    color: var(--color-snow);
    text-align: left;
  }

  table th,
  table td {
    padding: 12px 15px;
  }

  table tbody tr {
    border-bottom: 1px solid #dddddd;
  }

  table tbody tr:nth-of-type(even) {
    background-color: var(--color-snow);
  }

  table tbody tr:last-of-type {
    border-bottom: 2px solid var(--color-ocean);
  }
</style>
