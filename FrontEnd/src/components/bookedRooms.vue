<template>
  <q-virtual-scroll
    class="virtual-scroll"
    type="table"
    style="max-height: 630px"
    :virtual-scroll-item-size="48"
    :virtual-scroll-sticky-size-start="48"
    :virtual-scroll-sticky-size-end="32"
    :items="bookedRooms"
  >
    <template v-slot:before>
      <thead class="sticky-thead">
        <tr>
          <th v-for="col in bookedCol" :key="col.name" class="text-bold">
            {{ col.label }}
          </th>
        </tr>
      </thead>
    </template>
    <template v-slot="{ item: row, name }">
      <q-tr :key="name">
        <q-td
          v-for="col in bookedCol"
          :key="col.name"
          class="text-center"
          :style="{
            width: col.width || 'auto',
            'white-space':
              col.name === 'buildingDescription' ||
              col.name === 'roomName' ||
              col.name === 'roomDescription'
                ? 'normal'
                : 'nowrap',
            'word-wrap':
              col.name === 'buildingDescription' ||
              col.name === 'roomName' ||
              col.name === 'roomDescription'
                ? 'break-word'
                : 'normal',
          }"
        >
          <template v-if="col.name === 'schedule'">
            <div style="display: flex; justify-content: center; gap: 10px">
              <q-btn
                push
                color="blue-10"
                label="Check Schedule"
                @click="bookMethodDialog(row.booked)"
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

  <q-dialog v-model="schedDialog" full-width>
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

        <q-table
          :rows="computedSelectedSchedule"
          :columns="selectedCol"
          row-key="doctorCode"
          virtual-scroll
          hide-pagination
          :rows-per-page-options="[0]"
          style="max-height: 700px"
        >
          <template v-slot:header>
            <q-tr class="sticky-thead">
              <q-th
                v-for="col in selectedCol"
                :key="col.name"
                class="text-bold text-center"
                :style="{ width: col.width || 'auto' }"
              >
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr
              :props="props"
              :key="props.row.subjectCode"
              @click="employeeSched ? clickedRow(props.row) : null"
              class="hover-row"
            >
              <q-td
                v-for="col in selectedCol"
                :key="col.name"
                class="text-center"
                :style="{
                  width: col.width || 'auto',
                  whiteSpace:
                    col.name === 'subjectDescription' ||
                    col.name === 'deptLabel' ||
                    col.name === 'remarks'
                      ? 'normal'
                      : 'nowrap',
                  wordWrap:
                    col.name === 'subjectDescription' ||
                    col.name === 'deptLabel' ||
                    col.name === 'remarks'
                      ? 'break-word'
                      : 'normal',
                }"
              >
                <renderCellDia :row="props.row" :col="col" />
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <!-- <q-virtual-scroll
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
            <q-tr
              :key="name"
              class="hover-row"
              @click="employeeSched ? clickedRow(row) : null"
            >
              <q-td
                v-for="col in selectedCol"
                :key="col.name"
                class="text-center"
                :style="{
                  width: col.width || 'auto',
                  'white-space':
                    col.name === 'subjectDescription' ||
                    col.name === 'deptLabel'
                      ? 'normal'
                      : 'nowrap',
                  'word-wrap':
                    col.name === 'subjectDescription' ||
                    col.name === 'deptLabel'
                      ? 'break-word'
                      : 'normal',
                }"
              >
                <renderCellDia :row="row" :col="col" />
              </q-td>
            </q-tr>
          </template>
        </q-virtual-scroll> -->
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="selectedSchedDia" persistent>
    <q-card
      :class="[$q.screen.name + '-text']"
      style="width: fit-content; min-width: 300px; max-width: 90vw"
    >
      <q-card-section class="bg-blue-10 row items-center">
        <div class="text-white text-bold">Selected Schedule</div>
        <q-space></q-space>
        <q-btn
          class="bg-white text-blue-10"
          icon="close"
          push
          round
          dense
          padding="xs"
          @click="clearSelectedDia"
          v-close-popup
        ></q-btn>
      </q-card-section>

      <q-card-section>
        <p class="q-pa-xs">
          <span
            v-if="selectedRow.subjectCode || selectedRow.subjectDescription"
          >
            Subject Description (Code - Description):
            <strong>
              {{ selectedRow.subjectCode }} -
              {{ selectedRow.subjectDescription }}
            </strong>
            <br />
          </span>

          <span v-if="selectedRow.section">
            Section: {{ selectedRow.section }}<br />
          </span>

          <span v-if="selectedRow.formattedIntervals">
            Time: {{ selectedRow.formattedIntervals }}<br />
          </span>

          <span
            v-if="
              selectedRow.days && selectedRow.formatFrom && selectedRow.formatTo
            "
          >
            Day(s) / Date :
            {{ selectedRow.formatFrom !== selectedRow.formatTo ? "Every" : "" }}
            {{ formatDays(selectedRow.days) }}
            {{ selectedRow.formatFrom !== selectedRow.formatTo ? "of" : "" }}
            {{
              selectedRow.formatFrom !== selectedRow.formatTo
                ? selectedRow.formatFrom + "to" + selectedRow.formatTo
                : selectedRow.formatFrom
            }}

            <br />
          </span>

          <span v-if="selectedRow.remarks && !isNA(selectedRow.remarks)">
            Remarks: {{ selectedRow.remarks }}
          </span>
        </p>
      </q-card-section>

      <q-card-section class="text-right">
        <q-btn
          class="bg-negative text-white"
          push
          label="Cancel Schedule"
          @click="cancelSchedule"
        ></q-btn>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import renderCell from "src/components/renderCell.vue";
