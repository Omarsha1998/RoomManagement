<template>
  <q-layout>
    <q-page-container>
      <div class="container">
        <div class="row" style="width: 95%">
          <div class="col-12 q-pt-lg">
            <Loader :isLoading="loader" />

            <div v-if="loading">
              <SkeletonLoader :schedule="true" :cherryPick="true" />
            </div>
            <div v-else>
              <q-stepper
                v-model="step"
                animated
                @next="nextStep"
                @previous="previousStep"
                :contracted="this.$q.platform.is.mobile"
                done-color="positive"
                active-color="positive"
                header-class="custom-stepper-header"
              >
                <q-step
                  :name="1"
                  title="Pick a Date From and Date To"
                  icon="settings"
                  :done="step > 1"
                  prefix="1"
                  color="amber-8"
                >
                  <div
                    style="
                      display: flex;
                      justify-content: center;
                      align-items: center;
                    "
                  >
                    <q-date
                      v-model="dateRange"
                      range
                      color="blue-10"
                      style="width: 60%"
                    />
                  </div>
                </q-step>

                <q-step
                  :name="2"
                  title="Available Rooms"
                  icon="create_new_folder"
                  :done="step > 2"
                  prefix="2"
                  color="amber-8"
                >
                  <div class="row">
                    <div
                      class="q-pa-sm"
                      :class="$q.screen.gt.sm ? 'col-6' : 'col-12'"
                    >
                      <q-input
                        class="inputClass q-mb-sm"
                        v-model="searchText"
                        label="Search Name"
                        label-color="blue-10"
                        dense
                        outlined
                        standout
                        clearable
                        :class="[
                          $q.screen.name + '-text2',
                          { 'search-text': searchText.length > 0 },
                        ]"
                        @clear="clearSearchText('nameSearch')"
                      />
                    </div>
                    <div
                      class="q-pa-sm"
                      :class="$q.screen.gt.sm ? 'col-6' : 'col-12'"
                    >
                      <q-input
                        class="inputClass q-mb-sm"
                        v-model="capacitySearch"
                        label="Capacity"
                        label-color="blue-10"
                        dense
                        outlined
                        standout
                        clearable
                        type="number"
                        :class="[
                          $q.screen.name + '-text2',
                          { 'search-text': searchText.length > 0 },
                        ]"
                        @clear="clearSearchText('capacity')"
                      />
                    </div>
                  </div>

                  <availableTable
                    :computedAvailableRooms="computedAvailableRooms"
                    :dateRange="dateRange"
                    @data-emitted="handleDataEmitted"
                  />
                </q-step>

                <q-step
                  :name="3"
                  title="Room Description"
                  icon="settings"
                  :done="step > 3"
                  prefix="3"
                  color="amber-8"
                >
                  <dataCard
                    :semesterOptions="semester"
                    :roomOptions="roomType"
                    :departmentOptions="departments"
                    :selectedSemester="selectedSemester"
                    :selectedDateRange="normalizedDateRange"
                    :selectedDays="selectedDays"
                    :selectedRoomSched="selectedRoomSched"
                    :selectedDates="selectedDates"
                    @update:formData="updateFormData"
                    :classroom="true"
                    :autoBooking="false"
                  />
                </q-step>

                <q-step
                  :name="4"
                  title="Confirmation"
                  icon="create_new_folder"
                  :done="step > 4"
                  prefix="4"
                  color="amber-8"
                >
                  <div class="row">
                    <div class="col-12">
                      <p style="text-align: justify">
                        Prior to confirming the room scheduling, we strongly
                        advise reviewing all entered information meticulously.
                        Should any uncertainty arise regarding the accuracy of
                        the inputted data, it is imperative to make necessary
                        corrections before finalizing the schedule. Once
                        confident in the accuracy and completeness of the
                        information, proceed with confirming the schedule.
                      </p>
                    </div>
                  </div>
                </q-step>

                <template v-slot:navigation>
                  <q-stepper-navigation>
                    <q-btn
                      v-if="step !== 2"
                      @click="nextStep"
                      color="blue-10"
                      :label="step === 4 ? 'Confirm' : 'Continue'"
                    ></q-btn>
                    <q-btn
                      v-if="step > 1"
                      flat
                      color="blue-10"
                      @click="previousStep"
                      label="Back"
                      class="q-ml-sm"
                    ></q-btn>
                  </q-stepper-navigation>
                </template>
              </q-stepper>
            </div>
          </div>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { QSpinnerIos } from "quasar";
