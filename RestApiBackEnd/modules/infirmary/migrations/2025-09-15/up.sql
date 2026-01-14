INSERT INTO AnnualPhysicalExam..Exams (
  Code,
  Name,
  SequenceNumber,
  Icon
) VALUES (
  'DENTAL',
  'Dental Exam',
  7,
  'fa-solid fa-tooth'
);

INSERT INTO AnnualPhysicalExam..ExamParams (
  ExamId,
  Code,
  Name,
  FieldType,
  SequenceNumber,
  Options
) VALUES (
  7,
  'PRESENTCOND',
  'Present Dental Condition',
  'EXAMMULTISELECT',
  2,
  '["Teeth tender to chew on","Bleeding areas in the mouth","Spaces developing between teeth","Change of the color of the teeth and gums","Teeth sensitive to hot, cold, sweets","Swelling or lumps in the mouth","Difficulty in speaking","Pain in jaw","Tongue thrusting","Bruxism/Night grinding","Mouth breathing"]'
);

INSERT INTO AnnualPhysicalExam..ExamParams (
  ExamId,
  Code,
  Name,
  FieldType,
  SequenceNumber
) VALUES (
  7,
  'REMARKS',
  'Remarks',
  'EXAMTEXTAREA',
  3
);

INSERT INTO AnnualPhysicalExam..ExamParams (
  ExamId,
  Code,
  Name,
  FieldType,
  SequenceNumber
) VALUES (
  7,
  'CHART',
  'Dental Chart',
  'EXAMDENTALCHART',
  1
);

UPDATE AnnualPhysicalExam..ExamParams SET
  FieldType = 'EXAMILLNESSES'
WHERE
  ExamId = 1
  AND Code IN (
    'PRESENTSYMPTOMS',
    'PASTILLNESSES'
  );


UPDATE AnnualPhysicalExam..ExamParams SET
  [Name] = 'Present Illness'
WHERE
  ExamId = 1
  AND Code = 'PRESENTSYMPTOMS';


UPDATE AnnualPhysicalExam..ExamParams SET
  [Name] = 'Past Illness'
WHERE
  ExamId = 1
  AND Code = 'PASTILLNESSES';



UPDATE AnnualPhysicalExam..ExamParams SET
  SequenceNumber = 9
WHERE
  ExamId = 1
  AND Code = 'REMARKS';


INSERT INTO AnnualPhysicalExam..ExamParams (
  ExamId,
  Code,
  Name,
  FieldType,
  SequenceNumber
) VALUES (
  1,
  'SOCHIST',
  'Social History',
  'EXAMTEXTAREA',
  8
);


UPDATE AnnualPhysicalExam..ExamParams SET
  Code = 'DNTLCOND',
  [Name] = 'Dental Condition',
  FieldType = 'EXAMDNTLCOND'
WHERE
  ExamId = 7
  AND Code = 'PRESENTCOND';


UPDATE AnnualPhysicalExam..ExamParams SET
  Options = '[{"value":1,"label":"Teeth tender to chew on"},{"value":2,"label":"Bleeding areas in the mouth"},{"value":3,"label":"Spaces developing between teeth"},{"value":4,"label":"Change of the color of the teeth and gums"},{"value":5,"label":"Teeth sensitive to hot, cold, sweets"},{"value":6,"label":"Swelling or lumps in the mouth"},{"value":7,"label":"Difficulty in speaking"},{"value":8,"label":"Pain in jaw"},{"value":9,"label":"Tongue thrusting"},{"value":10,"label":"Bruxism/Night grinding"},{"value":11,"label":"Mouth breathing"}]'
WHERE
  ExamId = 7
  AND Code = 'DNTLCOND';


UPDATE AnnualPhysicalExam..ExamParams SET
  FieldType = 'EXAMILLNESSES'
WHERE
  ExamId = 1
  AND Code = 'FAMHIST';


-- UPDATE AnnualPhysicalExam..VisitExamDetails SET
--   ExamParamCode = 'DNTLCOND'
-- WHERE
--   ExamParamCode = 'PRESENTCOND';

