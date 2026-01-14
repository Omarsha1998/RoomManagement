const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectScholarshipApplicationsRaw = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const scholarshipApplications = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.id,
        a.code,
        a.referenceNumber,
        a.applicationNumber,
        a.studentNumber,
        a.degreeProgram,
        a.semester,
        a.status,
        a.scholarshipApplied,
        a.relativeInMedicalCenter,
        a.relativeName,
        a.active,
        a.createdBy,
        a.updatedBy,
        a.dateTimeCreated dateTimeApplied,
        a.dateTimeUpdated,
        a.remarks
        from Scholarship..ScholarshipApplications a
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (scholarshipApplications.length > 0) {
      for (const list of scholarshipApplications) {
        list.dateTimeApplied = util.formatDate2({
          date: list.dateTimeApplied,
        });
      }
    }

    return scholarshipApplications;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipApplications = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const scholarshipApplications = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.id,
        a.code,
        a.referenceNumber,
        a.applicationNumber,
        a.studentNumber,
        a.degreeProgram,
        a.semester,
        a.status,
        a.scholarshipApplied,
        a.relativeInMedicalCenter,
        a.relativeName,
        a.active,
        a.createdBy,
        a.updatedBy,
        a.dateTimeCreated dateTimeApplied,
        a.dateTimeUpdated,
        a.remarks,
        c.approvalLevelCode,
        c.status approvalStatus,
        c.dateTimeUpdated dateTimeApproved,
        c.updatedBy approvedBy
        from Scholarship..ScholarshipApplications a
    left join Scholarship..ScholarshipApplicationApprovals c on c.ScholarshipCode = a.code and c.active = 1
      WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (scholarshipApplications.length > 0) {
      for (const list of scholarshipApplications) {
        list.dateTimeApplied = util.formatDate2({
          date: list.dateTimeApplied,
        });

        list.dateTimeApproved = util.formatDate2({
          date: list.dateTimeApproved,
        });
      }
    }

    return scholarshipApplications;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipApplicationDetails = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const scholarshipApplications = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      code,
      referenceNumber,
      applicationNumber,
      studentNumber,
      semester,
      status,
      scholarshipApplied,
      relativeInMedicalCenter,
      degreeProgram,
      relativeName,
      active,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from Scholarship..ScholarshipApplications
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (scholarshipApplications.length > 0) {
      for (const list of scholarshipApplications) {
        list.dateTimeCreated = util.formatDate2({
          date: list.dateTimeCreated,
          dateOnly: true,
        });
      }
    }

    return scholarshipApplications;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipFlowApprovals = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const scholarshipFlow = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      c.scholarshipCode,
      a.referenceNumber,
      a.applicationNumber,
      a.semester,
      concat(d.Last_Name, ', ', d.First_Name, ' ', d.NameExtension, ' ', d.Middle_Name) fullName,
      b.approvalLevelCode,
      b.levelApproval,
      b.degreeProgram,
      c.status,
      c.createdBy,
      c.updatedBy,
	    a.dateTimeCreated dateTimeApplied,
      c.dateTimeCreated,
      c.dateTimeUpdated
    from Scholarship..ScholarshipApplications a
      join Scholarship..ScholarshipApprovalFlows b on b.degreeProgram = a.degreeProgram and b.active = 1
      left join Scholarship..ScholarshipApplicationApprovals c on c.ScholarshipCode = a.code and c.ApprovalLevelCode = b.ApprovalLevelCode and c.active = 1
      join UERMOnlineAdmission..PersonalInfo d on d.Ref_Number = a.ReferenceNumber
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return scholarshipFlow;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipsReceived = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const scholarshipFlow = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      scholarshipCode,
      name,
      schoolYear,
      course,
      active,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from Scholarship..ScholarshipsReceived
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return scholarshipFlow;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipRequirements = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      code,
      name,
      description,
      scholarshipCode,
      sequence,
      required,
      fileType,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from Scholarship..Requirements
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipFileWithoutRaw = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      scholarshipCode,
      fileName,
      fileType,
      documentFile,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from Scholarship..ScholarshipFiles
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScholarshipFile = async function (conditions, args, options, txn) {
  try {
    const scholarshipFiles = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      scholarshipCode,
      fileName,
      fileValue,
      fileType,
      documentFile,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from Scholarship..ScholarshipFiles
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (scholarshipFiles.length > 0) {
      for (const file of scholarshipFiles) {
        if (file.fileValue !== null) {
          file.fileValue = Buffer.from(file.fileValue).toString("base64");
        }
      }
    }

    return scholarshipFiles;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateScholarshipApplication = async function (
  payload,
  condition,
  table,
  txn,
) {
  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertScholarshipApplication = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }
  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertScholarshipApplicationWithColumns = async function (
  payload,
  table,
  txn,
  columnsToSelect,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }
  try {
    return await sqlHelper.insert(
      `${table}`,
      payload,
      txn,
      "dateTimeCreated",
      true,
      columnsToSelect,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateScholarshipApplicationWithColumns = async function (
  payload,
  condition,
  table,
  txn,
  columnsToSelect,
) {
  try {
    return await sqlHelper.update(
      `${table}`,
      payload,
      condition,
      txn,
      "dateTimeUpdated",
      true,
      columnsToSelect,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectScholarshipApplicationsRaw,
  selectScholarshipApplications,
  selectScholarshipsReceived,
  selectScholarshipFile,
  selectScholarshipFileWithoutRaw,
  selectScholarshipFlowApprovals,
  selectScholarshipRequirements,
  selectScholarshipApplicationDetails,
  insertScholarshipApplication,
  insertScholarshipApplicationWithColumns,
  updateScholarshipApplication,
  updateScholarshipApplicationWithColumns,
};
