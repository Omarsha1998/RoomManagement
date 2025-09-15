<template>
  <div class="container">
    <div class="row" style="width: 95%">
      <div class="col-12">
        <div>
          <q-input
            v-if="selectedDates.length === 0"
            v-model="selectedDateRange.from"
            class="bg-grey-3"
            outlined
            label="Date From"
            style="margin-bottom: 5px"
            readonly
          >
          </q-input>

          <q-input
            v-if="selectedDates.length === 0"
            v-model="selectedDateRange.to"
            class="bg-grey-3"
            outlined
            label="Date To"
            style="margin-bottom: 5px"
            readonly
          >
          </q-input>
          <q-input
            v-else
            v-model="selectedDateString"
            class="bg-grey-3"
            outlined
            label="Selected Dates"
            style="margin-bottom: 5px"
            readonly
          />
          <div v-if="autoBooking === false">
            <!-- <q-input
              readonly
              label="Room Type"
              class="bg-grey-3"
              outlined
              v-model="selectedRoomSched.roomTypeDescription"
              style="margin-bottom: 5px"
            /> -->

            <q-input
              readonly
              label="Room"
              class="bg-grey-3"
              outlined
              v-model="selectedRoomSched.roomName"
              style="margin-bottom: 5px"
            />

            <!-- <q-input
              readonly
              label="Building"
              class="bg-grey-3"
              outlined
              v-model="selectedRoomSched.building"
              style="margin-bottom: 5px"
            /> -->

            <q-select
              v-if="selectedDates.length === 0"
              outlined
              v-model="selectedDaysString"
              use-input
              input-debounce="0"
              label="Days"
              behavior="menu"
              fill-input
              clearable
              class="bg-grey-3 q-mb-sm"
              option-value="value"
              option-label="label"
              multiple
              readonly
            />
          </div>

          <!-- <div v-if="autoBooking === true">
            <q-input
              v-if="selectedDates.length === 0"
              v-model="selectedDateRange.from"
              class="bg-grey-3"
              outlined
              label="Date From"
              style="margin-bottom: 5px"
              readonly
            >
            </q-input>
            <q-input
              v-if="selectedDates.length === 0"
              v-model="selectedDateRange.to"
              class="bg-grey-3"
              outlined
              label="Date To"
              style="margin-bottom: 5px"
              readonly
            >
            </q-input>
          </div> -->

          <q-select
            outlined
            v-model="formData.selectedDepartment"
            use-input
            input-debounce="0"
            label="Department"
            :options="departments"
            style="margin-bottom: 5px"
            behavior="menu"
            fill-input
            @filter="filterFn"
            clearable
            class="bg-grey-3"
            option-value="deptCode"
            option-label="deptLabel"
            hide-selected
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div v-if="classroom">
            <!-- <q-select
              class="bg-grey-3 q-mb-xs"
              v-model="formData.selectedSemester"
              label="Semester"
              outlined
              use-input
              behavior="menu"
              clearable
              :options="semesterOptions"
              input-debounce="0"
              option-value="sEM_CODE"
              option-label="sEM_DESC"
            /> -->
            <!-- <q-select
              outlined
              v-model="formData.selectedDepartment"
              use-input
              input-debounce="0"
              label="Department"
              :options="departments"
              style="margin-bottom: 5px"
              behavior="menu"
              fill-input
              @filter="filterFn"
              clearable
              class="bg-grey-3"
              option-value="deptCode"
              option-label="deptLabel"
              hide-selected
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
            </q-select> -->

            <q-select
              class="bg-grey-3 q-mb-xs"
              v-model="formData.selectedSemester"
              label="Semester"
              outlined
              use-input
              behavior="menu"
              clearable
              @filter="filterFn"
              :options="semester"
              input-debounce="0"
              @update:model-value="(val) => getSubjectCode(val)"
              option-value="sEM_CODE"
              option-label="semYear"
              :disable="!formData.selectedDepartment"
            />

            <q-select
              v-model="formData.selectedSubject"
              class="bg-grey-3 q-mb-xs"
              label="Course Code - Course Description"
              use-input
              clearable
              input-debounce="0"
              outlined
              :options="subjects"
              behavior="menu"
              fill-input
              @filter="filterFn"
              hide-selected
              @update:model-value="getSections()"
              option-value="subjectCode"
              option-label="subjectCodeDescription"
              :disable="!formData.selectedSemester"
            />

            <q-select
              v-if="classroom"
              v-model="formData.selectedSection"
              use-input
              outlined
              behavior="menu"
              clearable
              label="Section"
              class="bg-grey-3 q-mb-xs"
              input-debounce="0"
              @filter="filterFn"
              option-value="section"
              option-label="section"
              :options="section"
              multiple
              :disable="!formData.selectedSubject"
            />

            <!-- <q-btn
              @click="sectionSubject = true"
              align="left"
              class="bg-grey-4 q-mb-xs text-grey-7 full-width"
              style="height: 50px; margin-bottom: 7px"
            >
              <div class="row no-wrap items-center justify-between full-width">
                <div>Subject and Section</div>
                <q-icon name="add" />
              </div>
            </q-btn> -->

            <!-- <q-select
              v-model="formData.selectedSubject"
              class="bg-grey-3 q-mb-xs"
              label="Subject Description - Subject Code"
              use-input
              clearable
              input-debounce="0"
              outlined
              :options="subjects"
              behavior="menu"
              fill-input
              @filter="filterFn"
              hide-selected
              @update:model-value="getSections()"
              option-value="subjectCode"
              option-label="subjectCodeDescription"
              multiple
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">No Results</q-item-section>
                </q-item>
              </template>
            </q-select> -->
          </div>

          <q-select
            v-if="selectedRoomSched.length === 0"
            label="Room Type"
            outlined
            hide-selected
            behavior="menu"
            class="bg-grey-3 q-mb-xs"
            v-model="formData.selectedRoomType"
            use-input
            input-debounce="0"
            fill-input
            @filter="filterFn"
            clearable
            :options="roomType"
            option-value="code"
            option-label="description"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No Result </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-if="autoBooking"
            outlined
            v-model="formData.selectedDays"
            use-input
            input-debounce="0"
            label="Days"
            behavior="menu"
            fill-input
            clearable
            multiple
            @filter="filterFn"
            class="bg-grey-3 q-mb-xs"
            option-value="value"
            option-label="label"
            :options="days"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No Result </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- <q-select
            v-if="classroom"
            v-model="formData.selectedSection"
            use-input
            outlined
            fill-input
            behavior="menu"
            clearable
            label="Section - Semester"
            class="bg-grey-3 q-mb-xs"
            input-debounce="0"
            hide-selected
            @filter="filterFn"
            option-value="secsem"
            option-label="secsem"
            :options="section"
          >
          </q-select> -->

          <div v-if="autoBooking === false">
            <q-input
              class="bg-grey-3"
              outlined
              label="Start Time"
              v-model="formData.timeFrom"
              @click="showPopup('TimeFromPopup')"
              style="margin-bottom: 5px"
            >
              <template v-slot:append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy ref="TimeFromPopup" :breakpoint="1440" cover>
                    <div class="q-date-container">
                      <q-time
                        v-model="formData.timeFrom"
                        mask="h:mm A"
                      ></q-time>
                      <q-btn
                        push
                        icon="close"
                        @click="hidePopup('TimeFromPopup')"
                        class="bg-white absolute-top-right"
                        round
                        padding="xs"
                        style="margin: 10px"
                      ></q-btn>
                    </div>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              class="bg-grey-3"
              outlined
              label="End Time"
              v-model="formData.timeTo"
              @click="showPopup('TimeToPopup')"
              style="margin-bottom: 5px"
            >
              <template v-slot:append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy ref="TimeToPopup" :breakpoint="1440" cover>
                    <div class="q-date-container">
                      <q-time v-model="formData.timeTo" mask="h:mm A"></q-time>
                      <q-btn
                        push
                        icon="close"
                        @click="hidePopup('TimeToPopup')"
                        class="bg-white absolute-top-right"
                        round
                        padding="xs"
                        style="margin: 10px"
                      ></q-btn>
                    </div>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div v-if="classroom">
            <q-input
              label="Faculty Name"
              outlined
              v-model="formData.facultyName"
              class="bg-grey-3 q-mb-xs"
            />
          </div>

          <q-input
            v-if="autoBooking"
            label="Capacity"
            outlined
            v-model="formData.capacity"
            class="bg-grey-3 q-mb-xs"
            type="number"
          />

          <q-input
            outlined
            label="Remarks"
            v-model="formData.remarks"
            class="bg-grey-3"
          />
        </div>
      </div>

      <q-dialog v-model="sectionSubject">
        <q-card
          class="virtual-scroll"
          style="min-width: 700px; max-height: 700px"
          :class="[$q.screen.name + '-text']"
        >
          <q-card-section class="bg-blue-10 row items-center q-pb-sm">
            <div class="text-h6 text-white text-bold">Subject and Section</div>
            <q-space></q-space>
            <q-btn
              class="bg-white"
              icon="close"
              push
              round
              dense
              padding="xs"
              v-close-popup
            ></q-btn>
          </q-card-section>
          <q-card-section>
            <q-btn
              align="right"
              class="bg-grey-4 text-grey-7"
              @click="addSection"
            >
              <div class="row no-wrap items-center justify-between full-width">
                <div>Add</div>
                <q-icon name="add" />
              </div>
            </q-btn>
            <div
              v-for="(subjectAndSections, index) in subjectAndSections"
              :key="index"
              class="q-mt-sm"
            >
              <q-card class="rounded">
                <q-card-section class="bg-amber-8 row items-center q-pb-md">
                  <div class="text-h6 text-blue-10 text-bold">
                    {{ getOrdinalWord(index) }}
                  </div>
                </q-card-section>

                <q-card-section>
                  <q-select
                    class="bg-grey-3 q-mb-xs"
                    v-model="subjectAndSections.semester"
                    label="Semesterss"
                    outlined
                    use-input
                    behavior="menu"
                    clearable
                    :options="semester"
                    input-debounce="0"
                    option-value="sEM_CODE"
                    option-label="semDesc"
                  />
                  <q-select
                    v-model="subjectAndSections.subjectCode"
                    class="bg-grey-3 q-mb-xs"
                    label="Subject Description - Subject Code"
                    use-input
                    clearable
                    input-debounce="0"
                    outlined
                    :options="subjects"
                    behavior="menu"
                    fill-input
                    @filter="filterFn"
                    hide-selected
                    @update:model-value="getSections()"
                    option-value="subjectCode"
                    option-label="subjectCodeDescription"
                  />

                  <q-select
                    v-if="classroom"
                    v-model="subjectAndSections.section"
                    use-input
                    outlined
                    fill-input
                    behavior="menu"
                    clearable
                    label="Section"
                    class="bg-grey-3 q-mb-xs"
                    input-debounce="0"
                    @filter="filterFn"
                    option-value="secsem"
                    option-label="secsem"
                    :options="section"
                    multiple
                  />
                </q-card-section>
              </q-card>
            </div>

            <q-card-section label="First"> </q-card-section>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import helperMethods from "src/helperMethods";

