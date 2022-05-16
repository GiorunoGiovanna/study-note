<template>
  <div class="a">
    <div class="b"></div>
    <div class="c"></div>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data() {
    return {
      count: 0,
    };
  },
};
</script>

<style lang="css" scoped>
/* @import url(../less/helloworld.css); */
@import url(../less/mixin.css);
</style>