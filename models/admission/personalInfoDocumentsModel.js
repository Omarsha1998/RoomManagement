const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const getPersonalInfoDocuments = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ref_number,
      name,
      fileValue,
      fileName,
      fileType,
      documentFile,
      college,
      status,
      notified,
      semester,
      active,
      dateTimeCreated, 
      dateTimeUpdated
    from UERMOnlineAdmission..PersonalInfoDocuments
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (applicants.length > 0) {
      // for (let app of applicants) {
      //   app.fileValue = Buffer.from(app.fileValue).toString("base64");
      // }
      applicants.forEach((list) => {
        if (list.fileValue !== null) {
          list.fileValue = Buffer.from(list.fileValue).toString("base64");
        }
      });
    }
    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertDocumentFiles = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Documents" };
  }
  try {
    return await sqlHelper.insert(
      "UERMOnlineAdmission..PersonalInfoDocuments",
      payload,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateDocumentFiles = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMOnlin eAdmission..PersonalInfoDocuments",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  getPersonalInfoDocuments,
  insertDocumentFiles,
  updateDocumentFiles,
};
