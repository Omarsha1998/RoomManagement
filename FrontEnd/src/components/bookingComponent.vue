<template>
  <q-stepper
    v-model="step"
    animated
    @next="nextStep"
    @previous="previousStep"
    :contracted="this.$q.platform.is.mobile"
    done-color="green"
    header-class="custom-stepper-header"
  >
    <q-step
      :name="1"
      title="Choose a Semester"
      icon="create_new_folder"
      :done="step > 1"
      prefix="1"
      color="amber-8"
    >
      <div class="row">
        <!-- <div
          class="col-12 q-mb-lg"
          style="display: flex; justify-content: center; align-items: center"
        >
          <q-date
            color="blue-10"
            v-model="dateRange"
            range
            style="width: 60%"
          ></q-date>
        </div> -->
        <div
          class="col-12 rounded"
          style="display: flex; justify-content: center; align-items: center"
        >
          <q-card
            :class="[
              $q.screen.name + '-text',
              $q.screen.name + '-width',
              $q.screen.name + '-min-height',
            ]"
          >
            <q-card-section class="bg-amber-8"> Semester </q-card-section>
            <q-card-section>
              <q-select
                class="bg-grey-3 q-mb-xs"
                v-model="selectedSemester"
                label="Semester"
                filled
                use-input
                behavior="menu"
                clearable
                :options="semester"
                input-debounce="0"
                option-value="sEM_CODE"
                option-label="sEM_DESC"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-step>

    <q-step
      :name="2"
      title="Subject Description"
      icon="settings"
      :done="step > 2"
      prefix="2"
      color="amber-8"
    >
      <q-select
        filled
        v-model="selectedSubject"
        use-input
        input-debounce="0"
        label="Subject Description - Subject Code"
        :options="subjects"
        behavior="menu"
        fill-input
        @filter="filterFn"
        @update:model-value="getSections()"
        clearable
        hide-selected
        class="bg-grey-3 q-mb-xs"
        option-value="subjectCode"
        option-label="subjectCodeDescription"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-select
        filled
        v-model="selectedRoom"
        use-input
        input-debounce="0"
        label="Room Type"
        :options="rooms"
        behavior="menu"
        fill-input
        @filter="filterFn"
        clearable
        hide-selected
        class="bg-grey-3 q-mb-xs"
        option-value="code"
        option-label="description"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>

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
        class="bg-grey-3 q-mb-xs"
        option-value="value"
        option-label="label"
        multiple
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-select
        filled
        v-model="selectedSection"
        use-input
        input-debounce="0"
        label="Section - Semester"
        :options="section"
        style="margin-bottom: 5px"
        behavior="menu"
        fill-input
        @filter="filterFn"
        clearable
        hide-selected
        class="bg-grey-3"
        option-value="secsem"
        option-label="secsem"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-select
        filled
        v-model="selectedDepartment"
        use-input
        input-debounce="0"
        label="Department"
        :options="departments"
        style="margin-bottom: 5px"
        behavior="menu"
        fill-input
        @filter="filterFn"
        clearable
        hide-selected
        class="bg-grey-3"
        option-value="deptCode"
        option-label="deptLabel"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-input
        class="bg-grey-3 q-mb-xs"
        filled
        label="Faculty Name"
        v-model="prof"
      />

      <q-input
        class="bg-grey-3 q-mb-xs"
        filled
        label="Capacity"
        type="number"
        v-model="capacity"
      />
      <q-input
        class="bg-grey-3 q-mb-xs"
        filled
        label="Remarks"
        v-model="remarks"
        type="text-area"
      />
    </q-step>

    <q-step
      :name="3"
      title="Confirmation"
      icon="create_new_folder"
      :done="step > 3"
      prefix="3"
      color="amber-8"
    >
      <div class="row">
        <div class="col-12">
          <p style="text-align: justify">
            Prior to confirming the room scheduling, we strongly advise
            reviewing all entered information meticulously. Should any
            uncertainty arise regarding the accuracy of the inputted data, it is
            imperative to make necessary corrections before finalizing the
            schedule. Once confident in the accuracy and completeness of the
            information, proceed with confirming the schedule.
          </p>
        </div>
      </div>
    </q-step>

    <template v-slot:navigation>
      <q-stepper-navigation>
        <q-btn
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
</template>

