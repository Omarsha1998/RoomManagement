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
      const fieldHandlers = {
        dateRange: () => `${row.formatFrom} - ${row.formatTo}`,
        subjectDescriptionCode: () =>
          row.subjectCode === null && row.subjectDescription === null
            ? "-"
            : `${row.subjectCode} - ${row.subjectDescription}`,
        days: () => helpers.getFullDayName(row[col.field]),
      };

      const nullCheckFields = [
        "remarks",
        "subjectDescription",
        "subjectCode",
        "section",
        "professor",
        "buildingDescription",
        "floor",
      ];

      if (fieldHandlers[col.field]) {
        return fieldHandlers[col.field]();
      }

      if (nullCheckFields.includes(col.field)) {
        return row[col.field] === null ? "-" : row[col.field];
      }

      return row[col.field];
    },
  },
};
</script>