let dOptions = [
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
    semesterOptions: Array,
    // subjectOptions: Array,
    roomOptions: Array,
    departmentOptions: Array,
    selectedSemester: Object,
    selectedDateRange: Object,
    String,
    selectedDays: Object,
    selectedRoomSched: Object,
    selectedDates: Object,
    classroom: Boolean,
    autoBooking: Boolean,
    class: Boolean,
    value: Object,
  },

  data() {
    return {
      formData: {
        selectedSubject: null,
        selectedRoomType: null,
        selectedDays: null,
        selectedSection: null,
        selectedDepartment: null,
        selectedSemester: null,
        capacity: null,
        remarks: null,
        facultyName: null,
        timeFrom: null,
        timeTo: null,
        selectedDates: this.selectedDates,
        selectedDays: this.selectedDays,
        selectedRoomSched: this.selectedRoomSched,
      },
      days: dOptions,
      semester: null,
      subjects: null,
      roomType: null,
      section: null,
      departments: null,
      sectionSubject: false,
      subjectAndSections: [],
    };
  },

  computed: {
    ...mapGetters({
      sectionOptions: "roomModule/getSections",
      subjectOptions: "roomModule/getSubjectCode",
    }),
    selectedDaysString() {
      return this.selectedDays.map((day) => day.label).join(", ");
    },

    selectedDateString() {
      return this.selectedDates
        .map(
          (dateObj) =>
            `${dateObj.date} - ${helperMethods.getFullDayName(dateObj.day)}`
        )
        .join(", ");
    },

    selectedSubjectMultiple() {
      if (!this.subjectAndSections || this.subjectAndSections.length === 0) {
        return "";
      }
      return this.subjectAndSections
        .map((item) => item.subjectCode?.subjectCode || "")
        .filter((code) => code)
        .join(",");
    },
    selectedSectionMultiple() {
      if (!this.subjectAndSections || this.subjectAndSections.length === 0) {
        return "";
      }

      const sections = this.subjectAndSections[0].section;

      if (!sections || sections.length === 0) {
        return "";
      }

      if (sections.length === 1) {
        return sections[0].section;
      } else {
        return sections.map((sec) => sec.section).join(",");
      }
    },

    formattedSelectedSection() {
      if (
        this.formData.selectedSection &&
        Array.isArray(this.formData.selectedSection)
      ) {
        return this.formData.selectedSection
          .map((section) => section.section)
          .join(",");
      }
      return "";
    },

    formattedSelectedSubject() {
      if (
        this.formData.selectedSubject &&
        Array.isArray(this.formData.selectedSubject)
      ) {
        return this.formData.selectedSubject.map(
          (subject) => subject.subjectCode
        );
      }
    },

    formattedSubjectCode() {
      return this.formData.selectedSubject?.subjectCode || "";
    },

    // selectedSubjectsDisplay() {
    //   return this.formData.selectedSubject
    //     .map(
    //       (subject) =>
    //         `${subject.subjectCodeDescription} - ${subject.subjectCode}`,
    //     )
    //     .join(", ");
    // },
  },

  methods: {
    closeSectionSubject() {
      this.sectionSubject = false;
    },

    addSection() {
      const lastSection =
        this.subjectAndSections[this.subjectAndSections.length - 1];

      if (lastSection) {
        if (
          !lastSection.subjectCode ||
          !lastSection.section ||
          !lastSection.semester
        ) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: "Please input the field of recent add.",
            icon: "report_problem",
            iconColor: "white",
            timeout: 2000,
            progress: true,
          });
          return;
        }
      }
      this.subjectAndSections.push([
        {
          semester: "",
          subjectCode: "",
          sectionSemester: "",
        },
      ]);
    },

    getOrdinalWord(n) {
      const ordinalWords = [
        "First",
        "Second",
        "Third",
        "Fourth",
        "Fifth",
        "Sixth",
        "Seventh",
        "Eighth",
        "Ninth",
        "Tenth",
        "Eleventh",
        "Twelfth",
        "Thirteenth",
        "Fourteenth",
        "Fifteenth",
      ];
      return ordinalWords[n] || `Ordinal ${n + 1}`;
    },

    showPopup(refName) {
      this.$refs[refName].show();
    },

    hidePopup(refName) {
      this.$refs[refName].hide();
    },

    filterFn(val, update) {
      const dayOptions = dOptions || [];
      const subjectOptions = this.subjectOptions || [];
      const roomOptions = this.roomOptions || [];
      const sectionOptions = this.sectionOptions || [];
      const departmentOptions = this.departmentOptions || [];
      const semesterOptions = this.semesterOptions || [];

      if (val === "") {
        update(() => {
          this.days = dOptions || [];
          this.subjects = subjectOptions;
          this.roomType = roomOptions;
          this.section = sectionOptions;
          this.departments = departmentOptions;
          this.semester = semesterOptions;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();

        this.days = dOptions.filter(
          (option) => option.label?.toLowerCase().indexOf(needle) > -1
        );
        this.subjects = subjectOptions.filter(
          (option) =>
            option.subjectCodeDescription?.toLowerCase().indexOf(needle) > -1
        );
        this.roomType = roomOptions.filter(
          (option) => option.description?.toLowerCase().indexOf(needle) > -1
        );
        this.section = sectionOptions.filter(
          (option) => option.secsem?.toLowerCase().indexOf(needle) > -1
        );
        this.departments = departmentOptions.filter(
          (option) => option.deptLabel?.toLowerCase().indexOf(needle) > -1
        );
        this.semester = semesterOptions.filter(
          (option) =>
            option.semDesc?.toLowerCase().indexOf(needle) > -1 ||
            option.semYear?.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    async getSubjectCode(selectedSemester) {
      try {
        const data = {
          semester:
            this.formData.selectedSemester.semYearFrom +
            this.formData.selectedSemester.semCode,
        };
        await this.$store.dispatch("roomModule/getSubjectCode", data);
      } catch (error) {
        console.error("Failed getting all the subject code", error);
      }
    },

    async getSections() {
      try {
        // if (!lastSection.semester) {
        //   this.$q.notify({
        //     color: "negative",
        //     position: "center",
        //     message:
        //       "Please Select Semester for us to get the specific section/s for your chosen subject/s",
        //     icon: "report_problem",
        //     iconColor: "white",
        //     timeout: 2000,
        //     progress: true,
        //   });
        //   return;
        // }

        if (!this.formData.selectedSemester) {
          this.$q.notify({
            color: "negative",
            position: "center",
            message:
              "Please Select Semester for us to get the specific section/s for your chosen subject/s",
            icon: "report_problem",
            iconColor: "white",
            timeout: 2000,
            progress: true,
          });
          return;
        }

        const data = {
          semester:
            this.formData.selectedSemester.semYearFrom +
            this.formData.selectedSemester.semCode,
          subjectCode: this.formData.selectedSubject.subjectCode,
        };

        await this.$store.dispatch("roomModule/getSections", data);
        this.section = this.sectionOptions;
      } catch (error) {
        console.error("Failed To Get Sections");
      }
    },

    async checkData() {
      const data = {
        selectedRoomType: this.formData.selectedRoomType.code,
        selectedSemester: this.formData.selectedSemester.sEM_CODE,
        selectedSubject: this.formData.selectedSubject.subjectCode,
        selectedDays: this.formData.selectedDays,
        department: this.formData.selectedDepartment.deptCode,
        selectedSection: this.formData.selectedSection
          ? this.formData.selectedSection.section
          : null,
        facultyName: this.formData.facultyName,
        capacity: this.formData.capacity,
        remarks: this.formData.remarks,
      };

      this.$emit("insert-data", data);
      this.formData = {};
    },
  },

  watch: {
    formData: {
      deep: true,
      handler(newValue) {
        const formattedSection = this.formattedSelectedSection;
        const formattedSubjectCode = this.formattedSubjectCode;
        const updatedFormData = {
          ...newValue,
          selectedSection: formattedSection,
          selectedSubject: formattedSubjectCode,
        };
        this.$emit("update:formData", updatedFormData);
      },
    },
  },
};
</script>
