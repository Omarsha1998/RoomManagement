<template>
  <Loader :isLoading="loader" />
  <div class="col-12">
    <div>
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
            style="display: flex; justify-content: center; align-items: center"
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
          title="Select Data Filters"
          icon="create_new_folder"
          :done="step > 2"
          prefix="2"
          color="amber-8"
        >
          <q-select
            class="col bg-grey-3 q-mb-xs"
            v-model="selectedRoom"
            use-input
            outlined
            input-debounce="0"
            behavior="menu"
            fill-input
            hide-selected
            clearable
            label="Room"
            @filter="filterFn"
            option-value="id"
            option-label="roomNameWithBuilding"
            :options="rooms"
          />
          <q-select
            class="col bg-grey-3 q-mb-xs"
            v-model="selectedBuilding"
            use-input
            outlined
            input-debounce="0"
            behavior="menu"
            fill-input
            hide-selected
            clearable
            label="Building"
            @filter="filterFn"
            option-value="code"
            option-label="description"
            :options="buildings"
          />
          <q-select
            class="col bg-grey-3 q-mb-xs"
            v-model="selectedDepartment"
            use-input
            outlined
            input-debounce="0"
            behavior="menu"
            fill-input
            hide-selected
            clearable
            label="Department / College"
            @filter="filterFn"
            option-value="deptLabel"
            option-label="deptLabel"
            :options="departments"
          />
          <q-select
            class="col bg-grey-3"
            v-model="selectedFormat"
            use-input
            outlined
            input-debounce="0"
            behavior="menu"
            fill-input
            hide-selected
            clearable
            label="Utilization Format"
            @filter="filterFn"
            option-value="value"
            option-label="label"
            :options="format"
          />
        </q-step>

        <q-step
          :name="3"
          title="Confirmation"
          icon="create_new_folder"
          :done="step > 3"
          prefix="2"
          color="amber-8"
        >
          <p
            class="text-subtitle2 text-bold"
            v-if="
              !dateRange &&
              !selectedRoom &&
              !selectedBuilding &&
              !selectedDepartment
            "
          >
            Please note that you did not specify a date range, room, department,
            or building. As a result, all room schedule data will be extracted
            and generated into an Excel file for your reference. <br />
            Please confirm if this is acceptable.
          </p>

          <p
            v-else-if="
              !dateRange &&
              !selectedBuilding &&
              !selectedDepartment &&
              selectedRoom
            "
          >
            Please note that you only specified a room. All data for the
            selected room's schedule will be extracted and generated into an
            Excel file. <br />
            Please confirm if this is acceptable.
          </p>

          <p
            v-else-if="
              !selectedRoom &&
              !selectedBuilding &&
              !selectedDepartment &&
              dateRange
            "
          >
            Please note that you only specified a date range. All data room
            schedule within the specified date range will be extracted and
            generated into an Excel file. <br />
            Please confirm if this is acceptable.
          </p>

          <p
            v-else-if="
              !dateRange &&
              !selectedRoom &&
              !selectedDepartment &&
              selectedBuilding
            "
          >
            Please note that you only specified a building. All data for the
            selected building's schedule will be extracted and generated into an
            Excel file. <br />
            Please confirm if this is acceptable.
          </p>

          <p
            v-else-if="
              !dateRange &&
              !selectedRoom &&
              !selectedBuilding &&
              selectedDepartment
            "
          >
            Please note that you only specified a department. All data for the
            selected department's schedule will be extracted and generated into
            an Excel file. <br />
            Please confirm if this is acceptable.
          </p>

          <p v-else>
            Please note that you have specified data. All specified / selected
            data room schedules will be extracted and generated into an Excel
            file for your reference. <br />
            Please confirm if this is acceptable.
          </p>
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <q-btn
              v-if="step !== 4"
              @click="nextStep"
              color="blue-10"
              :label="step === 3 ? 'Confirm' : 'Continue'"
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
</template>

<script>
import { mapGetters } from "vuex";
import helperMethods from "src/helperMethods";
import Loader from "../components/Loader.vue";

let formatOptions = [
  { label: "Daily", value: "Daily" },
  { label: "Weekly", value: "Weekly" },
  { label: "Monthly", value: "Monthly" },
];

