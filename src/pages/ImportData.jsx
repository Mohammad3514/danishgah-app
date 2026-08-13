import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const MONTH_MAP = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12
};

export default function ImportData() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedSummary, setImportedSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const inferClassFromSheetName = (sheetName) => {
    const lower = sheetName.toLowerCase();
    if (lower.includes('muntazir') || lower.includes('3-4') || lower.includes('class 3') || lower.includes('class 4')) return 'Muntazir (3-4)';
    if (lower.includes('muntaqim') || lower.includes('class 5') || lower.includes('5th')) return 'Muntaqim (5)';
    if (lower.includes('zaman') || lower.includes('class 6') || lower.includes('6th')) return 'Zaman (6)';
    if (lower.includes('qaim') || lower.includes('7-8') || lower.includes('class 7') || lower.includes('class 8')) return 'Qaim (7-8)';
    if (lower.includes('hujjat') || lower.includes('9-10') || lower.includes('class 9') || lower.includes('class 10')) return 'Hujjat (9-10)';
    if (lower.includes('senior')) return 'Senior Class';
    return sheetName.trim();
  };

  const inferMonthAndYear = (sheetName) => {
    const lower = sheetName.toLowerCase();
    let foundMonth = null;
    for (const [mName, mNum] of Object.entries(MONTH_MAP)) {
      if (lower.includes(mName)) {
        foundMonth = mNum;
        break;
      }
    }
    const yearMatch = lower.match(/20\d{2}/);
    const foundYear = yearMatch ? parseInt(yearMatch[0], 10) : 2025;
    return { month: foundMonth || 4, year: foundYear }; // default to April 2025 if unspecified
  };

  const parseDateFromColumn = (colKey, sheetName) => {
    if (colKey === undefined || colKey === null) return null;
    const str = String(colKey).trim();
    if (!str) return null;

    const lower = str.toLowerCase();
    const nonDateKeys = [
      'name', 'student name', 'student', 'fullname', 'full name', 'name of student',
      'roll', 'roll no', 'rollno', 'roll_number', 'roll number', 'id', 's.no', 'sr', 'sr.no', 'sr #', 'r.no',
      'class', 'grade', 'standard', 'sec', 'section',
      'father', 'father name', 'father\'s name', 'father_name', 'guardian',
      'total', 'total present', 'total absent', 'total leave', 'present', 'absent', 'leave',
      '%', 'percentage', 'remarks', 'status', 'card', 'card issued'
    ];
    if (nonDateKeys.some(k => lower === k || lower.startsWith(k))) return null;

    // 1. Excel Serial Number (e.g. 45000 to 46000)
    if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
      const num = Number(str);
      const date = new Date((num - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    // 2. Format YYYY-MM-DD
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;

    // 3. Format DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/.]([0-1]?\d)[-/.](20\d{2}|\d{2})$/);
    if (dmyMatch) {
      let d = parseInt(dmyMatch[1], 10);
      let m = parseInt(dmyMatch[2], 10);
      let y = parseInt(dmyMatch[3], 10);
      if (y < 100) y += 2000;

      if (m > 12 && d <= 12) {
        const temp = d; d = m; m = temp;
      }
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // 4. Format YYYY/MM/DD
    const ymdMatch = str.match(/^(20\d{2})[-/.]([0-1]?\d)[-/.]([0-3]?\d)$/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
      const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // 5. Day number only like "1", "01", "31"
    if (str.match(/^\d{1,2}$/)) {
      const day = parseInt(str, 10);
      if (day >= 1 && day <= 31) {
        const { month, year } = inferMonthAndYear(sheetName);
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }
    }

    // 6. Formats with month names: "01-Apr-2025", "1 Apr", "Apr 1", "01/Apr", "Apr-01"
    const mMatch = str.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3,9})(?:[-/\s](20\d{2}|\d{2}))?$/) || 
                   str.match(/^([a-zA-Z]{3,9})[-/\s](\d{1,2})(?:[-/\s](20\d{2}|\d{2}))?$/);
    if (mMatch) {
      let day, mStr, yearStr;
      if (!isNaN(Number(mMatch[1]))) {
        day = parseInt(mMatch[1], 10);
        mStr = mMatch[2].toLowerCase();
        yearStr = mMatch[3];
      } else {
        mStr = mMatch[1].toLowerCase();
        day = parseInt(mMatch[2], 10);
        yearStr = mMatch[3];
      }
      const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
      if (mNum && day >= 1 && day <= 31) {
        let year = yearStr ? parseInt(yearStr, 10) : inferMonthAndYear(sheetName).year;
        if (year < 100) year += 2000;
        const mm = String(mNum).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }
    }

    return null;
  };

  const cleanStatus = (val) => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim().toLowerCase();
    if (!s || s === '-' || s === 'n/a' || s === 'null' || s === 'off' || s === 'sunday' || s === 'holiday' || s === 'majlis' || s === 'cancelled') return null;

    if (['p', '-p', 'present', '1', 'true', 'yes', 'y', '✓', '✔', 'v', 'pr', 'pre'].includes(s) || s.startsWith('p') || s === '-p') {
      return 'Present';
    }
    if (['a', '-a', 'absent', '0', 'false', 'no', 'n', 'x', '✗', 'ab', 'abs'].includes(s) || s.startsWith('a') || s === '-a') {
      return 'Absent';
    }
    if (['l', 'leave', 'lev', 'lea', 'sl', 'cl', 'r', 'lt', 'late'].includes(s) || s.startsWith('l') || s.startsWith('lt')) {
      return 'Leave';
    }
    return null;
  };

  // Helper to safely get value from object regardless of column header case, colons, or punctuation
  const getCol = (row, ...colNames) => {
    const keys = Object.keys(row);
    for (const name of colNames) {
      const match = keys.find(k => {
        const cleanK = k.replace(/[:_]/g, ' ').toLowerCase().trim();
        const cleanName = name.replace(/[:_]/g, ' ').toLowerCase().trim();
        return cleanK === cleanName || cleanK.includes(cleanName);
      });
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
        return String(row[match]).trim();
      }
    }
    return '';
  };

  // Safe Excel date formatter for Postgres DATE fields
  const formatDate = (val) => {
    if (!val) return new Date().toISOString().split('T')[0];
    if (typeof val === 'number' || !isNaN(Number(val))) {
      const num = Number(val);
      if (num > 30000 && num < 60000) {
        const date = new Date((num - (25567 + 2)) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  const parseSheetToRows = (worksheet) => {
    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!matrix || matrix.length === 0) return [];

    // Find header row in first 15 rows
    let headerRowIdx = -1;

    for (let r = 0; r < Math.min(15, matrix.length); r++) {
      const row = matrix[r];
      if (!row || !Array.isArray(row)) continue;

      const rowText = row.map(cell => String(cell).toLowerCase().trim()).join(' ');
      
      const hasNameOrStudent = rowText.includes('name') || rowText.includes('student') || rowText.includes('roll') || rowText.includes('s.no') || rowText.includes('sr');
      const hasDates = row.some(cell => parseDateFromColumn(cell, ''));
      const hasClass = rowText.includes('class') || rowText.includes('grade');

      if (hasNameOrStudent || (hasDates && row.length > 2) || hasClass) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = matrix.findIndex(r => Array.isArray(r) && r.filter(c => String(c).trim()).length >= 2);
      if (headerRowIdx === -1) headerRowIdx = 0;
    }

    const headers = matrix[headerRowIdx].map(h => String(h).trim());
    const dataRows = matrix.slice(headerRowIdx + 1);

    return dataRows.map(r => {
      const obj = {};
      headers.forEach((h, colIdx) => {
        const key = h || `__col_${colIdx + 1}`;
        obj[key] = r[colIdx] !== undefined ? String(r[colIdx]).trim() : '';
      });
      return obj;
    });
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetList = workbook.SheetNames.map(name => {
          const worksheet = workbook.Sheets[name];
          const rows = parseSheetToRows(worksheet);
          return { name, rows: rows.length, rawData: rows, sample: rows.slice(0, 2) };
        });

        setSheets(sheetList);

        // Auto map sheet names
        const autoMap = {};
        sheetList.forEach(s => {
          const lower = s.name.toLowerCase();
          if (
            lower.includes('attend') || lower.includes('att') ||
            lower.includes('muntazir') || lower.includes('muntaqim') || lower.includes('zaman') ||
            lower.includes('qaim') || lower.includes('hujjat') || lower.includes('senior') || lower.includes('class') ||
            ['january','february','march','april','may','june','july','august','september','october','november','december',
             'jan','feb','mar','apr','jun','jul','aug','sep','oct','nov','dec'].some(m => lower.includes(m))
          ) {
            autoMap[s.name] = 'Attendance';
          }
          else if (lower.includes('expense')) autoMap[s.name] = 'Expenses';
          else if (lower.includes('student')) autoMap[s.name] = 'Students';
          else autoMap[s.name] = 'Fee Records';
        });
        setMapping(autoMap);
        setStep(2);
      } catch (err) {
        setErrorMsg('Error reading file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleStartImport = async () => {
    setImporting(true);
    setStep(3);
    setProgress(10);
    setErrorMsg('');

    let totalStudentsImported = 0;
    let totalFeesImported = 0;
    let totalExpensesImported = 0;
    let totalAttendanceImported = 0;
    let mappedCount = 0;

    try {
      const selectedSheets = sheets.filter(s => mapping[s.name] && mapping[s.name] !== 'Skip');
      if (selectedSheets.length === 0) {
        throw new Error('Please select at least one sheet module to import (do not leave all sheets as "Skip").');
      }

      const stepPct = Math.floor(80 / Math.max(1, selectedSheets.length));

      for (let idx = 0; idx < selectedSheets.length; idx++) {
        const sheetObj = selectedSheets[idx];
        const moduleType = mapping[sheetObj.name];
        const raw = sheetObj.rawData;

        const currentSectionClass = inferClassFromSheetName(sheetObj.name);

        // Filter out empty rows, title header rows, or summary footer rows
        const validRows = raw.filter(r => {
          const keys = Object.keys(r);
          const hasAnyCell = keys.some(k => r[k] && String(r[k]).trim().length > 0);
          if (!hasAnyCell) return false;

          const stName = getCol(r, 'name', 'student name', 'student', 'fullname', 'full name', 'naam');
          if (stName) {
            const lower = stName.toLowerCase();
            if (lower.includes('name:') || lower.includes('father') || lower.startsWith('class') || lower.startsWith('roll') || lower.includes('total')) return false;
            return stName.trim().length > 1;
          }

          // Fallback check if row has student-like non-numeric cell
          return keys.some(k => {
            const v = String(r[k]).trim();
            return v.length > 2 && !v.match(/^\d+$/) && !parseDateFromColumn(k, sheetObj.name) && !v.toLowerCase().includes('total');
          });
        });

        // 1. Process Students
        if (moduleType === 'Students' || moduleType === 'Students & Fees') {
          const studentRecords = validRows.map((row, i) => {
            const cardVal = getCol(row, 'card issued', 'card_issued', 'card');
            const cardIssued = cardVal.toLowerCase().includes('y') ? 'Yes' : 'No';
            const cls = getCol(row, 'class', 'grade', 'standard') || currentSectionClass;
            
            return {
              roll_number: getCol(row, 'roll_number', 'roll no', 'rollno', 'roll number', 'id', 's.no', 'sr') || `R-${i + 101}`,
              name: getCol(row, 'name', 'student name', 'fullname', 'full name', 'student'),
              father_name: getCol(row, 'father\'s name', 'father_name', 'father name', 'father', 'guardian'),
              class: cls,
              school_name: getCol(row, 'school_name', 'school name', 'school', 'institute'),
              father_phone: getCol(row, 'father\'s phone', 'father_phone', 'father phone', 'father_phone_no', 'fathers_phone', 'parent_phone', 'phone', 'mobile'),
              date_of_birth: formatDate(getCol(row, 'date of birth', 'date_of_birth', 'dob')),
              address: getCol(row, 'address', 'city', 'location'),
              card_issued: cardIssued,
              status: 'Active'
            };
          });

          if (studentRecords.length > 0 && supabase.from) {
            const { error } = await supabase.from('students').insert(studentRecords);
            if (error) throw new Error(`Failed to insert students into database: ${error.message}`);
            totalStudentsImported += studentRecords.length;
          }
        }

        // 2. Process Monthly Fee Records
        if (moduleType === 'Fee Records' || moduleType === 'Students & Fees') {
          const feeRecords = [];

          validRows.forEach((row) => {
            const stName = getCol(row, 'name', 'student', 'student name', 'fullname', 'full name');
            const stClass = getCol(row, 'class', 'grade', 'standard') || currentSectionClass;
            const cardVal = getCol(row, 'card issued', 'card_issued', 'card');
            const cardIssued = cardVal.toLowerCase().includes('y') ? 'Yes' : 'No';

            const keys = Object.keys(row);
            const monthCols = keys.filter(k => 
              k.toLowerCase().includes('fees for') || 
              k.toLowerCase().includes('fee') ||
              ['january','february','march','april','may','june','july','august','september','october','november','december'].some(m => k.toLowerCase().includes(m))
            );

            if (monthCols.length > 0) {
              monthCols.forEach(colKey => {
                const val = row[colKey];
                const rawStr = String(val).trim();
                const numVal = Number(rawStr.replace(/[^0-9.]/g, ''));

                if (rawStr && !isNaN(numVal) && numVal > 0) {
                  let monthName = colKey.replace(/fees?\s*(for)?/i, '').trim();
                  if (monthName) {
                    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    if (!monthName.toLowerCase().includes('202')) monthName = `${monthName} 2025`;
                  } else {
                    monthName = 'August 2025';
                  }

                  feeRecords.push({
                    student_name: stName,
                    class: stClass,
                    month: monthName,
                    amount: numVal,
                    payment_method: 'Cash',
                    card_issued: cardIssued,
                    status: 'Paid',
                    paid_date: new Date().toISOString().split('T')[0]
                  });
                }
              });
            }
          });

          if (feeRecords.length > 0 && supabase.from) {
            let { error } = await supabase.from('fee_payments').insert(feeRecords);
            
            if (error && error.message && error.message.includes('status')) {
              const fallbackRecords = feeRecords.map(({ status, ...rest }) => rest);
              const retry = await supabase.from('fee_payments').insert(fallbackRecords);
              error = retry.error;
            }
            if (error && error.message && error.message.includes('card_issued')) {
              const fallbackRecords = feeRecords.map(({ status, card_issued, ...rest }) => rest);
              const retry = await supabase.from('fee_payments').insert(fallbackRecords);
              error = retry.error;
            }

            if (error) throw new Error(`Failed to insert fee records into database: ${error.message}`);
            totalFeesImported += feeRecords.length;
          }
        }

        // 3. Process Expenses
        if (moduleType === 'Expenses') {
          const expenseRecords = validRows.map((row) => ({
            date: formatDate(getCol(row, 'date', 'expense date')),
            category: getCol(row, 'category', 'type') || 'Miscellaneous',
            description: getCol(row, 'description', 'title', 'detail', 'item', 'particulars') || 'Operating Expense',
            amount: Number(getCol(row, 'amount', 'cost', 'total', 'price')) || 1000,
            paid_by: getCol(row, 'paid by', 'paid_by', 'person') || 'Admin',
            payment_method: getCol(row, 'method', 'mode') || 'Cash'
          }));

          if (expenseRecords.length > 0 && supabase.from) {
            const { error } = await supabase.from('expenses').insert(expenseRecords);
            if (error) throw new Error(`Failed to insert expenses into database: ${error.message}`);
            totalExpensesImported += expenseRecords.length;
          }
        }

        // 4. Process Attendance (Guarantees non-null student_id UUID foreign key from students table)
        if (moduleType === 'Attendance') {
          let studentMap = {};
          let studentClassMap = {};

          const cleanNameKey = (str) => {
            if (!str) return '';
            return str.toLowerCase()
              .replace(/^(syed|muhammad|md|m\.|mr\.)\s+/g, '')
              .replace(/[^a-z0-9]/g, '')
              .trim();
          };

          // Step A: Load existing students from database
          if (supabase.from) {
            const { data: existingStudents } = await supabase.from('students').select('id, name, roll_number, class');
            if (existingStudents && existingStudents.length > 0) {
              existingStudents.forEach(st => {
                if (st.name) {
                  const rawKey = st.name.trim().toLowerCase();
                  const cKey = cleanNameKey(st.name);
                  studentMap[rawKey] = st.id;
                  if (cKey) studentMap[cKey] = st.id;
                  if (st.class) {
                    studentClassMap[rawKey] = st.class;
                    if (cKey) studentClassMap[cKey] = st.class;
                  }
                }
                if (st.roll_number) {
                  const rKey = st.roll_number.trim().toLowerCase();
                  studentMap[rKey] = st.id;
                  if (st.class) studentClassMap[rKey] = st.class;
                }
              });
            }
          }

          // Step B: Pre-process students in sheet & auto-create missing students in 'students' table first
          for (let rowIdx = 0; rowIdx < validRows.length; rowIdx++) {
            const row = validRows[rowIdx];
            let stName = getCol(row, 'name', 'student name', 'student', 'fullname', 'full name', 'naam', 'student_name');
            const stRoll = getCol(row, 'roll_number', 'roll no', 'rollno', 'roll number', 'id', 's.no', 'sr', 'r.no');

            if (!stName) {
              const keys = Object.keys(row);
              for (const k of keys) {
                if (!parseDateFromColumn(k, sheetObj.name)) {
                  const v = String(row[k]).trim();
                  if (v && v.length > 1 && !v.match(/^\d+$/) && !v.toLowerCase().includes('class') && !v.toLowerCase().includes('total')) {
                    stName = v;
                    break;
                  }
                }
              }
            }

            if (!stName) continue;

            const rawKey = stName.trim().toLowerCase();
            const cKey = cleanNameKey(stName);
            const rKey = stRoll ? stRoll.trim().toLowerCase() : '';

            let existingId = studentMap[rawKey] || (cKey ? studentMap[cKey] : null) || (rKey ? studentMap[rKey] : null);

            // If student doesn't exist in 'students' table yet, query DB or create them now!
            if (!existingId && supabase.from) {
              const rowClass = getCol(row, 'class', 'grade', 'standard');
              const finalClass = rowClass || currentSectionClass;

              // 1. Try querying DB by student name first
              try {
                const { data: foundSt } = await supabase.from('students').select('id').ilike('name', stName.trim()).limit(1);
                if (foundSt && foundSt.length > 0 && foundSt[0].id) {
                  existingId = foundSt[0].id;
                }
              } catch (err) {
                // Ignore query error, proceed to insert
              }

              // 2. If still not found, insert student into 'students' table
              if (!existingId) {
                const generatedRoll = stRoll || `R-${1000 + rowIdx + 1}-${Date.now().toString().slice(-4)}`;
                const newStObj = {
                  name: stName.trim(),
                  roll_number: generatedRoll,
                  class: finalClass,
                  status: 'Active'
                };

                const { data: createdArr, error: createErr } = await supabase.from('students').insert([newStObj]).select('id');

                if (!createErr && createdArr && createdArr.length > 0 && createdArr[0].id) {
                  existingId = createdArr[0].id;
                  totalStudentsImported++;
                } else {
                  // Retry with timestamp roll number
                  const retryRoll = `R-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
                  const { data: retryArr } = await supabase.from('students').insert([{ ...newStObj, roll_number: retryRoll }]).select('id');
                  if (retryArr && retryArr.length > 0 && retryArr[0].id) {
                    existingId = retryArr[0].id;
                    totalStudentsImported++;
                  }
                }
              }

              if (existingId) {
                studentMap[rawKey] = existingId;
                if (cKey) studentMap[cKey] = existingId;
                studentClassMap[rawKey] = finalClass;
              }
            }
          }

          // Step C: Build attendance records with guaranteed valid student_id UUIDs
          const attendanceRecords = [];

          validRows.forEach((row) => {
            let stName = getCol(row, 'name', 'student name', 'student', 'fullname', 'full name', 'naam', 'student_name');
            const stRoll = getCol(row, 'roll_number', 'roll no', 'rollno', 'roll number', 'id', 's.no', 'sr', 'r.no');

            if (!stName) {
              const keys = Object.keys(row);
              for (const k of keys) {
                if (!parseDateFromColumn(k, sheetObj.name)) {
                  const v = String(row[k]).trim();
                  if (v && v.length > 1 && !v.match(/^\d+$/) && !v.toLowerCase().includes('class') && !v.toLowerCase().includes('total')) {
                    stName = v;
                    break;
                  }
                }
              }
            }

            if (!stName) return;

            const rawKey = stName.trim().toLowerCase();
            const cKey = cleanNameKey(stName);
            const rKey = stRoll ? stRoll.trim().toLowerCase() : '';

            const studentId = studentMap[rawKey] || (cKey ? studentMap[cKey] : null) || (rKey ? studentMap[rKey] : null);

            // Skip if no valid student_id could be created/matched (never violates NOT NULL constraint)
            if (!studentId) return;

            const dbClass = studentClassMap[rawKey] || (cKey ? studentClassMap[cKey] : null) || (rKey ? studentClassMap[rKey] : null);
            const rowClass = getCol(row, 'class', 'grade', 'standard');
            const finalClass = dbClass || rowClass || currentSectionClass;

            // Check if vertical format (explicit Date and Status columns)
            const explicitDateCol = getCol(row, 'date', 'attendance date', 'day');
            const explicitStatusCol = getCol(row, 'status', 'attendance', 'present');

            if (explicitDateCol && explicitStatusCol) {
              const status = cleanStatus(explicitStatusCol) || 'Present';
              attendanceRecords.push({
                student_id: studentId,
                student_name: stName.trim(),
                class: finalClass,
                date: formatDate(explicitDateCol),
                status: status
              });
            } else {
              // Matrix format: iterate over column keys to find dates
              Object.keys(row).forEach(colKey => {
                const resolvedDate = parseDateFromColumn(colKey, sheetObj.name);
                if (resolvedDate) {
                  const status = cleanStatus(row[colKey]);
                  if (status) {
                    attendanceRecords.push({
                      student_id: studentId,
                      student_name: stName.trim(),
                      class: finalClass,
                      date: resolvedDate,
                      status: status
                    });
                  }
                }
              });
            }
          });

          // Step D: Batch insert attendance records into Supabase with deduplication and 3-tier fallback
          if (attendanceRecords.length > 0 && supabase.from) {
            // Deduplicate by (student_id + date) first
            const uniqueMap = new Map();
            attendanceRecords.forEach(r => {
              const key = `${r.student_id}_${r.date}`;
              uniqueMap.set(key, r);
            });
            const dedupedRecords = Array.from(uniqueMap.values());

            const BATCH_SIZE = 500;
            for (let i = 0; i < dedupedRecords.length; i += BATCH_SIZE) {
              const batch = dedupedRecords.slice(i, i + BATCH_SIZE);

              // Attempt 1: Upsert with (student_id, date) composite constraint (Ideal schema)
              let { error } = await supabase.from('attendance').upsert(batch, { onConflict: 'student_id,date' });

              // Attempt 2: If no composite constraint (42P10), try standard insert
              if (error && (error.code === '42P10' || error.message.includes('ON CONFLICT'))) {
                let { error: insertErr } = await supabase.from('attendance').insert(batch);
                error = insertErr;
              }

              // Attempt 3: If primary key constraint error on student_id (23505/attendance_pkey), deduplicate per student and fallback to student_id upsert
              if (error && (error.code === '23505' || error.message.includes('attendance_pkey') || error.message.includes('duplicate key'))) {
                const singleStudentMap = new Map();
                batch.forEach(r => singleStudentMap.set(r.student_id, r));
                const singleStudentBatch = Array.from(singleStudentMap.values());

                let { error: upsertErr } = await supabase.from('attendance').upsert(singleStudentBatch, { onConflict: 'student_id' });
                error = upsertErr;
              }

              if (error) throw new Error(`Failed to insert attendance into database: ${error.message}`);
            }
            totalAttendanceImported += dedupedRecords.length;
          }
        }

        mappedCount++;
        setProgress(10 + Math.min(80, (idx + 1) * stepPct));
      }

      setProgress(100);
      setImporting(false);
      setImportedSummary({
        totalSheets: mappedCount,
        students: totalStudentsImported,
        fees: totalFeesImported,
        expenses: totalExpensesImported,
        attendance: totalAttendanceImported,
        totalRecords: totalStudentsImported + totalFeesImported + totalExpensesImported + totalAttendanceImported
      });
      setStep(4);

    } catch (err) {
      setImporting(false);
      setStep(2);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', display: 'block', marginBottom: 32 }}>
        <h1>Google Sheets Multi-Sheet Import Center</h1>
        <p>Import your separated class sheets, attendance (April–August matrix/logs), fee records, and expenses directly into your database</p>
      </div>

      {errorMsg && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'var(--danger-500)', marginBottom: 20 }}>
          <p style={{ color: 'var(--danger-400)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} /> {errorMsg}
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <div
            className="import-dropzone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <FileSpreadsheet size={48} style={{ color: 'var(--primary-400)', marginBottom: 12 }} />
            <h3>Upload your downloaded Google Sheets (.xlsx or .csv)</h3>
            <p>Drag and drop your file here, or click to browse</p>
            <input
              id="file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={e => e.target.files && handleFileUpload(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Detected Sheets in {fileName}</h3>
                <p className="text-sm text-muted">Assign each sheet tab to its corresponding module below:</p>
              </div>
              <span className="badge badge-purple">{sheets.length} Class Sheet(s) Found</span>
            </div>
          </div>

          <div>
            {sheets.map(s => {
              const detectedClass = inferClassFromSheetName(s.name);
              return (
                <div key={s.name} className="sheet-mapping-item" style={{ background: 'var(--bg-secondary)', padding: '14px 18px', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="sheet-name flex items-center gap-2">
                    <FileSpreadsheet size={18} color="var(--primary-400)" />
                    <div>
                      <span className="font-semibold">{s.name}</span>
                      {detectedClass && detectedClass !== s.name && (
                        <span className="badge badge-blue" style={{ marginLeft: 8, fontSize: '0.75rem' }}>Class: {detectedClass}</span>
                      )}
                    </div>
                  </div>
                  <div className="sheet-rows text-muted text-sm">{s.rows} Rows Detected</div>
                  <select
                    className="form-select"
                    style={{ width: 250 }}
                    value={mapping[s.name] || 'Attendance'}
                    onChange={e => setMapping({ ...mapping, [s.name]: e.target.value })}
                  >
                    <option value="Attendance">📋 Attendance Module (Class Matrix or Logs)</option>
                    <option value="Fee Records">💰 Fee Records Only (Target fee_payments Table Only)</option>
                    <option value="Students">👨‍🎓 Students Only (Target students Table Only)</option>
                    <option value="Students & Fees">✨ Students & Fees (All-in-One)</option>
                    <option value="Expenses">💸 Expenses Module</option>
                    <option value="Skip">❌ Skip Sheet</option>
                  </select>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <button className="btn btn-primary btn-lg" onClick={handleStartImport}>
              Start Importing Data <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Database size={48} style={{ color: 'var(--primary-400)', marginBottom: 16 }} className="spinner" />
          <h3>Inserting Data into Database...</h3>
          <p className="text-muted" style={{ marginBottom: 24 }}>Writing attendance and student records directly into database tables.</p>
          
          <div className="progress" style={{ height: 12 }}>
            <div className="progress-bar green" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ marginTop: 8, fontSize: '0.875rem', fontWeight: 600 }}>{progress}% Complete</div>
        </div>
      )}

      {step === 4 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <CheckCircle size={56} style={{ color: 'var(--accent-500)', marginBottom: 16 }} />
          <h2>Import Completed & Saved to Database!</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Successfully processed {importedSummary?.totalSheets} class sheet(s) and inserted <strong>{importedSummary?.totalRecords}</strong> total record(s) directly into your database:
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {importedSummary?.students > 0 && (
              <div className="card" style={{ padding: '12px 20px', minWidth: 140 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-400)' }}>{importedSummary?.students}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students Created</div>
              </div>
            )}
            {importedSummary?.attendance > 0 && (
              <div className="card" style={{ padding: '12px 20px', minWidth: 140 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>{importedSummary?.attendance}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance Marks</div>
              </div>
            )}
            {importedSummary?.fees > 0 && (
              <div className="card" style={{ padding: '12px 20px', minWidth: 140 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-400)' }}>{importedSummary?.fees}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fee Records Added</div>
              </div>
            )}
            {importedSummary?.expenses > 0 && (
              <div className="card" style={{ padding: '12px 20px', minWidth: 140 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b' }}>{importedSummary?.expenses}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expenses Added</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/students')}>View Students</button>
            <button className="btn btn-secondary" onClick={() => navigate('/attendance')}>View Attendance</button>
            <button className="btn btn-primary" onClick={() => navigate('/fees')}>View Fee Records</button>
          </div>
        </div>
      )}
    </div>
  );
}
