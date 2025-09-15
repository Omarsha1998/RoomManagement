<template>
  <div
    class="col-12"
    style="justify-content: center; align-items: center; display: flex"
  >
    <div class="text-h4 q-mb-md">{{ formattedDate }}</div>
  </div>
  <q-calendar-month
    class="calendarMonth"
    ref="calendar"
    v-model="selectedDateData"
    animated
    bordered
    focusable
    hoverable
    no-active-date
    :day-min-height="100"
  >
    <template #week="{ scope: { week, weekdays } }">
      <template
        v-for="(displayedEvent, index) in getWeekEvents(week, weekdays)"
        :key="index"
      >
        <div
          :class="badgeClasses(displayedEvent)"
          :style="badgeStyles(displayedEvent, week.length)"
          class="event-item items-center"
          @click="onEventClick(displayedEvent)"
        >
          <div
            v-if="displayedEvent.event && displayedEvent.event.details"
            class="title q-calendar__ellipsis"
          >
            <q-icon
              v-if="displayedEvent.event?.icon"
              :name="displayedEvent.event.icon"
            ></q-icon>
            {{
              displayedEvent.event.title +
              (displayedEvent.event.time
                ? " - " + displayedEvent.event.time
                : "")
            }}
            <q-tooltip>{{ displayedEvent.event.details }}</q-tooltip>
          </div>
        </div>
      </template>
    </template>
  </q-calendar-month>

  <q-dialog v-model="schedDialog">
    {{ computedSelectedSchedule }}
    <q-card
      :class="[
        $q.screen.name + '-text',
        $q.screen.name + '-widthSched',
        $q.screen.name + '-heightSched',
      ]"
    >
      <q-card-section class="bg-blue-10 row items-center">
        <div class="text-white text-bold">Schedules</div>

        <q-space></q-space>
        <q-btn
          class="bg-white text-biue-10"
          icon="close"
          push
          round
          dense
          padding="xs"
          @click="clearSelectedSchedule"
          v-close-popup
        ></q-btn>
      </q-card-section>
      <q-card-section>
        <q-input
          class="inputClass"
          v-model="searchTextSched"
          placeholder="Search"
          outlined
          dense
          standout
          clearable
          :class="[$q.screen.name + '-text2']"
          @clear="clearSearchText"
        />
        <q-virtual-scroll
          class="virtual-scroll"
          type="table"
          style="max-height: 700px"
          :virtual-scroll-item-size="48"
          :virtual-scroll-sticky-size-start="48"
          :virtual-scroll-sticky-size-end="32"
          :items="computedSelectedSchedule"
        >
          <template v-slot:before>
            <thead class="sticky-thead">
              <tr>
                <th
                  v-for="col in selectedCol"
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
              <q-td
                v-for="col in selectedCol"
                :key="col.name"
                class="text-center"
                :style="{
                  width: col.width || 'auto',
                  'white-space':
                    col.name === 'subjectDescription' ||
                    col.name === 'department'
                      ? 'normal'
                      : 'nowrap',
                  'word-wrap':
                    col.name === 'subjectDescription' ||
                    col.name === 'department'
                      ? 'break-word'
                      : 'normal',
                }"
              >
                <renderCellDia :row="row" :col="col" />
              </q-td>
            </q-tr>
          </template>
        </q-virtual-scroll>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import helperMethods from "src/helperMethods";
import {
  QCalendarMonth,
  daysBetween,
  isOverlappingDates,
  parsed,
  parseDate,
  today,
} from "@quasar/quasar-ui-qcalendar";
import { indexOf } from "@quasar/quasar-ui-qcalendar/src/utils/helpers.js";
import "@quasar/quasar-ui-qcalendar/dist/index.css";
import renderCellDia from "src/components/renderCellDialog.vue";

