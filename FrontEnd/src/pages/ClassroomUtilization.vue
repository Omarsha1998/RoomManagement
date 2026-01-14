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
                done-color="green"
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
                    label="Format"
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
                    Please note that you did not specify a date range, room,
                    department, or building. As a result, all room schedule data
                    will be extracted and generated into an Excel file for your
                    reference. <br />
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
                    selected room's schedule will be extracted and generated
                    into an Excel file. <br />
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
                    Please note that you only specified a date range. All data
                    room schedule within the specified date range will be
                    extracted and generated into an Excel file. <br />
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
                    Please note that you only specified a building. All data for
                    the selected building's schedule will be extracted and
                    generated into an Excel file. <br />
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
                    Please note that you only specified a department. All data
                    for the selected department's schedule will be extracted and
                    generated into an Excel file. <br />
                    Please confirm if this is acceptable.
                  </p>

                  <p v-else>
                    Please note that you have specified data. All specified /
                    selected data room schedules will be extracted and generated
                    into an Excel file for your reference. <br />
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
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapGetters } from "vuex";
import SkeletonLoader from "../components/loadingSkeleton.vue";
import helperMethods from "src/helperMethods";
import ExcelJS from "exceljs";
import { QSpinnerIos } from "quasar";
import Loader from "../components/Loader.vue";
import { compareTimestamps } from "@quasar/quasar-ui-qcalendar";

let formatOptions = [
  { label: "Week", value: "Weekly" },
  { label: "Month", value: "Monthly" },
];

