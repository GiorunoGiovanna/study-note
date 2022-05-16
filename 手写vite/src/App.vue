<template>
  <div>
    {{ data }}
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  setup() {
    const data = ref("jojo stand");
    return { data };
  },
};
</script>