<script>
import { QSpinnerIos } from "quasar";
import helperMethods from "../helperMethods.js";
import { mapGetters } from "vuex";

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
    roomOptions: Array,
    departmentOptions: Array,
    subjectOptions: Array,
    class: Boolean,
  },

  data() {
    return {
      step: 1,
      selectedRoom: null,
      rooms: null,
      dateRange: null,
      days: daysOptions,
      sections: [],
      selectedDays: [],
      selectedSubject: null,
      subjects: null,
      prof: null,
      section: null,
      capacity: null,
      timeFrom: null,
      timeTo: null,
      departments: null,
      selectedDepartment: null,
      selectedSection: null,
      remarks: null,
      semester: [],
      selectedSemester: null,
    };
  },

  computed: {
    ...mapGetters({
      sectionOptions: "roomModule/getSections",
      semesterOptions: "roomModule/getSemester",
    }),
    selectedDaysString() {
      return this.selectedDays.map((day) => day.value).join(",");
    },
  },

  methods: {
    showPopup(refName) {
      this.$refs[refName].show();
    },

    hidePopup(refName) {
      this.$refs[refName].hide();
    },

    filterFn(val, update) {
      if (val === "") {
        update(() => {
          this.rooms = this.roomOptions;
          this.days = daysOptions;
          this.subjects = this.subjectOptions;
          this.departments = this.departmentOptions;
          this.section = this.sectionOptions;
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
        this.subjects = this.subjectOptions.filter(
          (option) =>
            option.subjectCodeDescription.toLowerCase().indexOf(needle) > -1
        );
        this.departments = this.departmentOptions.filter(
          (option) => option.deptLabel.toLowerCase().indexOf(needle) > -1
        );
        this.section = this.sectionOptions.filter(
          (option) => option.section.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    nextStep() {
      if (this.step < 10) {
        // if (this.step === 1 && !this.selectedRoom) {
        //   this.$q.notify({
        //     color: "negative",
        //     position: "center",
        //     message: "Please Choose a Room Type",
        //     icon: "report_problem",
        //     iconColor: "white",
        //     timeout: 1000,
        //     progress: true,
        //   });
        //   return;
        // }

        if (this.step === 1 && !this.semester) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please pick a date from and date to",
            icon: "report_problem",
            iconColor: "white",
            timeout: 1000,
            progress: true,
          });
          return;
        }

        if (
          this.step === 2 &&
          (!this.selectedSubject ||
            !this.selectedDays ||
            !this.section ||
            !this.prof ||
            !this.selectedRoom ||
            !this.remarks)
        ) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please put all the required field",
            icon: "report_problem",
            iconColor: "white",
            timeout: 1000,
            progress: true,
          });
          return;
        }

        if (this.step === 3) {
          this.createSchedule();
          return;
        }

        this.step++;
      }
    },

    previousStep() {
      if (this.step > 1) {
        this.step--;
      }
    },

    async getSections() {
      try {
        if (!this.selectedSubject) {
          return;
        }
        const data = {
          subjectCode: this.selectedSubject.subjectCode,
        };
        await this.$store.dispatch("roomModule/getSections", data);
        this.section = this.sectionOptions;
      } catch (error) {
        console.error("Failed To Get Sections");
      }
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
          // const fromDate = new Date(`2000-01-01 ${this.timeFrom}`);
          // const toDate = new Date(`2000-01-01 ${this.timeTo}`);

          // const timeFrom24 = fromDate.toLocaleTimeString("en-US", {
          //   hour12: false,
          //   hour: "2-digit",
          //   minute: "2-digit",
          // });
          // const timeTo24 = toDate.toLocaleTimeString("en-US", {
          //   hour12: false,
          //   hour: "2-digit",
          //   minute: "2-digit",
          // });

          // const interval = `${timeFrom24}-${timeTo24}`;

          const data = {
            roomType: this.selectedRoom.code,
            // fromDate: this.dateRange.from,
            // toDate: this.dateRange.to,
            semester: this.selectedSemester.sEM_CODE,
            subjectCode: this.selectedSubject.subjectCode,
            days: this.selectedDaysString,
            department: this.selectedDepartment.deptLabel,
            section: this.selectedSection.section,
            professor: this.prof,
            capacity: this.capacity,
            // timeFrom: this.timeFrom,
            // timeTo: this.timeTo,
            // interval: interval,
            remarks: this.remarks,
          };

          this.$q.loading.show({
            spinner: QSpinnerIos,
            message: "Submitting Schedule",
            messageColor: "blue-10",
            backgroundColor: "grey-1",
            spinnerColor: "blue-10",
            customClass: "custom-loading-style",
            spinnerSize: "7em",
          });

          try {
            await this.$store.dispatch("roomModule/createSchedule", data);
            this.$q.loading.hide();
            this.$q.notify({
              color: "green-8",
              position: "center",
              message: "Success Scheduling Room",
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });
            helperMethods.disablePointerEvents(2000);
            this.selectedRoom = null;
            this.dateRange = null;
            this.selectedSubject = null;
            this.selectedDays = null;
            this.selectedSection = null;
            this.prof = null;
            this.selectedDepartment = null;
            this.capacity = null;
            this.timeFrom = null;
            this.timeTo = null;
            this.remarks = null;
            this.semester = null;
            this.step = 1;
          } catch (error) {
            this.$q.loading.hide();
            if (error.response.status == "400") {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: error.response.data.body,
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            } else {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: "Error Scheduling Room",
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            }
          }
        })
        .onDismiss(() => {});
    },

    async getSemester() {
      await this.$store.dispatch("roomModule/getSemester");
      this.semester = this.semesterOptions;
    },
  },

  created() {
    this.getSemester();
  },
};
</script>
