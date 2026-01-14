<template>
  <div class="row">
    <div class="col-12">
      <q-virtual-scroll
        class="virtual-scroll"
        type="table"
        style="max-height: 450px"
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        :virtual-scroll-sticky-size-end="32"
        :items="computedAvailableRooms"
      >
        <template v-slot:before>
          <thead class="sticky-thead">
            <tr>
              <th style="width: 100px"></th>

              <th v-for="col in availableCol" :key="col.name">
                {{ col.label }}
              </th>
            </tr>
          </thead>
        </template>
        <template v-slot="{ item: row, name }">
          <q-tr :key="name">
            <q-td style="width: 100px" class="text-center">
              <q-checkbox
                v-model="selectedRooms"
                :val="row"
                @update:model-value="emitSelectedRooms"
              >
              </q-checkbox>
            </q-td>
            <q-td
              v-for="col in availableCol"
              :key="col.name"
              class="text-center"
              :style="{
                width: col.width || 'auto',
                'white-space':
                  col.name === 'building' ||
                  col.name === 'roomTypeDescription' ||
                  col.name === 'roomName'
                    ? 'normal'
                    : 'nowrap',
                'word-wrap':
                  col.name === 'building' ||
                  col.name === 'roomTypeDescription' ||
                  col.name === 'roomName'
                    ? 'break-word'
                    : 'normal',
              }"
            >
              <template v-if="col.name === 'availableTime'">
                <div style="display: flex; justify-content: center; gap: 10px">
                  <q-btn
                    push
                    color="blue-10"
                    label="Check Time"
                    @click="availableMethodDialog(row, row.freeTimeSlots)"
                  />
                </div>
              </template>
              <template v-else>
                <renderCell :row="row" :col="col" />
              </template>
            </q-td>
          </q-tr>
        </template>
      </q-virtual-scroll>
    </div>
    <div
      class="col-12 q-mt-md"
      style="display: flex; justify-content: center; align-items: center"
    >
      <q-btn
        class="text-white bg-positive"
        :disable="selectedRooms.length === 0"
        label="Schedule selected rooms'"
        @click="scheduleRoomDialog"
      ></q-btn>
    </div>
  </div>

  <dataDialog
    v-if="timeDialog"
    :dataSelected="selectedRoomTime"
    :selectedRoomSched="selectedRoomSched"
    :viewTime="viewTime"
    :chooseTime="chooseTime"
    @room-time-cleared="handleRoomTimeCleared"
    @data-emitted="emitData"
  />

  <!-- <q-dialog v-model="timeDialog">
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

      <q-card-section class="q-mb-none">
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
                <th style="width: 100px"></th>
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
              <q-td style="width: 100px" class="text-center">
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
      <q-card-section class="q-mt-none">
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
  </q-dialog> -->
</template>

