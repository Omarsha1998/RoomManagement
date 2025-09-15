<template>
  <q-dialog v-model="timeDialog">
    <q-card
      :class="[$q.screen.name + '-text', $q.screen.name + '-width2']"
      style="display: flex; flex-direction: column"
      class="rounded"
    >
      <q-card-section class="bg-blue-10 row items-center">
        <div class="text-white text-bold">Available Time Daily</div>
        <q-space></q-space>
        <q-btn
          class="bg-white"
          icon="close"
          push
          round
          padding="xs"
          @click="clearSelectedRoomTime"
        ></q-btn>
      </q-card-section>

      <q-card-section class="q-mb-none">
        <div class="row">
          <div class="col-12">
            <p style="text-align: justify; font-size: 14px">
              Please ensure that if you select or choose multiple rooms, they
              have the same time and are scheduled on the same day or dates.
            </p>
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="chooseTime" class="q-mb-none">
        <q-select
          filled
          v-model="selectedDays"
          use-input
          input-debounce="0"
          label="Days"
          :options="days"
          behavior="menu"
          fill-input
          clearable
          @filter="filterFn"
          @clear="clearSelectedDays"
          class="bg-grey-3 q-mb-xs"
          option-value="value"
          option-label="label"
          multiple
          :disable="selectedDates.length > 0"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>

      <q-card-section class="q-mb-none">
        <q-virtual-scroll
          class="virtual-scroll"
          type="table"
          style="max-height: 450px"
          :virtual-scroll-item-size="48"
          :virtual-scroll-sticky-size-start="48"
          :virtual-scroll-sticky-size-end="32"
          :items="computedSelectedRoomTime"
        >
          <template v-slot:before>
            <thead class="sticky-thead">
              <tr>
                <th v-if="chooseTime" style="width: 100px"></th>
                <th
                  v-for="col in selectedRoomTimeCol"
                  :key="col.name"
                  class="text-bold"
                >
                  {{ col.label }}
                </th>
              </tr>
            </thead>
          </template>
          <template v-slot="{ item: row, name }">
            <q-tr :key="name">
              <q-td v-if="chooseTime" style="width: 100px" class="text-center">
                <q-checkbox
                  v-model="selectedDates"
                  :val="row"
                  :disable="selectedDays.length > 0"
                ></q-checkbox>
              </q-td>
              <q-td
                v-for="col in selectedRoomTimeCol"
                :key="col.name"
                class="text-center"
                :style="{
                  width: col.width || 'auto',
                  'white-space':
                    col.name === 'availableTimeDay' ? 'normal' : 'nowrap',
                  'word-wrap':
                    col.name === 'availableTimeDay' ? 'break-word' : 'normal',
                }"
              >
                <renderCellDay :row="row" :col="col" />
              </q-td>
            </q-tr>
          </template>
        </q-virtual-scroll>
      </q-card-section>
      <div style="flex: 1"></div>
      <q-card-section v-if="chooseTime" class="q-mt-none">
        <div style="display: flex; justify-content: right; gap: 5px">
          <q-btn
            push
            color="green-9"
            class="q-ml-xs text-subtitle1"
            label="Book This Room"
            @click="emitData"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import renderCellDay from "./renderCellDay.vue";
import helperMethods from "src/helperMethods";
import renderCell from "./renderCell.vue";
let daysOptions = [
  { label: "Monday", value: "M" },
  { label: "Tuesday", value: "T" },
  { label: "Wednesday", value: "W" },
  { label: "Thursday", value: "TH" },
  { label: "Friday", value: "F" },
  { label: "Saturday", value: "S" },
  { label: "Sunday", value: "SU" },
];
export default {
  props: {
    dataSelected: Object,
    viewTime: Boolean,
    chooseTime: Boolean,
    selectedRoomSched: Object,
  },

  data() {
    return {
      timeDialog: true,
      selectedRoomTime: this.dataSelected,
      selectedRoomTimeCol: [
        {
          name: "date",
          label: "Date",
          align: "center",
          field: "date",
          width: "250px",
        },
        {
          name: "days",
          label: "Day",
          align: "center",
          field: "day",
          width: "250px",
        },
        {
          name: "availableTimeDay",
          label: "Available Time Slot",
          align: "center",
          field: "formattedIntervals",
          width: "400px",
        },
      ],
      days: daysOptions,
      selectedDays: [],
      selectedDates: [],
    };
  },

  components: {
    renderCellDay,
    renderCell,
  },

  computed: {
    selectedDateString() {
      return this.selectedDates
        .map((dateObj) => `${dateObj.date} - ${dateObj.day}`)
        .join(", ");
    },

    computedSelectedRoomTime() {
      if (Array.isArray(this.selectedRoomTime)) {
        return this.selectedRoomTime.map((row) => {
          if (row.intervals) {
            row.formattedIntervals = helperMethods.formatIntervals(
              row.intervals,
            );
          }
          return row;
        });
      }
      return [];
    },
  },

  methods: {
    filterFn(val, update) {
      if (val === "") {
        update(() => {
          this.days = daysOptions;
        });
        return;
      }
      update(() => {
        const needle = val.toLowerCase();
        this.days = daysOptions.filter(
          (option) => option.label.toLowerCase().indexOf(needle) > -1,
        );
      });
    },

    clearSelectedRoomTime() {
      this.selectedRoomTime = [];
      this.$emit("room-time-cleared", this.selectedRoomTime, false);
    },

    clearSelectedDays() {
      this.selectedDays = [];
    },

    async emitData() {
      const data = {
        selectedRoomSched: this.selectedRoomSched,
        selectedDates: this.selectedDates,
        selectedDays: this.selectedDays,
      };
      this.$emit("data-emitted", data);
    },
  },
};
</script>
