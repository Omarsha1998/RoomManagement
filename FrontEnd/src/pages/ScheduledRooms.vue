<template>
  <q-layout>
    <q-page-container>
      <div class="container">
        <div class="row" style="width: 95%">
          <div class="col-12 q-mt-md">
            <div v-if="loading">
              <SkeletonLoader
                :rowCount="13"
                :columnCount="5"
                :bookedRooms="true"
              />
            </div>
            <!-- <q-card v-else class="rounded2">
              <q-card-section class="bg-amber-8">
                <q-tabs
                  v-model="tab"
                  indicator-color="amber-8"
                  active-color="positive"
                  class="bg-blue-10 text-white shadow-2 row"
                >
                  <q-tab
                    :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                    name="allBookedRooms"
                    icon="mail"
                    label="All Scheduled Rooms"
                    inline-label
                    mobile-arrows
                  >
                  </q-tab>
                  <q-tab
                    :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                    name="employeeBookedRooms"
                    icon="mail"
                    label="My Booked Rooms"
                  >
                  </q-tab>
                </q-tabs>
              </q-card-section>
              <q-card-section>
                <q-tab-panels
                  v-model="tab"
                  animated
                  transition-prev="slide-right"
                  transition-next="slide-left"
                >
                  <q-tab-panel name="allBookedRooms">
                    <div
                      class="q-pa-xs d-flex justify-end items-center q-mb-md"
                    >
                      <q-select
                        dense
                        filled
                        label="Status"
                        :options="statusSelect"
                        v-model="selectedStatus"
                        option-value="value"
                        option-label="label"
                        style="width: 150px; margin-bottom: 0"
                        behavior="menu"
                        fill-input
                        clearable
                        @update:model-value="handleStatusChange()"
                      >
                        <template v-slot:no-option>
                          <q-item>
                            <q-item-section class="text-grey">
                              No results
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>

                    <q-input
                      dense
                      class="bg-amber-8"
                      v-model="searchText"
                      placeholder="Search"
                      outlined
                      standout="bg-amber-8 text-white"
                      clearable
                      :class="[$q.screen.name + '-text2']"
                      @clear="clearSearchText"
                    />
                    <bookedRooms :bookedRooms="computedBookedRooms" />
                    <div
                      v-if="bookedSchedule.length === 0 && !loading"
                      class="text-center"
                    >
                      <q-icon
                        name="warning"
                        style="font-size: 30px; color: red"
                      />
                      No data available
                    </div>
                  </q-tab-panel>
                  <q-tab-panel name="employeeBookedRooms">
                    <div
                      class="q-pa-xs d-flex justify-end items-center q-mb-md"
                    >
                      <q-select
                        dense
                        filled
                        label="Status"
                        :options="statusSelect"
                        v-model="selectedStatus"
                        option-value="value"
                        option-label="label"
                        style="width: 150px; margin-bottom: 0"
                        behavior="menu"
                        fill-input
                        clearable
                        @update:model-value="handleStatusChange()"
                      >
                        <template v-slot:no-option>
                          <q-item>
                            <q-item-section class="text-grey">
                              No results
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>
                    <q-input
                      dense
                      class="bg-amber-8"
                      v-model="searchTextEmployee"
                      placeholder="Search"
                      outlined
                      standout="bg-amber-8 text-white"
                      clearable
                      :class="[$q.screen.name + '-text2']"
                      @clear="clearSearchText"
                    />
                    <bookedRooms
                      :bookedRooms="computedEmployeeBookedSchedule"
                    />
                    <div
                      v-if="employeeBookedSchedule.length === 0 && !loading"
                      class="text-center"
                    >
                      <q-icon
                        name="warning"
                        style="font-size: 30px; color: red"
                      />
                      No data available
                    </div>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card-section>
            </q-card> -->
            <q-card v-else>
              <q-tabs
                v-model="tab"
                indicator-color="amber-8"
                active-color="positive"
                class="bg-blue-10 text-amber-8 shadow-2 row"
              >
                <q-tab
                  :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                  name="allBookedRooms"
                  icon="edit_calendar"
                  label="All Scheduled Rooms"
                  inline-label
                  mobile-arrows
                >
                </q-tab>
                <q-tab
                  :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                  name="employeeBookedRooms"
                  icon="date_range"
                  label="My Booked Rooms"
                >
                </q-tab>
              </q-tabs>

              <q-tab-panels
                v-model="tab"
                animated
                transition-prev="slide-right"
                transition-next="slide-left"
              >
                <q-tab-panel name="allBookedRooms">
                  <q-select
                    class="q-mb-sm"
                    dense
                    outlined
                    label="Status"
                    :options="statusSelect"
                    v-model="selectedStatus"
                    option-value="value"
                    option-label="label"
                    behavior="menu"
                    fill-input
                    clearable
                    @update:model-value="handleStatusChange()"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-input
                    class="inputClass q-mb-sm"
                    dense
                    v-model="searchText"
                    label="Search"
                    label-color="blue-10"
                    outlined
                    clearable
                    :class="[$q.screen.name + '-text2']"
                    @clear="clearSearchText"
                  >
                    <template v-slot:prepend>
                      <q-icon color="blue-10" name="search" />
                    </template>
                  </q-input>
                  <bookedRooms
                    :bookedRooms="computedBookedRooms"
                    :employeeSched="false"
                  />
                  <div
                    v-if="bookedSchedule.length === 0 && !loading"
                    class="text-center"
                  >
                    <q-icon
                      name="warning"
                      style="font-size: 30px; color: red"
                    />
                    No data available
                  </div>
                </q-tab-panel>
                <q-tab-panel name="employeeBookedRooms">
                  <q-select
                    class="q-mb-sm"
                    dense
                    outlined
                    label="Status"
                    :options="statusSelect"
                    v-model="selectedStatus"
                    option-value="value"
                    option-label="label"
                    behavior="menu"
                    fill-input
                    clearable
                    @update:model-value="handleStatusChange()"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-input
                    dense
                    class="inputClass q-mb-sm"
                    v-model="searchTextEmployee"
                    placeholder="Search"
                    outlined
                    standout="bg-amber-8 text-white"
                    clearable
                    :class="[$q.screen.name + '-text2']"
                    @clear="clearSearchText"
                  />
                  <bookedRooms
                    :bookedRooms="computedEmployeeBookedSchedule"
                    :employeeSched="true"
                    @successCancel="successCancel"
                  />
                  <div
                    v-if="employeeBookedSchedule.length === 0 && !loading"
                    class="text-center"
                  >
                    <q-icon
                      name="warning"
                      style="font-size: 30px; color: red"
                    />
                    No data available
                  </div>
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
import { mapGetters } from "vuex";
import SkeletonLoader from "../components/loadingSkeleton.vue";
import helperMethods from "src/helperMethods";
import bookedRooms from "../components/bookedRooms.vue";

