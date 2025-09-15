export default {
  SET_LOGIN_DATA(state, data) {
    state.token = data.token || null;
    state.employeeId = data.employeeId || null;
    state.employeeFullName = data.employeeFullName || null;
    state.employeeDeptCode = data.employeeDeptCode || null;
    state.employeeDeptDesc = data.employeeDeptDesc || null;
  },

  SET_LOGIN_DATA_DEFAULT(state) {
    state.token = null;
    state.employeeId = null;
    state.employeeFullName = null;
    state.employeeDeptCode = null;
    state.employeeDeptDesc = null;
  },
};
