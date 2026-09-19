// Hardcoded fee-clearance records, shaped after the LCO fields confirmed in the
// SRS (§2.5, §3.5): student ID, name, department, course, year level, status.
// Swap for a real `fee_payments` query later.
export const students = [
  { student_id: '2021-00123', name: 'Juan Dela Cruz', department: 'CCIS', course: 'BSIT', year_level: 3, status: 'Paid' },
  { student_id: '2021-00456', name: 'Maria Santos', department: 'CCIS', course: 'BSCS', year_level: 3, status: 'Not Paid' },
  { student_id: '2022-00789', name: 'Pedro Reyes', department: 'CEGS', course: 'BSCE', year_level: 2, status: 'Paid' },
  { student_id: '2020-00321', name: 'Ana Lim', department: 'CAA', course: 'BSArch', year_level: 4, status: 'Not Paid' },
  { student_id: '2023-00654', name: 'Jose Rizal', department: 'CED', course: 'BEEd', year_level: 1, status: 'Paid' },
  { student_id: '2021-00987', name: 'Liza Manalo', department: 'CMNS', course: 'BSBio', year_level: 3, status: 'Not Paid' },
  { student_id: '2022-00147', name: 'Mark Villanueva', department: 'CCIS', course: 'BSIT', year_level: 2, status: 'Paid' },
  { student_id: '2020-00258', name: 'Grace Tan', department: 'CBAM', course: 'BSA', year_level: 4, status: 'Paid' },
]
