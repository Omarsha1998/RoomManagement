<template>
  <q-layout>
    <q-page-container>
      <div class="container">
        <div class="row" style="width: 95%">
          <div class="col-12 q-pt-lg">
            <Loader :isLoading="loader" />

            <div v-if="loading">
              <SkeletonLoader :schedule="true" :bookedRooms="false" />
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
                  title="Choose a Date Range"
                  icon="create_new_folder"
                  :done="step > 1"
                  prefix="1"
                  color="amber-8"
                >
                  <div class="row">
                    <div
                      class="col-12 q-mb-lg"
                      style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      "
                    >
                      <q-date
                        color="blue-10"
                        v-model="dateRange"
                        range
                        style="width: 60%"
                      ></q-date>
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
                  <dataCard
                    :semesterOptions="semester"
                    :subjectOptions="subjects"
                    :roomOptions="roomType"
                    :departmentOptions="departments"
                    :selectedSemester="selectedSemester"
                    :selectedDateRange="normalizedDateRange"
                    :selectedRoomSched="selectedRoomSched"
                    :selectedDates="selectedDates"
                    @update:formData="updateFormData"
                    :classroom="true"
                    :autoBooking="true"
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
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { QSpinnerIos } from "quasar";
import helperMethods from "../helperMethods.js";
import { mapGetters } from "vuex";
import bookComponent from "../components/bookingComponent.vue";
import dataCard from "../components/dataCard.vue";
import SkeletonLoader from "../components/loadingSkeleton.vue";
import Loader from "../components/Loader.vue";

export default {
  data() {
    return {
      step: 1,
      dateRange: null,
      timeFrom: null,
      timeTo: null,
      semester: [],
      subjects: null,
      roomType: null,
      departments: null,
      selectedSemester: null,
      formData: {},
      selectedDates: [],
      selectedRoomSched: [],
      loading: true,
      loadingCounter: null,
      loader: false,
    };
  },

  components: {
    bookComponent,
    dataCard,
    SkeletonLoader,
    Loader,
  },

  computed: {
    ...mapGetters({
      semesterOptions: "roomModule/getSemester",
      subjectOptions: "roomModule/getSubjectCode",
      roomOptions: "roomModule/getRoomOptions",
      departmentOptions: "roomModule/getDepartmentOptions",
    }),

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
    updateFormData(newFormData) {
      this.formData = newFormData;
    },
    nextStep() {
      if (this.step < 10) {
        if (this.step === 1 && !this.dateRange && !this.selectedSemester) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please pick a date Range / Semester",
            icon: "report_problem",
            iconColor: "white",
            timeout: 1000,
            progress: true,
          });

          return;
        }

        if (
          this.step === 2 &&
          (!this.formData.selectedSubject ||
            !this.formData.selectedDays ||
            !this.formData.selectedSection ||
            !this.formData.selectedRoomType ||
            !this.formData.remarks)
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

      if (this.step === 1) {
        this.dateRange = null;
        this.selectedSemester = null;
      }
      if (this.step === 2) {
        this.formData = {};
      }
    },

    async getSemester() {
      try {
        await this.$store.dispatch("roomModule/getSemester");
        this.loadingCounter++;
        if (this.loadingCounter === 4) {
          this.loading = false;
        }
        this.semester = this.semesterOptions;
      } catch (error) {
        console.error("Failed To Get Semester");
      }
    },

    async getSubject() {
      try {
        await this.$store.dispatch("roomModule/getSubjectCode");
        this.loadingCounter++;
        if (this.loadingCounter === 4) {
          this.loading = false;
        }
        this.subjects = this.subjectOptions;
      } catch (error) {
        console.error("Failed To Get Subjects");
      }
    },

    async getRoomTypes() {
      try {
        await this.$store.dispatch("roomModule/getRoomTypes");
        this.loadingCounter++;
        if (this.loadingCounter === 4) {
          this.loading = false;
        }
        this.roomType = this.roomOptions;
      } catch (error) {
        console.error("Failed To Get Room Types");
      }
    },

    async getDepartments() {
      try {
        await this.$store.dispatch("roomModule/getDepartments");
        this.loadingCounter++;
        if (this.loadingCounter === 4) {
          this.loading = false;
        }
        this.departments = this.departmentOptions;
      } catch (error) {
        console.error("Failed To Get Departments");
      }
    },

    selectedDaysString(selectedDays) {
      return selectedDays.map((day) => day.value).join(",");
    },

    async dateRangeData(dateFrom, dateTo) {
      return {
        roomType: this.formData.selectedRoomType.code,
        fromDate: dateFrom.replace(/\//g, "-"),
        toDate: dateTo.replace(/\//g, "-"),
        subjectCode: this.formData.selectedSubject,
        days: this.selectedDaysString(this.formData.selectedDays),
        department: this.formData.selectedDepartment.deptLabel,
        section: this.formData.selectedSection,
        professor: this.formData.facultyName,
        capacity: this.formData.capacity,
        remarks: this.formData.remarks,
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
          let data = {};

          if (this.dateRange) {
            if (this.dateRange.from || this.dateRange.to) {
              data = await this.dateRangeData(
                this.dateRange.from,
                this.dateRange.to
              );
            } else {
              data = await this.dateRangeData(this.dateRange, this.dateRange);
            }
          } else {
            data = {
              roomType: this.formData.selectedRoomType.code,
              semester: this.selectedSemester.sEM_CODE,
              subjectCode: this.formData.selectedSubject.subjectCode,
              days: this.selectedDaysString(this.formData.selectedDays),
              department: this.formData.selectedDepartment.deptLabel,
              section: this.formData.selectedSection.section,
              professor: this.formData.facultyName,
              capacity: this.formData.capacity,
              remarks: this.formData.remarks,
            };
          }

          try {
            // this.$q.loading.show({
            //   spinner: QSpinnerIos,
            //   message: "Submitting Schedule",
            //   messageColor: "blue-10",
            //   backgroundColor: "grey-1",
            //   spinnerColor: "blue-10",
            //   customClass: "custom-loading-style",
            //   spinnerSize: "7em",
            // });
            this.loader = true;
            helperMethods.disablePointerEvents();

            await this.$store.dispatch(
              "roomModule/createAutoRoomSchedule",
              data
            );
            // this.$q.loading.hide();
            this.loader = false;
            this.$q.notify({
              color: "green-8",
              position: "center",
              message: "Success Scheduling Room",
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });
            helperMethods.enablePointerEvents();
            this.formData = {};
            this.selectedSemester = null;
            this.dateRange = null;
            this.step = 1;
          } catch (error) {
            // this.$q.loading.hide();
            this.loader = false;
            helperMethods.enablePointerEvents();
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
  },

  created() {
    this.getSemester();
    this.getSubject();
    this.getRoomTypes();
    this.getDepartments();
  },
};
</script>
