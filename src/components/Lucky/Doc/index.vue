<template>
  <div>
    <svg-icon icon-class="question" @click="goto" />
  </div>
</template>

<script>
export default {
  name: 'RuoYiDoc',
  data() {
    return {
      url: 'https://myvue.luckynwa.top/lucky-vue/',
    }
  },
  methods: {
    goto() {
      window.open(this.url)
    },
  },
}
</script>
