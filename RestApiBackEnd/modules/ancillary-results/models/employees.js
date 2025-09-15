const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

  
  const selectEmployees = async function (conditions, txn) {
    return await sqlHelper.select(
      [
        "code",
        "fullname",
        "lastName",
        "firstName",
        "middleName",
        "mobileNo",
        "email = case when uermEmail is null then email else uermEmail end",
        "is_active active",
        "pos_desc position",
        "dept_desc department"
      ],
      `[UE Database]..vw_Employees`,
      conditions,
      txn
    );
  };
  
  
  module.exports = {
    selectEmployees
  }