import helperMethods from "../helperMethods.js";
import { mapGetters } from "vuex";
import availableTable from "../components/availableRoomsTable.vue";
import dataCard from "src/components/dataCard.vue";
import SkeletonLoader from "../components/loadingSkeleton.vue";
import Loader from "../components/Loader.vue";

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
  data() {
    return {
      step: 1,
      selectedRoom: null,
      rooms: null,
      dateRange: null,
      days: daysOptions,
      selectedDays: [],
      selectedSubject: null,
      selectedSection: null,
      selectedSemester: null,
      subjects: null,
      prof: null,
      section: null,
      capacity: null,
      timeFrom: null,
      timeTo: null,
      departments: null,
      selectedDepartment: null,
      selectedDate: null,
      roomType: null,
      availableRooms: [],
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
          name: "dateRange",
          label: "Date Range",
          align: "center",
          field: "dateRange",
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
      timeDialog: false,
      selectedRoomTime: [],
      selectedRoomTimeCol: [
        {
          name: "date",
          label: "Date",
          align: "center",
          field: "date",
        },
        {
          name: "days",
          label: "Day",
          align: "center",
          field: "day",
        },
        {
          name: "availableTimeDay",
          label: "Available Time Slot",
          align: "center",
          field: "intervals",
        },
      ],
      selectedRoomSched: [],
      dateFrom: "",
      dateTo: "",
      remarks: "",
      selectedDates: [],
      searchText: "",
      loading: true,
      loadingCounter: null,
      loader: false,
      capacitySearch: null,
    };
  },

  components: {
    availableTable,
    dataCard,
    SkeletonLoader,
    Loader,
  },

  computed: {
    ...mapGetters({
      semesterOptions: "roomModule/getSemester",
      roomOptions: "roomModule/getRoomOptions",
      subjectOptions: "roomModule/getSubjectCode",
      departmentOptions: "roomModule/getDepartmentOptions",
      roomsAvailable: "roomModule/getAvailableRooms",
      sectionOptions: "roomModule/getSections",
    }),

    selectedDateString() {
      return this.selectedDates
        .map((dateObj) => `${dateObj.date} - ${dateObj.day}`)
        .join(", ");
    },

    computedAvailableRooms() {
      if (Array.isArray(this.availableRooms)) {
        const query = this.searchText.toLowerCase();
        return this.availableRooms
          .filter((row) => {
            const matchesSearch =
              (row.roomName &&
                row.roomName.toString().toLowerCase().includes(query)) ||
              (row.building &&
                row.building.toString().toLowerCase().includes(query)) ||
              (row.roomTypeDescription &&
                row.roomTypeDescription
                  .toString()
                  .toLowerCase()
                  .includes(query));

            const matchesCapacity =
              !this.capacitySearch || row.capacity >= this.capacitySearch;

            return matchesSearch && matchesCapacity;
          })
          .map((row) => {
            const dateRange = `${row.fromDate} - ${row.toDate}`;
            return {
              ...row,
              dateRange,
            };
          })
          .sort((a, b) => {
            const nameA = a.roomName || "";
            const nameB = b.roomName || "";
            const dateA = new Date(a.dateTimeCreated);
            const dateB = new Date(b.dateTimeCreated);

            const firstLetterA = nameA.charAt(0).toUpperCase();
            const firstLetterB = nameB.charAt(0).toUpperCase();

            if (firstLetterA < firstLetterB) return -1;
            if (firstLetterA > firstLetterB) return 1;

            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;

            return 0;
          });
      }
      return [];
    },

    selectedDateRange() {
      const fromDate = new Date(this.dateRange.from);
      const toDate = new Date(this.dateRange.to);

      const formattedFromDate = `${
        fromDate.getMonth() + 1
      }/${fromDate.getDate()}/${fromDate.getFullYear()}`;
      const formattedToDate = `${
        toDate.getMonth() + 1
      }/${toDate.getDate()}/${toDate.getFullYear()}`;

      return {
        from: formattedFromDate,
        to: formattedToDate,
      };
    },

    normalizedDateRange() {
      if (!this.dateRange) {
        return null;
      }

      if (typeof this.dateRange === "string") {
        return {
          from: this.dateRange,
          to: this.dateRange,
        };
      } else if (
        typeof this.dateRange === "object" &&
        this.dateRange.from &&
        this.dateRange.to
      ) {
        return this.dateRange;
      }

      return null;
    },
  },

  methods: {
    handleDataEmitted(data) {
      this.selectedDays = data.selectedDays;
      this.selectedRoomSched = data.selectedRoomSched;
      this.selectedDates = data.selectedDates;

      if (this.selectedDays.length === 0 && this.selectedDates.length === 0) {
        this.$q.notify({
          color: "negative",
          position: "center",
          message: "Please select a date / days.",
          icon: "report_problem",
          iconColor: "white",
          timeout: 2000,
          progress: true,
        });
        return;
      } else {
        this.step++;
      }
    },

    updateFormData(data) {
      this.selectedDays = data.selectedDays;
      this.selectedRoomSched = data.selectedRoomSched;
      this.selectedDates = data.selectedDates;
      this.selectedSection = data.selectedSection;
      this.selectedSemester = data.selectedSemester;
      this.selectedDepartment = data.selectedDepartment;
      this.selectedSubject = data.selectedSubject;
      this.capacity = data.capacity;
      this.prof = data.facultyName;
      this.remarks = data.remarks;
      this.timeFrom = data.timeFrom;
      this.timeTo = data.timeTo;
    },

    clearSearchText(condition) {
      if (condition === "nameSearch") {
        this.searchText = "";
      } else {
        this.capacitySearch = null;
      }
    },

    formatFreeTimeSlots(value) {
      return value.map((slot) => `${slot.day}: ${slot.intervals}`).join(", ");
    },

    showPopup(refName) {
      this.$refs[refName].show();
    },

    hidePopup(refName) {
      this.$refs[refName].hide();
    },

    clearSelectedDays() {
      this.selectedDays = [];
    },

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
        this.rooms = this.roomOptions.filter(
          (option) => option.description.toLowerCase().indexOf(needle) > -1
        );
        this.days = daysOptions.filter(
          (option) => option.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    async nextStep() {
      if (this.step < 10) {
        if (this.step === 1 && !this.dateRange) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please Pick a Date From and Date To",
            icon: "report_problem",
            iconColor: "white",
            timeout: 1000,
            progress: true,
          });
          return;
        }

        if (this.step === 1) {
          helperMethods.disablePointerEvents();
          await this.getavailableRoom();
          helperMethods.enablePointerEvents();
          this.step++;
          return;
        }

        if (this.step === 2) {
          this.dateFrom = this.selectedRoomSched.fromDate;
          this.dateTo = this.selectedRoomSched.toDate;
          // this.selectedDays = null;
          this.timeDialog = false;
        }

        if (
          this.step === 3 &&
          (!this.selectedSemester ||
            !this.selectedSubject ||
            !this.timeFrom ||
            !this.timeTo ||
            !this.remarks)
        ) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please input all the fields.",
            icon: "report_problem",
            iconColor: "white",
            timeout: 2000,
            progress: true,
          });
          return;
        }

        if (this.step === 4) {
          this.createSchedule();
          return;
        }

        this.step++;
      }
    },

    previousStep() {
      if (this.step === 1) {
        this.availableRooms = null;
        this.searchText = "";
        this.dateRange = null;
      }

      if (this.step === 2) {
        this.dateRange = null;
        this.availableRooms = null;
        this.searchText = "";
      }

      if (this.step === 3) {
        this.selectedDates = [];
        this.selectedDepartment = null;
        this.remarks = "";
        this.selectedSemester = null;
        this.selectedSubject = null;
        this.selectedSection = null;
        this.timeFrom = null;
        this.timeTo = null;
        this.remarks = null;
        this.selectedDays = null;
        this.selectedDaysToString = null;
      }

      if (this.step > 1) {
        this.step--;
      }
    },

    async getRoomTypes() {
      try {
        await this.$store.dispatch("roomModule/getRoomTypes");
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error("Failed getting all the room types");
      }
    },

    // async getSubjectCode() {
    //   try {
    //     await this.$store.dispatch("roomModule/getSubjectCode");
    //     this.loadingCounter++;
    //     if (this.loadingCounter === 3) {
    //       this.loading = false;
    //     }
    //     this.subjects = this.subjectOptions;
    //   } catch (error) {
    //     console.error("Failed getting all the subject code");
    //   }
    // },

    async getavailableRoom() {
      let data = null;
      if (this.dateRange.from && this.dateRange.to) {
        data = {
          fromDate: this.dateRange.from.replace(/\//g, "-"),
          toDate: this.dateRange.to.replace(/\//g, "-"),
        };
      } else {
        data = {
          fromDate: this.dateRange.replace(/\//g, "-"),
          toDate: this.dateRange.replace(/\//g, "-"),
        };
      }
      try {
        await this.$store.dispatch("roomModule/getAvailableRoom", data);
        this.availableRooms = this.roomsAvailable;
      } catch (error) {
        console.error("Failed to get available rooms");
      }
    },

    sharedData(data, interval, roomId) {
      return data.map((item) => {
        return {
          roomId: roomId,
          fromDate: item.date,
          toDate: item.date,
          days: item.day,
          subjectCode: this.selectedSubject,
          section: this.selectedSection ? this.selectedSection : null,
          department: this.selectedDepartment.deptCode,
          intervals: interval,
          facultyName: this.prof,
          remarks: this.remarks,
        };
      });
    },

    async dateRangeData(dateFrom, dateTo, interval, roomId) {
      return {
        roomId: roomId,
        fromDate: dateFrom,
        toDate: dateTo,
        days: await helperMethods.selectedDaysToString(this.selectedDays),
        intervals: interval,
        remarks: this.remarks,
        department: this.selectedDepartment.deptCode,
        subjectCode: this.selectedSubject,
        section: this.selectedSection ? this.selectedSection : null,
      };
    },

    async createSchedule() {
      this.$q
        .dialog({
          title: "Warning",
          message: "Are you sure you want schedule a room?",
          persistent: true,
          ok: {
            push: true,
            color: "blue-10",
            label: "Confirm",
            class: "text-subtitle1",
          },
          cancel: {
            push: true,
            color: "negative",
            label: "Cancel",
            class: "text-subtitle1",
          },
        })
        .onOk(async () => {
          const fromDate = new Date(`2000-01-01 ${this.timeFrom}`);
          const toDate = new Date(`2000-01-01 ${this.timeTo}`);

          let timeFrom24 = fromDate.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });

          let timeTo24 = toDate.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });

          if (timeFrom24 === "00:00") timeFrom24 = "24:00";
          if (timeTo24 === "00:00") timeTo24 = "24:00";

          const interval = `${timeFrom24}-${timeTo24}`;

          let allData = [];

          if (Array.isArray(this.selectedRoomSched.roomId)) {
            for (const roomId of this.selectedRoomSched.roomId) {
              let data = null;

              if (this.selectedDates.length > 0) {
                data = this.sharedData(this.selectedDates, interval, roomId);
              } else if (this.dateRange?.from || this.dateRange?.to) {
                data = await this.dateRangeData(
                  this.dateRange.from,
                  this.dateRange.to,
                  interval,
                  roomId
                );
              } else {
                data = await this.dateRangeData(
                  this.dateRange,
                  this.dateRange,
                  interval,
                  roomId
                );
              }

              if (Array.isArray(data)) {
                allData.push(...data);
              } else {
                allData.push(data);
              }
            }
          }

          try {
            this.$q.loading.show({
              spinner: QSpinnerIos,
              message: "Submitting Schedule",
              messageColor: "blue-10",
              backgroundColor: "grey-1",
              spinnerColor: "blue-10",
              customClass: "custom-loading-style",
              spinnerSize: "7em",
            });

            helperMethods.disablePointerEvents();
            await this.$store.dispatch(
              "roomModule/createCustomScheduleBooking",
              allData
            );

            this.$q.loading.hide();

            this.$q.notify({
              color: "green-8",
              position: "center",
              message: `Successfully Scheduled Room(s): ${
                Array.isArray(this.selectedRoomSched)
                  ? this.selectedRoomSched
                      .map((room) => room.roomName)
                      .join(", ")
                  : this.selectedRoomSched.roomName
              }`,
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });

            helperMethods.enablePointerEvents();
            this.loader = false;
            this.dateFrom = null;
            this.dateTo = null;
            this.remarks = null;
            this.dateRange = null;
            this.selectedRoomSched = null;
            this.timeFrom = null;
            this.timeTo = null;
            this.selectedDays = null;
            this.prof = null;
            this.selectedDepartment = null;
            this.selectedSemester = null;
            this.selectedSection = null;
            this.selectedSubject = null;
            this.capacity = null;
            this.searchText = "";
            this.step = 1;
          } catch (error) {
            this.$q.loading.hide();
            helperMethods.enablePointerEvents();

            this.$q.notify({
              color: "negative",
              position: "center",
              message:
                error.response?.data?.body ||
                "Error scheduling one or more rooms.",
              icon: "report_problem",
              iconColor: "white",
              timeout: 2000,
              progress: true,
            });
          }
        });
    },

    async getDepartments() {
      try {
        await this.$store.dispatch("roomModule/getDepartments");
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
        this.departments = this.departmentOptions;
      } catch (error) {
        console.error("Failed getting all the room types");
      }
    },

    async getSemester() {
      try {
        await this.$store.dispatch("roomModule/getSemester");
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
        this.semester = this.semesterOptions;
      } catch (error) {
        console.error("Failed To Get Semester");
      }
    },
  },

  created() {
    this.getRoomTypes();
    // this.getSubjectCode();
    this.getDepartments();
    this.getSemester();
  },
};
</script>
