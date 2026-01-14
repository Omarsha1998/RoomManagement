<template>
  <span>{{ renderCell(row, col) }}</span>
</template>

<script>
import helpers from "../helperMethods";
export default {
  props: {
    row: Object,
    col: Object,
  },

  methods: {
    renderCell(row, col) {
      if (col.name === "days") {
        return helpers.getFullDayName(row[col.field]);
      } else {
        return row[col.field];
      }
    },
  },
};
</script>