export default {
  props: {
    buildingOptions: Array,
    roomOptions: Array,
    departmentOptions: Array,
    utilization: Boolean,
  },

  data() {
    return {
      step: 1,
      dateRange: null,
      schedules: [],
      loading: true,
      loadingCounter: null,
      selectedRoom: null,
      selectedBuilding: null,
      selectedDepartment: null,
      selectedFormat: null,
      buildings: null,
      rooms: null,
      departments: null,
      format: null,
      w: undefined,
      loader: false,
      util: this.utilization,
    };
  },

  components: {
    Loader,
  },

  computed: {
    ...mapGetters({
      allScheduledView: "roomModule/getScheduledRoomView",
    }),
  },

  methods: {
    async nextStep() {
      if (this.step === 2) {
        if (!this.selectedFormat) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please choose a format for the report.",
            icon: "report_problem",
            iconColor: "white",
            timeout: 1500,
            progress: true,
          });
          return;
        }
      }

      if (this.step === 3) {
        helperMethods.disablePointerEvents();
        await this.getScheduledRoomView();
        helperMethods.enablePointerEvents();
        return;
      }
      this.step++;
    },

    previousStep() {
      if (this.step > 1) {
        this.step--;
      }
    },

    filterFn(val, update) {
      if (val === "") {
        update(() => {
          this.rooms = this.roomOptions;
          this.departments = this.departmentOptions;
          this.buildings = this.buildingOptions;
          this.format = formatOptions;
        });
        return;
      }
      update(() => {
        const needle = val.toLowerCase();
        this.rooms = this.roomOptions.filter(
          (option) => option.roomName.toLowerCase().indexOf(needle) > -1
        );
        this.departments = this.departmentOptions.filter(
          (option) => option.deptLabel.toLowerCase().indexOf(needle) > -1
        );
        this.buildings = this.buildingOptions.filter(
          (option) => option.description.toLowerCase().indexOf(needle) > -1
        );
        this.format = this.format.filter(
          (option) => option.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    async getScheduledRoomView() {
      const data = {
        room: this.selectedRoom === null ? null : this.selectedRoom.id,
        department:
          this.selectedDepartment === null
            ? null
            : this.selectedDepartment.deptCode,
        building:
          this.selectedBuilding === null ? null : this.selectedBuilding.code,
        fromDate:
          this.dateRange === null
            ? null
            : this.dateRange.from.replace(/\//g, "-"),
        toDate:
          this.dateRange === null
            ? null
            : this.dateRange.to.replace(/\//g, "-"),
      };

      const type =
        this.selectedFormat === null ? null : this.selectedFormat.value;

      try {
        await this.$store.dispatch("roomModule/getScheduledRoomView", data);
        const scheduleData = await JSON.parse(
          JSON.stringify(this.allScheduledView)
        );
        const loading = this.$q.loading;
        const notify = this.$q.notify;

        this.loader = true;

        if (typeof Worker !== "undefined") {
          if (typeof this.w === "undefined") {
            if (this.util) {
              this.w = new Worker(
                new URL("../store/workUtil.js", import.meta.url)
              );
            } else {
              this.w = new Worker(
                new URL("../store/trialWorker.js", import.meta.url)
              );
            }
          }

          this.w.postMessage({ type, data: scheduleData });

          this.w.onmessage = (event) => {
            this.loader = false;
            if (event.data.success) {
              const blob = event.data.result;
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `${type}_Report.xlsx`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              notify({
                color: "green-8",
                position: "center",
                message:
                  "Success Generating Report, Please do check your download file and do save it.",
                icon: "check",
                iconColor: "white",
                timeout: 1500,
                progress: true,
              });
              this.step = 1;
              this.selectedFormat = null;
              this.selectedBuilding = null;
              this.selectedDepartment = null;
              this.selectedRoom = null;
              this.dateRange = null;
            } else {
              this.loader = false;
              notify({
                color: "warning",
                position: "center",
                message: "Failed on generating report",
                icon: "check",
                iconColor: "white",
                timeout: 1500,
                progress: true,
              });
            }
          };
        } else {
          document.getElementById("result").innerText =
            "Sorry, your browser does not support Web Workers...";
        }
      } catch (error) {
        console.error(error);
      }
    },

    async performTask() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulating a delay
      } catch (error) {
        console.error("Error during task", error);
      } finally {
        // Hide the loader
        this.loading = false;
      }
    },
  },
};
</script>
