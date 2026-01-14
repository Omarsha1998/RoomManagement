<template>
  <q-layout>
    <q-page-container>
      <div class="container">
        <div class="row" style="width: 90%">
          <div class="col-12 q-pb-xl q-mt-md">
            <div v-if="loading">
              <q-skeleton
                :style="{
                  height: '900px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '10px',
                }"
                animation="fade"
              ></q-skeleton>
            </div>
            <q-card v-else>
              <q-tabs
                v-model="tab"
                indicator-color="amber-8"
                active-color="positive"
                class="bg-blue-10 text-amber-8 shadow-2 row"
              >
                <q-tab
                  @click="prepareEvents(bookedSchedule)"
                  :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                  name="allBookedRooms"
                  icon="edit_calendar"
                  label="All Scheduled Rooms"
                  inline-label
                  mobile-arrows
                />
                <q-tab
                  @click="prepareEvents(employeeBookedSchedule)"
                  :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                  name="employeeBookedRooms"
                  icon="date_range"
                  label="My Booked Rooms"
                />
              </q-tabs>

              <q-separator></q-separator>

              <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="allBookedRooms">
                  <calendarViewDaily
                    :events="events"
                    :departmentOptions="departments"
                    :roomOptions="rooms"
                    :buildingOptions="buildings"
                  />
                </q-tab-panel>

                <q-tab-panel name="employeeBookedRooms">
                  <calendarViewDaily
                    :events="events"
                    :departmentOptions="departments"
                    :roomOptions="rooms"
                    :buildingOptions="buildings"
                  />
                </q-tab-panel>
              </q-tab-panels>
            </q-card>
          </div>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import {
  QCalendarMonth,
  addToDate,
  parseTimestamp,
  today,
} from "@quasar/quasar-ui-qcalendar";
import "@quasar/quasar-ui-qcalendar/index.css";
import { mapGetters } from "vuex";
import helperMethods from "src/helperMethods";
import calendarViewDaily from "src/components/calendarViewDaily.vue";

export default {
  components: {
    calendarViewDaily,
  },
  data() {
    return {
      tab: "allBookedRooms",
      events: [],
      bookedSchedule: [],
      departments: [],
      rooms: [],
      buildings: [],
      loading: true,
      loadingCounter: null,
    };
  },
  computed: {
    ...mapGetters({
      booked: "roomModule/getBookedSchedule",
      employeeBooked: "roomModule/getEmployeeBookedSchedule",
      deptOptions: "roomModule/getDepartmentOptions",
      roomsOptions: "roomModule/getRooms",
      buildingOptions: "roomModule/getBuildingOptions",
    }),
  },
  methods: {
    onYearMonthChange() {
      const newDate = new Date(this.selectedYear, this.selectedMonth, 1);
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const day = String(newDate.getDate()).padStart(2, "0");

      this.selectedDate = `${year}-${month}-${day}`;
    },

    async getBookedSchedule() {
      try {
        await this.$store.dispatch("roomModule/getBookedSchedule");
        this.bookedSchedule = this.booked;
        this.loadingCounter++;
        if (this.loadingCounter === 5) {
          this.loading = false;
        }
        await this.prepareEvents(this.bookedSchedule);
      } catch (error) {
        console.error(error);
      }
    },

    async getBookedScheduleByEmployee() {
      try {
        await this.$store.dispatch("roomModule/getBookedScheduleByEmployee");
        this.employeeBookedSchedule = this.employeeBooked;
        this.loadingCounter++;
        if (this.loadingCounter === 5) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async prepareEvents(data) {
      for (const scheduleEntry of data) {
        const { roomName, roomDescription, floor, buildingDescription } =
          scheduleEntry;

        for (const schedule of scheduleEntry.booked) {
          const {
            subjectCode,
            subjectDescription,
            deptLabel,
            section,
            days,
            formatFrom,
            formatTo,
            intervals,
            professor,
            remarks,
            active,
          } = schedule;

          const fromDate = formatFrom.replace(/\//g, "-");
          const toDate = formatTo.replace(/\//g, "-");

          const formatDate = (dateStr) => {
            const [month, day, year] = dateStr.split("-");
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          };

          const formattedFromDate = formatDate(fromDate);
          const formattedToDate = formatDate(toDate);

          const formattedTitle = subjectCode
            ? deptLabel
              ? `${subjectCode} - ${deptLabel}`
              : subjectCode
            : deptLabel
            ? `Book Schedule - ${deptLabel}`
            : `Book Schedule`;

          const deptColors = {
            "COLLEGE OF MEDICINE": "primary",
            "COLLEGE OF NURSING": "green-10",
            "COLLEGE OF ALLIED REHABILITATION SCIENCES": "red-10",
            "COLLEGE OF ALLIED HEALTH PROFESSIONALS": "amber-10",
            "COLLEGE OF ALLIED HEALTH PROFESSIONS": "amber-10",
            "GRADUATE SCHOOL": "purple-10",
          };

          const fullDay = helperMethods.selectedDayData(days);

          const details = section
            ? `Section: ${section}, Days: ${fullDay}, Time: ${helperMethods.formatIntervals(
                intervals
              )}`
            : `Days: ${fullDay}, Time: ${helperMethods.formatIntervals(
                intervals
              )}`;

          const event = {
            active: active,
            buildingDescription,
            roomName,
            roomDescription,
            floor,
            subjectCode,
            subjectDescription,
            section,
            department: deptLabel,
            intervals,
            title: formattedTitle,
            professor,
            remarks,
            details: details,
            fromDate: formattedFromDate,
            toDate: formattedToDate,
            formatTo,
            formatFrom,
            bgcolor: deptColors[deptLabel],
          };

          const eventExists = this.events.some(
            (existingEvent) =>
              existingEvent.department === event.department &&
              existingEvent.intervals === event.intervals &&
              existingEvent.fromDate === event.fromDate &&
              existingEvent.toDate === event.toDate &&
              existingEvent.section === event.section &&
              existingEvent.subjectCode === event.subjectCode
          );

          if (!eventExists) {
            this.events.push(event);
          }
        }
      }
    },

    async getDepartments() {
      try {
        await this.$store.dispatch("roomModule/getDepartments");
        this.departments = this.deptOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 5) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async getRooms() {
      try {
        await this.$store.dispatch("roomModule/getRooms");
        this.rooms = this.roomsOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 5) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async getBuildings() {
      try {
        await this.$store.dispatch("roomModule/getBuildings");
        this.buildings = this.buildingOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 5) {
          this.loading = false;
        }
      } catch (error) {
        console.error("Failed getting all the room types");
      }
    },
  },

  created() {
    this.getBookedSchedule();
    this.getBookedScheduleByEmployee();
    this.getDepartments();
    this.getRooms();
    this.getBuildings();
  },
};
</script>