export default {
  name: "EventCalendar",
  props: {
    events: {
      type: Array,
      required: true,
    },
    searchText: {
      type: String,
      default: "",
    },
    selectedDate: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      calendar: null,
      selectedDateData: this.selectedDate,
      selectedSchedule: [],
      searchTextSched: "",
      schedDialog: false,
      selectedSchedule: [],
      selectedCol: [
        {
          name: "roomName",
          label: "Room Name",
          align: "center",
          field: "roomName",
          sortable: false,
          width: "175px",
        },
        // {
        //   name: "roomDescription",
        //   label: "Room Type",
        //   align: "center",
        //   field: "roomDescription",
        //   sortable: false,
        //   width: "225px",
        // },
        {
          name: "buildingDescription",
          label: "Building",
          align: "center",
          field: "buildingDescription",
          sortable: false,
          width: "250px",
        },
        {
          name: "floor",
          label: "Floor",
          align: "center",
          field: "floor",
          sortable: false,
          width: "175px",
        },
        {
          name: "remarks",
          label: "Remarks",
          align: "center",
          field: "remarks",
          sortable: false,
        },
        {
          name: "subjectDescription",
          label: "Subject Description",
          align: "center",
          field: "title",
          sortable: false,
        },
        {
          name: "details",
          label: "Details",
          align: "center",
          field: "details",
          sortable: false,
        },
        {
          name: "professor",
          label: "Faculty",
          align: "center",
          field: "professor",
          sortable: false,
        },
        {
          name: "dateRange",
          label: "Date Range",
          align: "center",
          field: "dateRange",
          sortable: false,
        },
        {
          name: "intervals",
          label: "Time",
          align: "center",
          field: "formattedIntervals",
          sortable: false,
        },
      ],
    };
  },

  computed: {
    computedSelectedSchedule() {
      if (
        !Array.isArray(this.selectedSchedule) ||
        this.selectedSchedule.length === 0
      ) {
        return [];
      }

      const query = this.searchTextSched.toLowerCase();

      return this.selectedSchedule.flat().filter((row) => {
        if (row.intervals) {
          row.formattedIntervals = helperMethods.formatIntervals(row.intervals);
        }

        return (
          (row.title && row.title.toString().toLowerCase().includes(query)) ||
          (row.roomDescription &&
            row.roomDescription.toString().toLowerCase().includes(query)) ||
          (row.professor &&
            row.professor.toString().toLowerCase().includes(query)) ||
          (row.department &&
            row.department.toString().toLowerCase().includes(query)) ||
          (row.dateRange &&
            row.dateRange.toString().toLowerCase().includes(query)) ||
          (row.roomName &&
            row.roomName.toString().toLowerCase().includes(query)) ||
          (row.buildingDescription &&
            row.buildingDescription.toString().toLowerCase().includes(query))
        );
      });
    },

    formattedDate() {
      const date = new Date(this.selectedDate);
      const options = { year: "numeric", month: "long" };
      return date.toLocaleDateString(undefined, options);
    },
  },

  components: {
    QCalendarMonth,
    renderCellDia,
  },

  methods: {
    onYearMonthChange() {
      const newDate = new Date(this.selectedYear, this.selectedMonth, 1);
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const day = String(newDate.getDate()).padStart(2, "0");

      this.selectedDate = `${year}-${month}-${day}`;
    },

    clearSelectedSchedule() {
      this.schedDialog = false;
      this.selectedSchedule = [];
    },

    clearSearchText() {
      this.searchTextSched = "";
    },

    getWeekEvents(week, _weekdays) {
      if (!week || week.length === 0) return [];

      const firstDay = parsed(`${week[0]?.date} 00:00`);
      const lastDay = parsed(`${week[week.length - 1]?.date} 23:59`);
      if (!firstDay || !lastDay) return [];

      const query = this.searchText ? this.searchText.toLowerCase() : "";

      const eventsWeek = this.events
        .map((event, id) => {
          const startDate = parsed(`${event.start} 00:00`);
          const endDate = parsed(`${event.end} 23:59`);

          if (
            startDate &&
            endDate &&
            isOverlappingDates(startDate, endDate, firstDay, lastDay)
          ) {
            const left = daysBetween(firstDay, startDate);
            const right = daysBetween(endDate, lastDay);
            return {
              id,
              left,
              right,
              size: week.length - (left + right),
              event,
            };
          }
          return null;
        })
        .filter(Boolean)
        .filter(({ event }) => {
          return (
            query === "" ||
            (event.title &&
              event.title.toString().toLowerCase().includes(query)) ||
            (event.roomDescription &&
              event.roomDescription.toString().toLowerCase().includes(query)) ||
            (event.professor &&
              event.professor.toString().toLowerCase().includes(query)) ||
            (event.department &&
              event.department.toString().toLowerCase().includes(query)) ||
            (event.dateRange &&
              event.dateRange.toString().toLowerCase().includes(query)) ||
            (event.roomName &&
              event.roomName.toString().toLowerCase().includes(query)) ||
            (event.buildingDescription &&
              event.buildingDescription
                .toString()
                .toLowerCase()
                .includes(query))
          );
        });

      const evts = [];
      if (eventsWeek.length > 0) {
        const sortedWeek = eventsWeek.sort(
          (a, b) => (a.left ?? 0) - (b.left ?? 0)
        );
        sortedWeek.forEach((_, i) => {
          this.insertEvent(evts, week.length, sortedWeek, i, 0, 0);
        });
      }

      return evts;
    },

    insertEvent(events, weekLength, infoWeek, index, availableDays, level) {
      const iEvent = infoWeek[index];
      if (
        iEvent !== undefined &&
        "left" in iEvent &&
        iEvent.left >= availableDays
      ) {
        if (iEvent.left - availableDays) {
          events.push({ size: iEvent.left - availableDays });
        }
        events.push({ size: iEvent.size, event: iEvent.event });

        if (level !== 0) {
          infoWeek.splice(index, 1);
        }

        const currentAvailableDays = iEvent.left + iEvent.size;

        if (currentAvailableDays <= weekLength) {
          const indexNextEvent = infoWeek.findIndex(
            (e) =>
              e.id !== iEvent.id &&
              e.left !== undefined &&
              e.left >= currentAvailableDays
          );

          this.insertEvent(
            events,
            weekLength,
            infoWeek,
            indexNextEvent !== -1 ? indexNextEvent : index,
            currentAvailableDays,
            level + 1
          );
        }
      } else {
        events.push({ size: weekLength - availableDays });
      }
    },

    badgeClasses(displayedEvent) {
      if (displayedEvent.event !== undefined) {
        return {
          "my-event": true,
          "text-white": true,
          [`bg-${displayedEvent.event.bgcolor}`]: true,
          "rounded-border": true,
          "q-calendar__ellipsis": true,
        };
      }
      return {
        "my-void-event": true,
      };
    },

    badgeStyles(displayedEvent, weekLength) {
      const s = {};
      if (displayedEvent.size !== undefined) {
        s.width = (100 / weekLength) * displayedEvent.size + "%";
      }
      return s;
    },

    onEventClick(event) {
      const actualEvent = event?.event;
      this.selectedSchedule = [actualEvent];
      this.schedDialog = true;
    },
  },

  watch: {
    selectedDate(newDate) {
      this.selectedDateData = newDate;
    },
  },
};
</script>
