export default {
  SET_ROOM_OPTIONS(state, roomOptions) {
    state.roomOptions = roomOptions;
  },

  SET_BUILDING_OPTIONS(state, buildingOptions) {
    state.buildingOptions = buildingOptions;
  },

  SET_DEPARTMENT_OPTIONS(state, departmentOptions) {
    state.departmentOptions = departmentOptions;
  },

  SET_SUBJECTCODE_OPTIONS(state, subjectCodeOptions) {
    state.subjectCodeOptions = subjectCodeOptions;
  },

  SET_AVAILABLE_ROOM(state, availableRooms) {
    state.availableRooms = availableRooms;
  },

  SET_BOOKED_ROOMS(state, bookedRooms) {
    if (bookedRooms) {
      for (const booked of bookedRooms) {
        booked.fromDate = new Date(booked.fromDate);
        booked.toDate = new Date(booked.toDate);
      }
    }
    state.bookedRooms = bookedRooms;
  },

  SET_SECTIONS(state, sections) {
    state.sections = sections;
  },

  SET_SEMESTER(state, semester) {
    state.semester = semester;
  },

  ADD_BULK_DATA(state, bulkData) {
    state.bulkData.push(bulkData);
    localStorage.setItem("bulkData", JSON.stringify(state.bulkData));
  },

  SET_EMPLOYEE_BOOKED_ROOMS(state, employeeBookedRooms) {
    if (employeeBookedRooms) {
      for (const booked of employeeBookedRooms) {
        booked.fromDate = new Date(booked.fromDate);
        booked.toDate = new Date(booked.toDate);
      }
    }
    state.employeeBookedRooms = employeeBookedRooms;
  },

  SET_SCHEDULED_ROOM_VIEW(state, scheduledRoomView) {
    state.scheduledRoomView = scheduledRoomView;
  },

  SET_ALL_ROOMS_REPORT(state, allRoomsReport) {
    state.allRoomsReport = allRoomsReport;
  },

  SET_ROOMS(state, rooms) {
    state.rooms = rooms;
  },
};
