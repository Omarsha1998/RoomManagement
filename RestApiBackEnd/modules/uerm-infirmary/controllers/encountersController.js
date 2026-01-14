/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const innerUtil = require("../helpers/util.js");
const { PDFDocument } = require("pdf-lib-plus-encrypt");

// MODELS //
const patientsModel = require("../models/patientsModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getInfirmaryPatients = async function (req, res) {
  if (util.empty(req.query.searchTerm))
    return res.status(400).json({ error: "Params in `query` is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.searchTerm) {
        conditions = `and name like '%${req.query.searchTerm}%'`;
        args = [];
      }

      return await patientsModel.selectInfirmaryPatients(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getEncounters = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      return await patientsModel.selectEncounters(
        conditions,
        args,
        {
          order: "dateTimeAdmitted asc",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getNotes = async function (req, res) {
  if (util.empty(req.query.caseNo))
    return res.status(400).json({ error: "Params in `query` is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and caseNo = ? and fieldGroupType = 1";
      const args = [req.query.caseNo];

      const encounterNotes = await patientsModel.selectNoteDetails(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      let generalNotes = [];
      if (encounterNotes.length > 0) {
        generalNotes = await patientsModel.selectNoteDetails(
          "and patientNo = ? and fieldGroupType = 0",
          [encounterNotes[0].patientNo],
          {
            order: "",
            top: "",
          },
          txn,
        );
      }

      const combineNotes = [...generalNotes, ...encounterNotes];

      const notesHashMap = util.buildHashTable(combineNotes, "fieldGroupCode");
      const notesFieldsHashMap = util.buildHashTable(combineNotes, "fieldCode");

      return {
        raw: combineNotes,
        hashMapFieldGroups: notesHashMap,
        hashMapFields: notesFieldsHashMap,
        generalNotes: generalNotes,
        encounterNotes: encounterNotes,
      };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const postEncounter = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { encounterDetails, noteFieldsDetails } = req.body;

      const encounterData = await patientsModel.insertEncounterData(
        encounterDetails,
        "Infirmary..InfEncounters",
        true,
        "code",
        "I",
        txn,
      );
      if (Object.keys(encounterData).length > 0) {
        try {
          const notes = await patientsModel.insertEncounterData(
            {
              encounterCode: encounterData.code,
              fieldGroupCode: noteFieldsDetails.fieldGroupCode,
            },
            "Infirmary..InfNotes",
            true,
            "code",
            "N",
            txn,
          );

          if (Object.keys(notes).length > 0) {
            for (const list of noteFieldsDetails.fields) {
              await sqlHelper.transact(async (txn) => {
                return await patientsModel.insertEncounterData(
                  {
                    noteCode: notes.code,
                    ...list,
                  },
                  "Infirmary..InfNotesFields",
                  false,
                  "",
                  "",
                  txn,
                );
              });
            }
          } else {
            console.log("No note saved");
            return { error: "No note saved." };
          }

          return encounterData;
        } catch (err) {
          console.log(err);
          return err;
        }
      } else {
        console.log("No encounter saved");
        return { error: "No encounter saved" };
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const postNotes = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { notesDetails, noteFieldsDetails } = req.body;

      const notes = await patientsModel.insertEncounterData(
        notesDetails,
        "Infirmary..InfNotes",
        true,
        "code",
        "N",
        txn,
      );

      if (notes.error) {
        throw notes.message;
      }

      if (Object.keys(notes).length > 0) {
        if (util.empty(notes.code)) {
          throw "No note saved!";
        }

        for (const list of noteFieldsDetails.fields) {
          await sqlHelper.transact(async (innerTxn) => {
            return await patientsModel.insertEncounterData(
              {
                noteCode: notes.code,
                ...list,
              },
              "Infirmary..InfNotesFields",
              false,
              "",
              "",
              innerTxn,
            );
          });
        }
      }

      return notes;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const putNotes = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { noteFieldsDetails, newNoteFieldsDetails } = req.body;
      const noteCode = req.params.noteCode;

      const notes = await patientsModel.updateEncounterData(
        {
          // updatedBy: util.currentUserToken(req).code,
          updatedBy: "7679",
        },
        "Infirmary..InfNotes",
        {
          code: noteCode,
        },
        "DateTimeUpdated",
        txn,
      );

      if (!util.isObjAndEmpty(notes)) {
        // For Current Fields //
        for (const list of noteFieldsDetails.fields) {
          await sqlHelper.transact(async (innerTxn) => {
            await innerUtil.postLogs(
              {
                noteCode: noteCode,
                ...list,
                type: "UPDATE",
              },
              "Infirmary..InfNotesFields",
              "Infirmary..InfLogsNotesFields",
              `and noteCode = ? and fieldCode = ?`,
              [noteCode, list.fieldCode],
              "value",
              txn,
            );
            await patientsModel.updateEncounterData(
              list,
              "Infirmary..InfNotesFields",
              { noteCode: noteCode, fieldCode: list.fieldCode },
              "DateTimeUpdated",
              innerTxn,
            );
          });
        }
        // For Current Fields //

        // For New Fields //
        if (newNoteFieldsDetails.fields.length > 0) {
          for (const newList of newNoteFieldsDetails.fields) {
            await sqlHelper.transact(async (innerTxn) => {
              // await innerUtil.postLogs(
              //   {
              //     noteCode: noteCode,
              //     ...newList,
              //     type: "CREATE",
              //   },
              //   "Infirmary..InfNotesFields",
              //   "Infirmary..InfLogsNotesFields",
              //   `and noteCode = ? and fieldCode = ?`,
              //   [noteCode, newList.fieldCode],
              //   "value",
              //   txn,
              // );
              return await patientsModel.insertEncounterData(
                {
                  noteCode: noteCode,
                  ...newList,
                },
                "Infirmary..InfNotesFields",
                false,
                "",
                "",
                innerTxn,
              );
            });
          }
        }
        // For New Fields //

        // const logsNotes = {
        //   code: noteCode,
        //   encounterCode: notesDetails.encounterCode,
        //   fieldGroupCode: noteFieldsDetails.fieldGroupCode
        // }
        // await innerUtil.postLogs()
      }

      return notes;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getLabPdfList = async (req, res) => {
  if (util.empty(req.query.patientNo))
    return res.status(400).json({ error: "Patient No `query` is required" });

  const sqlWhereStr = "";
  const sqlArgs = [req.query.patientNo];

  // if (
  //   req.query.dateRange &&
  //   req.query.dateRange.from &&
  //   req.query.dateRange.to
  // ) {
  //   sqlWhereStr = "WHERE CONVERT(DATE, r.DateCreated) BETWEEN ? AND ?";
  //   sqlArgs.push(req.query.dateRange.from);
  //   sqlArgs.push(req.query.dateRange.to);
  // }

  const sqlStr = `BEGIN
      DECLARE @patientNo varchar(15) = ?

      DECLARE @tbl TABLE(
        ChargeslipNo varchar(20),
        description varchar(1000),
        patientNo varchar(20),
        caseNo varchar(20),
        patientCategory varchar(255),
        patientType varchar(255),
        uermAffiliation varchar(255),
        hmoName varchar(1000),
        hmoName2 varchar(1000),
        balance money
      )

      DECLARE @tblResult TABLE(
        ChargeslipNo varchar(20), 
        ResultLocation varchar(1000),
        DateCreated datetime,
        rawPDF varchar(max),
        ORU varchar(max)
      )

      ----------------------------------------------
      --CONCAT CHARGESLIP DESCRIPTION
      ----------------------------------------------
      INSERT INTO @tbl(
        ChargeslipNo, 
        description, 
        patientNo,
        caseNo, 
        patientCategory, 
        patientType,
        uermAffiliation,
        hmoName, 
        hmoName2,
        balance
      )
      SELECT DISTINCT
        ST2.ChargeslipNo, 
        SUBSTRING((
            SELECT ','+ST1.ChargeDescription  AS [text()]
            FROM UERM_LIS..HISLabInfoSystemOrder ST1
            WHERE ST1.ChargeslipNo = ST2.ChargeslipNo
                and ISNULL(ResultLocation,'') <> ''
            ORDER BY ST1.ChargeDescription
            FOR XML PATH ('')
          ), 2, 1000) HISLabInfoSystemOrder,
        c.patientNo,
        c.caseNo,
        c.PATIENT_CATEGORY patientCategory,
        c.patientType,
        c.UERM_STUD_EMPLOYEE uermAffiliation,
        h.name hmoName,
        h2.name hmoName2,
        bal.balance
      FROM
        UERM_LIS..HISLabInfoSystemOrder ST2 WITH(NOLOCK INDEX(PK_HISLabInfoSystemOrder))
        INNER JOIN UERMMMC..CASES c WITH(NOLOCK INDEX(pk_cases)) on ST2.CaseNumber = c.CASENO
        LEFT JOIN UERMMMC..vw_acpHMO_and_Company h WITH(NOLOCK) ON c.hmo_code = h.Code AND h.[type] = 'HMO'
        LEFT JOIN UERMMMC..vw_acpHMO_and_Company h2 WITH(NOLOCK) ON c.COMPANY_CODE = h2.Code AND h2.[type] = 'COM'
        LEFT JOIN UERMMMC..CASES_BALANCES bal ON c.CaseNo = bal.CaseNo
      WHERE
        ISNULL(ResultLocation,'') <> ''
        AND c.PATIENTNO = @patientNo
        --AND CONVERT(DATE, ST2.DateCreated) BETWEEN @dateFrom AND @dateTo

      ----------------------------------------------
      --GET RESULTS LOCATIONS MAIN
      ----------------------------------------------
      INSERT INTO @tblResult(ChargeslipNo, ResultLocation, DateCreated, rawPDF, ORU)
      SELECT DISTINCT
        T.ChargeslipNo,
        R.ResultLocation,
        r.DateCreated, 
        cast(r.RawPDF as varchar(max)), 
        r.ORU
      FROM
        @tbl t 
        INNER JOIN UERM_LIS..HISLabInfoSystemOrder r WITH(NOLOCK INDEX(PK_HISLabInfoSystemOrder)) ON t.chargeslipno=r.chargeslipno

      ----------------------------------------------
      --GET RESULTS LOCATIONS SUBS
      ----------------------------------------------
      insert into @tblResult(ChargeslipNo, ResultLocation, DateCreated, ORU)
      select distinct T.ChargeslipNo,e.ResultLocation,e.date, e.ORU from @tbl t 
      inner join UERM_LIS..HISLabInfoSystemOrder_Ext e on t.ChargeslipNo=e.chargeslipno
      where isnull(ResultLocation,'')<>''

      SELECT DISTINCT 
        id=0,
        ChargeID='',
        t.ChargeslipNo csno,
        t.caseNo,
        t.description,
        SUBSTRING(r.ResultLocation,charindex('pdf',r.ResultLocation)+1,len(r.ResultLocation)) result,
        SUBSTRING(r.ResultLocation,charindex('pdf',r.ResultLocation)+1,len(r.ResultLocation)) resultUrl,
        null attachments,
        convert(char(10), r.DateCreated, 111) resultDate,
        'LAB' revCode,
        'LAB' type,
        1 isValidated,
        SUBSTRING(r.ORU, charindex('outbox', r.ORU) + 1, len(r.ORU)) hl7Result,
        cm.RefOrNo orNo,
        cm.ChargeDateTime procedureDateTime,
        t.patientCategory,
        t.patientType,
        t.uermAffiliation,
        t.hmoName,
        t.hmoName2,
        t.balance
      FROM
        @tbl t 
        LEFT JOIN @tblResult r ON t.ChargeslipNo = r.ChargeslipNo
        LEFT JOIN UERMMMC..CHARGES_MAIN cm ON r.ChargeSlipNo = cm.ChargeSlipNo
      ${sqlWhereStr}
      ORDER BY
        resultDate DESC
    END`;

  const rows = await sqlHelper.query(sqlStr, sqlArgs);
  if (rows.error) return res.status(500).json(null);

  const response = [];

  if (rows && rows.length > 0) {
    for (const row of rows) {
      row.procedureDateTime = util.formatDate2({
        date: row.procedureDateTime,
      });

      row.resultDate = util.formatDate2({
        date: row.resultDate,
        dateOnly: true,
      });

      if (row.result && row.result.endsWith(".pdf")) {
        response.push({
          centerTypeCode: "LAB",
          code: row.csno,
          orNo: row.orNo,
          caseNo: row.caseNo,
          patientCategory: row.patientCategory,
          patientType: row.patientType,
          uermAffiliation: row.uermAffiliation,
          procedureDateTime: row.procedureDateTime,
          hmoName: row.hmoName,
          hmoName2: row.hmoName2,
          balance: row.balance,
          description: row.description,
          resultDate: row.resultDate,
          fileUrl: row.resultUrl ? row.resultUrl.substring(12) : null,
        });
      }
    }
  }

  res.json(response);
};

const getLabPdfFileV1 = async (req, res) => {
  if (!req.body.year || !req.body.pdfFileName) {
    return res.status(400).json("Invalid Parameters");
  }
  console.log("ilan");

  // Validate req.query.year as it's directly embedded into the select SQL
  if (req.body.year.length !== 4 || !util.isNumber(req.body.year))
    return res.status(400).json("`year` URL query must be 4 digits.");

  const labResultYear = req.body.year;
  const pdfFileName = req.body.pdfFileName;

  const conditions = {
    is_directory: 0,
    "[name]": pdfFileName,
  };

  const [whereStr, whereArgs] = sqlHelper.where(conditions);

  const sqlStr = `SELECT
      [file_stream] fileStream
    FROM
      DR${labResultYear}..LaboratoryResults
    ${whereStr};`;

  const result = await sqlHelper.query(
    sqlStr,
    whereArgs,
    sqlHelper.getConn("diag"),
  );
  if (result.error) return res.status(500).json(null);

  if (result[0]?.fileStream) {
    const buff = result[0].fileStream;

    // GENERATE ENCRYPTED VERSION OF THE PDF

    // if (req.query.encrypted === "1") {
    //   const userBirthDate = new Date(req.user.birthDate);
    //   const pdfDoc = await PDFDocument.load(buff);

    //   pdfDoc.encrypt({
    //     userPassword: `${req.user.code}:${pwFromBirthDate(userBirthDate)}`,
    //   });

    //   buff = Buffer.from(await pdfDoc.save());
    // }

    res.setHeader("Content-Type", "application/pdf");
    res.send(buff);
    return;
  }

  // res.status(NOT_FOUND.code).json("Pdf file not found.");
  res.setHeader("Content-Type", "text/html");
  res.send(
    `<div style="background: white; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;"><strong>No PDF Available.</strong></div>`,
  );
};

module.exports = {
  getInfirmaryPatients,
  getEncounters,
  getNotes,
  getLabPdfList,
  getLabPdfFileV1,
  postEncounter,
  postNotes,
  putNotes,
};
