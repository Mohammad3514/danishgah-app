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
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          return { name, rows: json.length, rawData: json, sample: json.slice(0, 2) };
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
    const str = String(colKey).trim();
    if (!str) return null;

    const lower = str.toLowerCase();
    const nonDateKeys = ['name', 'student name', 'student', 'fullname', 'full name', 'roll', 'roll no', 'rollno', 'roll_number', 'roll number', 'id', 's.no', 'sr', 'class', 'grade', 'standard', 'father', 'father name', 'father\'s name', 'father_name', 'total', 'present', 'absent', 'leave', '%', 'percentage', 'remarks', 'status'];
    if (nonDateKeys.includes(lower)) return null;

    // Excel Serial Number (e.g. 45000)
    if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
      const num = Number(str);
      const date = new Date((num - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    // Standard YYYY-MM-DD
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;

    // Day number only like "1", "01", "31"
    if (str.match(/^\d{1,2}$/)) {
      const day = parseInt(str, 10);
      if (day >= 1 && day <= 31) {
        const { month, year } = inferMonthAndYear(sheetName);
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }
    }

    // Formats like "01-Apr", "1-Apr-2025", "Apr 1", "01/04/2025", "4/1/2025"
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      let y = parsed.getFullYear();
      if (y < 2000) {
        const { year } = inferMonthAndYear(sheetName);
        y = year;
        parsed.setFullYear(y);
      }
      return parsed.toISOString().split('T')[0];
    }

    // Regex for "01 Apr" or "Apr 01" or "01/04"
    const dmMatch = str.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3,9})$/) || str.match(/^([a-zA-Z]{3,9})[-/\s](\d{1,2})$/);
    if (dmMatch) {
      let day, mStr;
      if (!isNaN(Number(dmMatch[1]))) {
        day = parseInt(dmMatch[1], 10);
        mStr = dmMatch[2].toLowerCase();
      } else {
        mStr = dmMatch[1].toLowerCase();
        day = parseInt(dmMatch[2], 10);
      }
      const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
      if (mNum && day >= 1 && day <= 31) {
        const { year } = inferMonthAndYear(sheetName);
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
    if (!s || s === '-' || s === 'n/a' || s === 'null' || s === 'off' || s === 'sunday' || s === 'holiday') return null;

    if (['p', 'present', '1', 'true', 'yes', 'y', '✓', 'v', 'pr', 'pre'].includes(s) || s.startsWith('p')) {
      return 'Present';
    }
    if (['a', 'absent', '0', 'false', 'no', 'n', 'x', '✗', 'ab', 'abs'].includes(s) || s.startsWith('a')) {
      return 'Absent';
    }
    if (['l', 'leave', 'lev', 'lea', 'sl', 'cl'].includes(s) || s.startsWith('l')) {
      return 'Leave';
    }
    return null;
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

        // Filter out empty rows, header rows, or merged section title rows
        const validRows = raw.filter(r => {
          const stName = getCol(r, 'name', 'student name', 'fullname', 'full name', 'student');
          if (!stName) return false;
          const lower = stName.toLowerCase();
          if (lower.includes('name:') || lower.includes('father') || lower.startsWith('class') || lower.startsWith('roll')) return false;
          return stName.trim().length > 1;
        });

        const currentSectionClass = inferClassFromSheetName(sheetObj.name);

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

        // 4. Process Attendance (Supports separated Class tabs + Matrix & Daily Logs)
        if (moduleType === 'Attendance') {
          let studentMap = {};
          let studentClassMap = {};
          if (supabase.from) {
            const { data: existingStudents } = await supabase.from('students').select('id, name, roll_number, class');
            if (existingStudents) {
              existingStudents.forEach(st => {
                if (st.name) {
                  const nKey = st.name.trim().toLowerCase();
                  studentMap[nKey] = st.id;
                  if (st.class) studentClassMap[nKey] = st.class;
                }
                if (st.roll_number) {
                  const rKey = st.roll_number.trim().toLowerCase();
                  studentMap[rKey] = st.id;
                  if (st.class) studentClassMap[rKey] = st.class;
                }
              });
            }
          }

          const attendanceRecords = [];

          validRows.forEach(row => {
            const stName = getCol(row, 'name', 'student name', 'student', 'fullname', 'full name');
            if (!stName) return;
            const stRoll = getCol(row, 'roll_number', 'roll no', 'rollno', 'roll number', 'id', 's.no', 'sr');
            
            const nKey = stName.trim().toLowerCase();
            const rKey = stRoll ? stRoll.trim().toLowerCase() : '';

            // Priority: Database student class -> Row 'class' column -> Inferred sheet tab class
            const dbClass = studentClassMap[nKey] || (rKey ? studentClassMap[rKey] : null);
            const rowClass = getCol(row, 'class', 'grade', 'standard');
            const finalClass = dbClass || rowClass || currentSectionClass;

            const studentId = studentMap[nKey] || (rKey ? studentMap[rKey] : null) || null;

            // Check if vertical format (explicit Date and Status columns)
            const explicitDateCol = getCol(row, 'date', 'attendance date', 'day');
            const explicitStatusCol = getCol(row, 'status', 'attendance', 'present');

            if (explicitDateCol && explicitStatusCol) {
              const status = cleanStatus(explicitStatusCol) || 'Present';
              attendanceRecords.push({
                student_id: studentId,
                student_name: stName,
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
                      student_name: stName,
                      class: finalClass,
                      date: resolvedDate,
                      status: status
                    });
                  }
                }
              });
            }
          });

          if (attendanceRecords.length > 0 && supabase.from) {
            // Batch insert in chunks of 500
            const BATCH_SIZE = 500;
            for (let i = 0; i < attendanceRecords.length; i += BATCH_SIZE) {
              const batch = attendanceRecords.slice(i, i + BATCH_SIZE);
              const { error } = await supabase.from('attendance').insert(batch);
              if (error) throw new Error(`Failed to insert attendance into database: ${error.message}`);
            }
            totalAttendanceImported += attendanceRecords.length;
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
                  <div className="sheet-rows text-muted text-sm">{s.rows} Rows</div>
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
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students Added</div>
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
