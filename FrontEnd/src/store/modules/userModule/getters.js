export default {
  getToken: (state) => state.token,
  getEmployeeId: (state) => state.employeeId,
  getEmployeeFullName: (state) => state.employeeFullName,
  getEmployeeDeptCode: (state) => state.employeeDeptCode,
  getEmployeeDeptDesc: (state) => state.employeeDeptDesc,
  hasValues: (state) => {
    if (
      state.token !== null &&
      state.employeeId !== null &&
      state.employeeFullName !== null
    ) {
      return true;
    }
    return false;
  },
};