export default {
  data() {
    return {
      bookedSchedule: [],
      searchText: "",
      employeeBookedSchedule: [],
      searchTextEmployee: "",
      loading: true,
      loadingCounter: null,
      tab: "allBookedRooms",
      statusSelect: [
        { label: "Active", value: 1 },
        { label: "Inactive", value: 0 },
        { label: "All Status", value: 2 },
      ],
      selectedStatus: "Active",
    };
  },

  components: {
    SkeletonLoader,
    bookedRooms,
  },

  computed: {
    ...mapGetters({
      booked: "roomModule/getBookedSchedule",
      employeeBooked: "roomModule/getEmployeeBookedSchedule",
    }),

    computedBookedRooms() {
      return this.filterAndSortBookedRooms(
        this.bookedSchedule,
        this.searchText,
        this.selectedStatus
      );
    },

    computedEmployeeBookedSchedule() {
      return this.filterAndSortBookedRooms(
        this.employeeBookedSchedule,
        this.searchTextEmployee,
        this.selectedStatus
      );
    },
  },

  methods: {
    handleStatusChange() {
      const statusValue =
        this.selectedStatus?.label?.toLowerCase() ??
        this.selectedStatus?.toLowerCase();
      this.filteredRooms = this.filterAndSortBookedRooms(
        this.bookedScheduleArray,
        this.queryText,
        statusValue
      );
    },

    // filterAndSortBookedRooms(bookedScheduleArray, queryText, selectedStatus) {
    //   if (Array.isArray(bookedScheduleArray)) {
    //     const query = queryText.toLowerCase();

    //     const status =
    //       selectedStatus?.label?.toLowerCase() ?? selectedStatus?.toLowerCase();

    //     const filteredRooms = bookedScheduleArray.filter((row) => {
    //       return (
    //         status === "all status" ||
    //         row.booked.some((bookedEntry) =>
    //           status === "active" ? bookedEntry.active : !bookedEntry.active
    //         )
    //       );
    //     });

    //     return (
    //       filteredRooms
    //         .filter((row) => {
    //           console.log(row);

    //           const roomNameMatches =
    //             row.roomName &&
    //             row.roomName.toString().toLowerCase().includes(query);

    //           const roomTypeMatches =
    //             row.roomDescription &&
    //             row.roomDescription.toString().toLowerCase().includes(query);

    //           const bookedMatches = row.booked.some(
    //             (booking) =>
    //               (booking.subjectCode &&
    //                 booking.subjectCode
    //                   .toString()
    //                   .toLowerCase()
    //                   .includes(query)) ||
    //               (booking.subjectDescription &&
    //                 booking.subjectDescription
    //                   .toString()
    //                   .toLowerCase()
    //                   .includes(query))
    //           );

    //           return roomNameMatches || roomTypeMatches || bookedMatches;
    //         })
    //         // .map((room) => ({
    //         //   ...room,
    //         //   booked: room.booked.filter((booking) => {
    //         //     if (selectedStatus === "") {
    //         //       return booking.active === true;
    //         //     } else if (selectedStatus === "Inactive") {
    //         //       return booking.active === false;
    //         //     } else {
    //         //       return true;
    //         //     }
    //         //   }),
    //         // }))
    //         .sort((a, b) => {
    //           const nameA = a.roomName || "";
    //           const nameB = b.roomName || "";
    //           const dateA = new Date(a.dateTimeCreated);
    //           const dateB = new Date(b.dateTimeCreated);

    //           const firstLetterA = nameA.charAt(0).toUpperCase();
    //           const firstLetterB = nameB.charAt(0).toUpperCase();

    //           if (firstLetterA < firstLetterB) return -1;
    //           if (firstLetterA > firstLetterB) return 1;

    //           if (dateA < dateB) return -1;
    //           if (dateA > dateB) return 1;

    //           return 0;
    //         })
    //     );
    //   }
    //   return [];
    // },

    filterAndSortBookedRooms(bookedScheduleArray, queryText, selectedStatus) {
      if (Array.isArray(bookedScheduleArray)) {
        const query = queryText.toLowerCase();
        const status =
          selectedStatus?.label?.toLowerCase() ?? selectedStatus?.toLowerCase();

        const filteredRooms = bookedScheduleArray.filter((row) => {
          return (
            status === "all status" ||
            row.booked.some((bookedEntry) =>
              status === "active" ? bookedEntry.active : !bookedEntry.active
            )
          );
        });

        return filteredRooms
          .filter((row) => {
            const roomNameMatches =
              row.roomName &&
              row.roomName.toString().toLowerCase().includes(query);

            const roomTypeMatches =
              row.roomDescription &&
              row.roomDescription.toString().toLowerCase().includes(query);

            const bookedMatches = row.booked.some(
              (booking) =>
                (booking.subjectCode &&
                  booking.subjectCode
                    .toString()
                    .toLowerCase()
                    .includes(query)) ||
                (booking.subjectDescription &&
                  booking.subjectDescription
                    .toString()
                    .toLowerCase()
                    .includes(query))
            );

            const fromDateMatches =
              row.fromDate &&
              new Date(row.fromDate).toISOString().slice(0, 10).includes(query);

            const toDateMatches =
              row.toDate &&
              new Date(row.toDate).toISOString().slice(0, 10).includes(query);

            return (
              roomNameMatches ||
              roomTypeMatches ||
              bookedMatches ||
              fromDateMatches ||
              toDateMatches
            );
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

    // filterAndSortBookedRooms(bookedScheduleArray, queryText, selectedStatus) {
    //   console.log(queryText);

    //   if (Array.isArray(bookedScheduleArray)) {
    //     const query = queryText.toLowerCase();
    //     const status =
    //       selectedStatus?.label?.toLowerCase() ?? selectedStatus?.toLowerCase();

    //     const filteredRooms = bookedScheduleArray.filter((row) => {
    //       return (
    //         status === "all status" ||
    //         row.booked.some((bookedEntry) =>
    //           status === "active" ? bookedEntry.active : !bookedEntry.active
    //         )
    //       );
    //     });

    //     return filteredRooms
    //       .filter((row) => {
    //         const roomNameMatches =
    //           row.roomName &&
    //           row.roomName.toString().toLowerCase().includes(query);

    //         const roomTypeMatches =
    //           row.roomDescription &&
    //           row.roomDescription.toString().toLowerCase().includes(query);

    //         const bookedMatches = row.booked.some(
    //           (booking) =>
    //             (booking.subjectCode &&
    //               booking.subjectCode
    //                 .toString()
    //                 .toLowerCase()
    //                 .includes(query)) ||
    //             (booking.subjectDescription &&
    //               booking.subjectDescription
    //                 .toString()
    //                 .toLowerCase()
    //                 .includes(query))
    //         );

    //         // console.log(query);

    //         // console.log(new Date(row.fromDate).toISOString().slice(0, 10));

    //         // const fromDateMatches =
    //         //   row.fromDate &&
    //         //   new Date(row.fromDate).toISOString().slice(0, 10).includes(query);

    //         // const toDateMatches =
    //         //   row.toDate &&
    //         //   new Date(row.toDate).toISOString().slice(0, 10).includes(query);

    //         return (
    //           roomNameMatches ||
    //           roomTypeMatches ||
    //           bookedMatches ||
    //           fromDateMatches ||
    //           toDateMatches
    //         );
    //       })
    //       .sort((a, b) => {
    //         const nameA = a.roomName || "";
    //         const nameB = b.roomName || "";
    //         const dateA = new Date(a.dateTimeCreated);
    //         const dateB = new Date(b.dateTimeCreated);

    //         const firstLetterA = nameA.charAt(0).toUpperCase();
    //         const firstLetterB = nameB.charAt(0).toUpperCase();

    //         if (firstLetterA < firstLetterB) return -1;
    //         if (firstLetterA > firstLetterB) return 1;

    //         if (dateA < dateB) return -1;
    //         if (dateA > dateB) return 1;

    //         return 0;
    //       });
    //   }
    //   return [];
    // },

    clearSearchText() {
      this.searchText = "";
      this.searchTextEmployee = "";
    },

    async successCancel() {
      this.getBookedScheduleByEmployee();
      this.getBookedSchedule();
    },

    async getBookedSchedule() {
      try {
        await this.$store.dispatch("roomModule/getBookedSchedule");
        this.bookedSchedule = this.booked;
        this.loadingCounter++;
        if (this.loadingCounter === 2) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    formatDateTime(dateTimeString) {
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      };
      const dateTime = new Date(dateTimeString);
      return dateTime.toLocaleDateString(undefined, options);
    },

    async getBookedScheduleByEmployee() {
      try {
        await this.$store.dispatch("roomModule/getBookedScheduleByEmployee");
        this.employeeBookedSchedule = this.employeeBooked;
        this.loadingCounter++;
        if (this.loadingCounter === 2) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },
  },

  created() {
    this.getBookedSchedule();
    this.getBookedScheduleByEmployee();
  },
};
</script>