import renderCellDia from "src/components/renderCellDialog.vue";
import helperMethods from "src/helperMethods";
import { QSpinnerIos } from "quasar";

export default {
  emits: ["successCancel"],
  props: {
    bookedRooms: Array,
    employeeSched: Boolean,
  },
  data() {
    return {
      schedDialog: false,
      bookedCol: [
        {
          name: "roomName",
          label: "Room Name",
          align: "center",
          field: "roomName",
          sortable: false,
          width: "175px",
        },
        {
          name: "roomDescription",
          label: "Room Type",
          align: "center",
          field: "roomDescription",
          sortable: false,
          width: "225px",
        },
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
          name: "schedule",
          label: "Schedule",
          align: "center",
          field: "",
          sortable: false,
          width: "175px",
        },
      ],
      selectedSchedule: [],
      selectedCol: [
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
          field: "subjectDescription",
          sortable: false,
        },
        {
          name: "section",
          label: "Section",
          align: "center",
          field: "section",
          sortable: false,
        },
        {
          name: "department",
          label: "Department",
          align: "center",
          field: "deptLabel",
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
          name: "days",
          label: "Days",
          align: "center",
          field: "days",
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
      searchTextSched: "",
      selectedRow: null,
      selectedSchedDia: false,
    };
  },

  components: {
    renderCell,
    renderCellDia,
  },

  computed: {
    computedSelectedSchedule() {
      if (Array.isArray(this.selectedSchedule)) {
        const query = this.searchTextSched.toLowerCase();

        return this.selectedSchedule
          .filter((row) => {
            if (row.intervals) {
              row.formattedIntervals = helperMethods.formatIntervals(
                row.intervals
              );
            }

            const subjectCode = row.subjectCode?.toString().toLowerCase() ?? "";
            const subjectDescription =
              row.subjectDescription?.toString().toLowerCase() ?? "";

            return (
              subjectCode.includes(query) ||
              subjectDescription.includes(query) ||
              row.formatFrom.includes(query) ||
              row.formatTo.includes(query)
            );
          })
          .sort((a, b) => (a.intervals || "").localeCompare(b.intervals || ""));
      }
      return [];
    },
  },

  methods: {
    isNA(value) {
      if (!value) return true;
      return ["n/a", "na"].includes(value.trim().toLowerCase());
    },

    bookMethodDialog(sched) {
      this.schedDialog = true;
      this.selectedSchedule = sched;
    },
    clearSelectedSchedule() {
      this.schedDialog = false;
      this.selectedSchedule = [];
      this.searchTextSched = "";
    },
    clearSearchText() {
      this.searchText = "";
      this.searchTextSched = "";
    },
    clickedRow(data) {
      this.selectedRow = data;
      this.selectedSchedDia = true;
    },
    clearSelectedDia() {
      this.selectedRow = null;
      this.selectedSchedDia = false;
    },
    formatDays(days) {
      if (!days) return ""; // Handle empty case

      const dayMap = {
        M: "Monday",
        T: "Tuesday",
        W: "Wednesday",
        Th: "Thursday",
        F: "Friday",
        S: "Saturday",
        Su: "Sunday",
      };

      return days
        .split(",") // Split by commas
        .map((day) => dayMap[day.trim()] || day) // Convert shorthand to full name
        .join(", "); // Join them back as a string
    },

    cancelSchedule() {
      const data = {
        id: this.selectedRow.id,
      };

      this.$q
        .dialog({
          title: "Confirmation",
          message: `Are you sure you cancell the schedule?`,
          cancel: true,
          persistent: true,
          class: "custom-dialog",
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
          try {
            helperMethods.disablePointerEvents();
            this.$q.loading.show({
              spinner: QSpinnerIos,
              message: "Cancelling schedule",
              messageColor: "primary",
              backgroundColor: "grey-1",
              spinnerColor: "primary",
              customClass: "custom-loading-style",
              spinnerSize: "7em",
            });

            await this.$store.dispatch("roomModule/cancelSchedule", data);
            this.$emit("successCancel");
            this.$q.loading.hide();
            this.selectedSchedDia = false;
            this.schedDialog = false;
            this.$q.notify({
              color: "green-8",
              position: "center",
              message: "Success cancelling schedule",
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });
            helperMethods.enablePointerEvents();
            this.selectedSchedDia = false;
            this.selectedRow = null;
          } catch (error) {
            if (error.response.status == 400) {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: `${error.response.data.error}`,
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            }
            this.$q.loading.hide();
            this.selectedSchedDia = false;
            helperMethods.enablePointerEvents();
            console.error(error);
          }
        });
    },
  },
};
</script>
