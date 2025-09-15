<template>
  <q-btn-group class="buttonGroup" color="primary" style="margin-bottom: 5px">
    <q-btn
      :class="{ activeLink: $route.path === link }"
      style="padding: 9px 18px; width: 100%"
      :to="link"
    >
      <span class="q-focus-helper" tabindex="-1"></span>
      <span
        class="q-btn__content text-center col items-center q-anchor--skip justify-start row"
      >
        <q-icon
          :name="icon"
          aria-hidden="true"
          class="q-pr-md"
          color="blue-10"
        />
        <span class="text-blue-10 title text-bold">{{ title }}</span>
      </span>
    </q-btn>
  </q-btn-group>
</template>
<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "EssentialLink",
  props: {
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: false,
    },
  },
});
</script>
