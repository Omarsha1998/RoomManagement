const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectActiveCases = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    ` SELECT 
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  nd.id,
  nd.fieldCode,
  nd.Value fieldValue,
  n.Id noteId,
    e.DeptCode,
  nd.DateTimeCreated,
  nd.DateTimeUpdated,
  e.Id encounterId,
  e.Code encounterCode,
    n.FieldGroupCode,
  e.caseNo
FROM
  EMR.dbo.NoteDetails nd
  INNER JOIN EMR.dbo.Notes n ON n.Id = nd.noteId
  INNER JOIN EMR.dbo.Encounters e ON e.Code = n.EncounterCode

    WHERE 1=1 ${conditions}

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

module.exports = {
  selectActiveCases,
};