export default {
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
    };
  },

  components: {
    SkeletonLoader,
    Loader,
  },

  computed: {
    ...mapGetters({
      allScheduledView: "roomModule/getScheduledRoomView",
      buildingOptions: "roomModule/getBuildingOptions",
      allRoomsReport: "roomModule/getAllRoomsReport",
      deptOptions: "roomModule/getDepartmentOptions",
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
          this.rooms = this.allRoomsReport;
          this.departments = this.deptOptions;
          this.buildings = this.buildingOptions;
          this.format = formatOptions;
        });
        return;
      }
      update(() => {
        const needle = val.toLowerCase();
        this.rooms = this.allRoomsReport.filter(
          (option) => option.roomName.toLowerCase().indexOf(needle) > -1
        );
        this.departments = this.deptOptions.filter(
          (option) => option.deptLabel.toLowerCase().indexOf(needle) > -1
        );
        this.buildings = this.buildings.filter(
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
        const scheduleData = JSON.parse(JSON.stringify(this.allScheduledView));
        const loading = this.$q.loading;
        const notify = this.$q.notify;

        this.loader = true;

        if (typeof Worker !== "undefined") {
          if (typeof this.w === "undefined") {
            this.w = new Worker(
              new URL("../store/workUtil.js", import.meta.url)
            );
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

    async getBuildings() {
      try {
        await this.$store.dispatch("roomModule/getBuildings");
        this.buildings = this.buildingOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async getAllRooms() {
      try {
        await this.$store.dispatch("roomModule/getAllRooms");
        this.rooms = this.allRoomsReport;
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async getDepartments() {
      await helperMethods.delay(100);
      try {
        await this.$store.dispatch("roomModule/getDepartments");
        this.departments = this.deptOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    // async parseSchedule(combinedSchedule) {
    //   const regex = /\(([^)]+)\)/g;
    //   let match;
    //   const parsed = [];

    //   while ((match = regex.exec(combinedSchedule)) !== null) {
    //     const [fullMatch, content] = match;
    //     const parts = content.split(" - ");

    //     if (parts.length === 2) {
    //       const [dayAndSections, timeRange] = parts;
    //       const [sections, days] = dayAndSections.split(" ");
    //       const daysList = days
    //         .split(",")
    //         .map(
    //           (day) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
    //         );

    //       if (sections && timeRange && daysList.length > 0) {
    //         for (const day of daysList) {
    //           const [startTime, endTime] = timeRange.split("-");
    //           const start = new Date(`1970-01-01T${startTime}:00Z`);
    //           const end = new Date(`1970-01-01T${endTime}:00Z`);
    //           parsed.push({
    //             sections,
    //             day,
    //             timeRange,
    //             startTime: start,
    //             endTime: end,
    //           });
    //         }
    //       } else {
    //         console.error(`Invalid format in content: ${content}`);
    //       }
    //     } else {
    //       console.error(`Invalid time range format: ${content}`);
    //     }
    //   }

    //   parsed.sort((a, b) => a.startTime - b.startTime);

    //   return parsed.map(({ sections, day, timeRange }) => ({
    //     sections,
    //     day,
    //     timeRange,
    //   }));
    // },

    // async generateExcel(data) {
    //   try {
    //     const workbook = new ExcelJS.Workbook();

    //     const groupedSchedules = data.reduce((acc, item) => {
    //       if (!acc[item.roomId]) acc[item.roomId] = [];
    //       acc[item.roomId].push(item);
    //       return acc;
    //     }, {});

    //     for (const roomId of Object.keys(groupedSchedules)) {
    //       const roomData = groupedSchedules[roomId][0];
    //       const sheetName = `${roomData.name} (${roomId})`.substring(0, 31);
    //       const worksheet = workbook.addWorksheet(sheetName);

    //       const fromDate = new Date(roomData.fromDate);
    //       const toDate = new Date(roomData.toDate);

    //       const dateColumns = [];
    //       let currentDate = new Date(fromDate);

    //       while (currentDate <= toDate) {
    //         const formattedDate =
    //           currentDate.toLocaleDateString("en-US", {
    //             month: "long",
    //             day: "numeric",
    //             year: "numeric",
    //           }) +
    //           " - " +
    //           currentDate.toLocaleDateString("en-US", { weekday: "long" });

    //         dateColumns.push(formattedDate);
    //         currentDate.setDate(currentDate.getDate() + 1);
    //       }

    //       const columns = [
    //         {
    //           header: roomData.buildingDescription,
    //           key: "buildingDescription",
    //           width: 30,
    //         },
    //         ...dateColumns.map((date, index) => ({
    //           header: date,
    //           key: `date${index}`,
    //           width: 30,
    //         })),
    //       ];
    //       worksheet.columns = columns;

    //       const firstRow = worksheet.addRow([, ...dateColumns]);
    //       firstRow.getCell(1).alignment = { horizontal: "center" };
    //       firstRow.getCell(1).font = { bold: true };
    //       worksheet.mergeCells(1, 1, 1, dateColumns.length + 1);

    //       const scheduleByDate = {};

    //       for (const date of dateColumns) {
    //         const dateWeekday = date.split(" - ")[1];

    //         if (!scheduleByDate[date]) {
    //           scheduleByDate[date] = [];
    //         }

    //         for (const data of groupedSchedules[roomId]) {
    //           const parsedSchedule = await this.parseSchedule(
    //             data.combinedSchedule
    //           );

    //           for (const parsed of parsedSchedule) {
    //             const { sections, day, timeRange } = parsed;

    //             let [startTime, endTime] = timeRange
    //               .split("-")
    //               .map((time) => time.trim());

    //             // If the day matches the weekday for the current date in the loop
    //             if (day === dateWeekday) {
    //               let newStartTime = startTime;
    //               let newEndTime = endTime;
    //               let mergedIndexes = [];

    //               // Merge overlapping time ranges
    //               for (let i = 0; i < scheduleByDate[date].length; i++) {
    //                 let [existingStart, existingEnd] = scheduleByDate[date][i]
    //                   .split("-")
    //                   .map((time) => time.trim());

    //                 if (
    //                   (newStartTime >= existingStart &&
    //                     newStartTime <= existingEnd) ||
    //                   (newEndTime >= existingStart &&
    //                     newEndTime <= existingEnd) ||
    //                   (newStartTime <= existingStart &&
    //                     newEndTime >= existingEnd)
    //                 ) {
    //                   newStartTime =
    //                     newStartTime < existingStart
    //                       ? newStartTime
    //                       : existingStart;
    //                   newEndTime =
    //                     newEndTime > existingEnd ? newEndTime : existingEnd;
    //                   mergedIndexes.push(i);
    //                 }
    //               }

    //               // Remove merged ranges and add the new merged time range
    //               if (mergedIndexes.length > 0) {
    //                 scheduleByDate[date] = scheduleByDate[date].filter(
    //                   (_, index) => !mergedIndexes.includes(index)
    //                 );
    //               }

    //               scheduleByDate[date].push(`${newStartTime} - ${newEndTime}`);

    //               // Sort the time ranges by start time
    //               scheduleByDate[date].sort((a, b) => {
    //                 let [aStart] = a.split("-").map((time) => time.trim());
    //                 let [bStart] = b.split("-").map((time) => time.trim());
    //                 return aStart.localeCompare(bStart);
    //               });
    //             }
    //           }
    //         }

    //         if (scheduleByDate[date].length === 0) {
    //           scheduleByDate[date] = [];
    //         }
    //       }

    //       // Convert time in "HH:MM" format to total minutes from midnight
    //       function convertTimeToMinutes(time) {
    //         const [hours, minutes] = time.split(":").map(Number);
    //         return hours * 60 + minutes;
    //       }

    //       const dailyStartTime = "08:00";
    //       const dailyEndTime = "17:00";

    //       const dailyStartMinutes = convertTimeToMinutes(dailyStartTime);
    //       const dailyEndMinutes = convertTimeToMinutes(dailyEndTime);
    //       const dailyAvailableMinutes = dailyEndMinutes - dailyStartMinutes;

    //       for (const date in scheduleByDate) {
    //         let totalScheduledMinutes = 0;

    //         if (scheduleByDate[date].length > 0) {
    //           for (const timeRange of scheduleByDate[date]) {
    //             let [startTime, endTime] = timeRange
    //               .split(" - ")
    //               .map((time) => time.trim());

    //             let startMinutes = convertTimeToMinutes(startTime);
    //             let endMinutes = convertTimeToMinutes(endTime);

    //             if (endMinutes > dailyEndMinutes) {
    //               endMinutes = dailyEndMinutes;
    //             }

    //             if (startMinutes < dailyStartMinutes) {
    //               startMinutes = dailyStartMinutes;
    //             }

    //             if (startMinutes < endMinutes) {
    //               totalScheduledMinutes += endMinutes - startMinutes;
    //             }
    //           }

    //           const utilizationPercentage =
    //             (totalScheduledMinutes / dailyAvailableMinutes) * 100;

    //           scheduleByDate[date] = [`${utilizationPercentage.toFixed(2)}%`];
    //         } else {
    //           scheduleByDate[date] = ["0%"];
    //         }
    //       }

    //       const maxRows = Math.max(
    //         ...Object.values(scheduleByDate).map(
    //           (schedules) => schedules.length
    //         ),
    //         1
    //       );

    //       for (let i = 0; i < maxRows; i++) {
    //         const rowData = [];

    //         for (const date of dateColumns) {
    //           rowData.push(scheduleByDate[date]?.[i] || "");
    //         }

    //         worksheet.addRow(rowData);
    //       }

    //       const utilizationStartRow = worksheet.rowCount - maxRows + 1;
    //       const utilizationRows = 10;
    //       for (let col = 1; col <= dateColumns.length + 1; col++) {
    //         const startRow = utilizationStartRow;
    //         const endRow = utilizationStartRow + utilizationRows - 1;

    //         worksheet.mergeCells(startRow, col, endRow, col);

    //         const mergedCell = worksheet.getCell(startRow, col);
    //         mergedCell.alignment = { vertical: "middle", horizontal: "center" };
    //       }

    //       worksheet.getRow(1).eachCell((cell) => {
    //         cell.font = { bold: true };
    //         cell.alignment = { horizontal: "center", vertical: "middle" };
    //       });

    //       worksheet.eachRow((row, rowNumber) => {
    //         row.eachCell((cell, colNumber) => {
    //           if (rowNumber > 1) {
    //             cell.alignment = { horizontal: "center", vertical: "middle" };
    //           }
    //         });
    //       });
    //     }

    //     const buffer = await workbook.xlsx.writeBuffer();
    //     const blob = new Blob([buffer], {
    //       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //     });

    //     const link = document.createElement("a");
    //     link.href = URL.createObjectURL(blob);
    //     link.download = "Room_Schedules.xlsx";
    //     link.click();

    //     this.$q.notify({
    //       color: "positive",
    //       message: "Excel file generated successfully!",
    //       icon: "check_circle",
    //     });
    //   } catch (error) {
    //     console.error("Error generating Excel file:", error);
    //     this.$q.notify({
    //       color: "negative",
    //       message: "Error generating Excel file.",
    //       icon: "error",
    //     });
    //   }
    // },
  },

  created() {
    this.getBuildings();
    this.getAllRooms();
    this.getDepartments();
  },
};
</script>
