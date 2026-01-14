<template>
  <span>{{ renderCell(row, col) }}</span>
</template>

<script>
import helperMethods from "src/helperMethods";
export default {
  props: {
    row: Object,
    col: Object,
  },

  methods: {
    renderCell(row, col) {
      if (col.field === "floor") {
        if (row.floor === null && row.roomId === 376) {
          return "ONLINE CLASS";
        }

        if (row.floor === null && row.roomId === 377) {
          return "UE MANILA";
        }
        const floor = {
          0: "Ground Floor",
          1: "Second Floor",
          2: "Third Floor",
          3: "Fourth Floor",
          4: "Fifth Floor",
          5: "Sixth Floor",
        };
        return floor[row.floor];
      } else if (col.field === "dateRange") {
        const dateRange = `${this.formatDateTime(
          row.fromDate,
        )} - ${this.formatDateTime(row.toDate)}`;
        return dateRange;
      } else if (
        col.field === "buildingDescription" ||
        col.field === "building"
      ) {
        if (
          (row.buildingDescription === null && row.roomId === 376) ||
          (row.building === null && row.roomId === 376)
        ) {
          return "ONLINE CLASS";
        }

        if (
          (row.buildingDescription === null && row.roomId === 377) ||
          (row.building === null && row.roomId === 377)
        ) {
          return "UE MANILA";
        }

        if (row.buildingDescription === null || row.building === null) {
          return "-";
        }
        return row[col.field];
      } else if (col.name === "days") {
        return helperMethods.getFullDayName(row[col.field]);
      } else {
        return row[col.field];
      }
    },

    formatDateTime(dateTimeString) {
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      };
      const dateTime = new Date(dateTimeString);
      return dateTime.toLocaleDateString(undefined, options);
    },
  },
};
</script>