<script>
import renderCellDay from "./renderCellDay.vue";
import helperMethods from "src/helperMethods";
import renderCell from "./renderCell.vue";
import dataDialog from "./dataPickDialog.vue";
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
  name: "AvailableTable",
  emits: ["data-emitted"],
  props: {
    computedAvailableRooms: Array,
    dateRange: [String, Object],
  },

  data() {
    return {
      timeDialog: false,
      selectedRoomTime: null,
      selectedRooms: [],
      availableCol: [
        {
          name: "roomName",
          label: "Room Name",
          align: "center",
          field: "roomName",
          width: "200px",
        },
        {
          name: "roomTypeDescription",
          label: "Room Type",
          align: "center",
          field: "roomTypeDescription",
          width: "250px",
        },
        {
          name: "building",
          label: "Building",
          align: "center",
          field: "building",
          width: "250px",
        },
        {
          name: "capacity",
          label: "Date Range",
          align: "center",
          field: "capacity",
          width: "150px",
        },
        {
          name: "availableTime",
          label: "Available Time Slot",
          align: "center",
          field: "button",
          width: "150px",
        },
      ],
      selectedRoomTime: [],
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
      selectedRoomSched: [],
      selectedDates: [],
      selectedDays: [],
      days: daysOptions,
      viewTime: false,
      chooseTime: false,
      combineSchedule: [],
      roomId: [],
    };
  },

  components: {
    renderCellDay,
    renderCell,
    dataDialog,
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
              row.intervals
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
          this.rooms = this.roomOptions;
          this.days = daysOptions;
          this.subjects = this.subjectOptions;
          this.departments = this.departmentOptions;
        });
        return;
      }
      update(() => {
        const needle = val.toLowerCase();
        this.days = daysOptions.filter(
          (option) => option.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    clearSelectedDays() {
      this.selectedDays = [];
    },

    availableMethodDialog(item, time) {
      this.timeDialog = true;
      this.viewTime = true;
      this.selectedRoomTime = time;
      this.selectedRoomSched = item;
    },

    scheduleRoomDialog() {
      this.timeDialog = true;
      this.chooseTime = true;
      this.selectedRoomTime = this.combineSchedule;
    },

    handleRoomTimeCleared() {
      this.selectedRoomTime = [];
      this.timeDialog = false;
      this.viewTime = false;
      this.chooseTime = false;
    },

    async emitData(dataValue) {
      const data = {
        selectedRoomSched: dataValue.selectedRoomSched,
        selectedDates: dataValue.selectedDates,
        selectedDays: dataValue.selectedDays,
      };
      this.$emit("data-emitted", data);
    },

    emitSelectedRooms() {
      const mergedSchedules = [];
      const roomIds = [];
      const roomNames = [];

      for (const room of this.selectedRooms) {
        if (!roomIds.includes(room.roomId)) {
          roomIds.push(room.roomId);
        }

        if (!roomNames.includes(room.roomName)) {
          roomNames.push(room.roomName);
        }

        for (const slot of room.freeTimeSlots) {
          const existingSchedule = mergedSchedules.find(
            (schedule) =>
              schedule.date === slot.date && schedule.day === slot.day
          );

          if (existingSchedule) {
            this.mergeIntervals(existingSchedule, slot);
          } else {
            mergedSchedules.push({
              date: slot.date,
              day: slot.day,
              intervals: slot.intervals,
            });
          }
        }
      }

      this.combineSchedule = mergedSchedules;

      this.selectedRoomSched = {
        roomId: roomIds,
        roomName: roomNames.join(", "),
      };

      // this.$emit("data-emitted", { mergedSchedules, roomIds, roomName, fromDate, toDate });
    },

    mergeIntervals(existingSchedule, newSlot) {
      const existingIntervals = existingSchedule.intervals
        .split(",")
        .map((interval) => interval.trim());
      const newInterval = newSlot.intervals;

      existingIntervals.push(newInterval);

      existingIntervals.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.split("-")[0]}`);
        const timeB = new Date(`1970-01-01T${b.split("-")[0]}`);
        return timeA - timeB;
      });

      let mergedIntervals = [];
      let currentStart = null;
      let currentEnd = null;

      existingIntervals.forEach((interval) => {
        const [start, end] = interval.split("-").map((time) => time.trim());

        if (currentStart === null) {
          currentStart = start;
          currentEnd = end;
        } else {
          if (
            new Date(`1970-01-01T${start}`) <=
            new Date(`1970-01-01T${currentEnd}`)
          ) {
            currentEnd =
              new Date(`1970-01-01T${end}`) >
              new Date(`1970-01-01T${currentEnd}`)
                ? end
                : currentEnd;
          } else {
            mergedIntervals.push(`${currentStart}-${currentEnd}`);
            currentStart = start;
            currentEnd = end;
          }
        }
      });

      if (currentStart !== null) {
        mergedIntervals.push(`${currentStart}-${currentEnd}`);
      }

      existingSchedule.intervals = mergedIntervals.join(", ");
    },
  },
};
</script>
