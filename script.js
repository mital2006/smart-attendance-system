/**
 * Smart Attendance System
 * Core Application Logic & Software Error Consultation Sandbox
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Initial State & Data Persistence
  // ==========================================
  const STORAGE_KEY = 'smart_attendance_roster_v1';

  const defaultStudents = [
    { id: 'std-1', roll: 'CS-101', name: 'Alex Morgan', status: 'Present', updatedAt: new Date().toLocaleTimeString() },
    { id: 'std-2', roll: 'CS-102', name: 'Beatrix Vance', status: 'Present', updatedAt: new Date().toLocaleTimeString() },
    { id: 'std-3', roll: 'CS-103', name: 'Charles Darwin', status: 'Absent', updatedAt: new Date().toLocaleTimeString() },
    { id: 'std-4', roll: 'CS-104', name: 'Diana Prince', status: 'Present', updatedAt: new Date().toLocaleTimeString() },
    { id: 'std-5', roll: 'CS-105', name: 'Ethan Hunt', status: 'Absent', updatedAt: new Date().toLocaleTimeString() },
    { id: 'std-6', roll: 'CS-106', name: 'Fiona Gallagher', status: 'Present', updatedAt: new Date().toLocaleTimeString() }
  ];

  let students = loadRoster();
  let currentFilter = 'all'; // 'all' | 'Present' | 'Absent'
  let searchQuery = '';

  function loadRoster() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults.', e);
    }
    return [...defaultStudents];
  }

  function saveRoster() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.warn('Could not save to localStorage.', e);
    }
  }

  // ==========================================
  // 2. DOM Elements Selection
  // ==========================================
  // Metric Card Elements
  const statTotal = document.getElementById('statTotalStudents');
  const statPresent = document.getElementById('statPresentStudents');
  const statAbsent = document.getElementById('statAbsentStudents');
  const statPercentage = document.getElementById('statAttendancePercentage');
  const progressFill = document.getElementById('attendanceProgressFill');
  const statProgressNote = document.getElementById('statProgressNote');

  // Report Elements
  const reportTotalCount = document.getElementById('reportTotalCount');
  const reportPresentCount = document.getElementById('reportPresentCount');
  const reportAbsentCount = document.getElementById('reportAbsentCount');
  const reportPercentage = document.getElementById('reportPercentage');
  const reportStatusBadge = document.getElementById('reportStatusBadge');
  const stackedPresent = document.getElementById('stackedPresent');
  const stackedAbsent = document.getElementById('stackedAbsent');
  const legendPresentPct = document.getElementById('legendPresentPct');
  const legendAbsentPct = document.getElementById('legendAbsentPct');
  const reportTimestamp = document.getElementById('reportTimestamp');
  const currentDateDisplay = document.getElementById('currentDateDisplay');

  // Form Elements
  const addStudentForm = document.getElementById('addStudentForm');
  const studentNameInput = document.getElementById('studentName');
  const rollNumberInput = document.getElementById('rollNumber');
  const initialStatusSelect = document.getElementById('initialStatus');
  const nameError = document.getElementById('nameError');
  const rollError = document.getElementById('rollError');
  const resetSampleDataBtn = document.getElementById('resetSampleDataBtn');

  // Table & Toolbar Elements
  const studentTableBody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterAll = document.getElementById('filterAll');
  const filterPresent = document.getElementById('filterPresent');
  const filterAbsent = document.getElementById('filterAbsent');
  const countAll = document.getElementById('countAll');
  const countPresent = document.getElementById('countPresent');
  const countAbsent = document.getElementById('countAbsent');

  const markAllPresentBtn = document.getElementById('markAllPresentBtn');
  const markAllAbsentBtn = document.getElementById('markAllAbsentBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Consultation Simulator Elements
  const simPresentInput = document.getElementById('simPresentInput');
  const simTotalInput = document.getElementById('simTotalInput');
  const runBuggySimBtn = document.getElementById('runBuggySimBtn');
  const runFixedSimBtn = document.getElementById('runFixedSimBtn');
  const setZeroScenarioBtn = document.getElementById('setZeroScenarioBtn');
  const simTerminalOutput = document.getElementById('simTerminalOutput');

  // Top Nav Date
  function initDateBadge() {
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    if (currentDateDisplay) {
      currentDateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }
    if (reportTimestamp) {
      reportTimestamp.textContent = today.toLocaleDateString('en-US', options) + ' ' + today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  // ==========================================
  // 3. Attendance Calculation (Safe Implementation)
  // ==========================================
  /**
   * Calculates attendance percentage.
   * Production-safe implementation guarding against ZeroDivisionError.
   * When total is 0, returns 0.0 instead of dividing by zero (which would yield NaN in JS or crash in Python).
   */
  function calculateSafeAttendancePercentage(present, total) {
    if (total <= 0) {
      return 0.0;
    }
    return Number(((present / total) * 100).toFixed(2));
  }

  // ==========================================
  // 4. Render & UI Update Cycle
  // ==========================================
  function updateMetricsAndReport() {
    const total = students.length;
    const presentCount = students.filter(s => s.status === 'Present').length;
    const absentCount = students.filter(s => s.status === 'Absent').length;

    // Use Safe Calculation
    const percentage = calculateSafeAttendancePercentage(presentCount, total);

    // Update Quick Metric Cards
    statTotal.textContent = total;
    statPresent.textContent = presentCount;
    statAbsent.textContent = absentCount;
    statPercentage.textContent = `${percentage}%`;
    progressFill.style.width = `${Math.min(percentage, 100)}%`;

    if (total === 0) {
      statProgressNote.textContent = 'Safe: 0 students enrolled (no 0-division error)';
      statProgressNote.style.color = 'var(--text-muted)';
    } else {
      statProgressNote.textContent = `${presentCount} of ${total} students present today`;
      statProgressNote.style.color = 'var(--primary-700)';
    }

    // Update Report Summary Section
    reportTotalCount.textContent = total;
    reportPresentCount.textContent = presentCount;
    reportAbsentCount.textContent = absentCount;
    reportPercentage.textContent = `${percentage}%`;

    // Status Badge Logic
    if (total === 0) {
      reportStatusBadge.textContent = 'No Data';
      reportStatusBadge.className = 'badge';
    } else if (percentage >= 75) {
      reportStatusBadge.textContent = 'Good Standing (≥75%)';
      reportStatusBadge.className = 'badge';
      reportStatusBadge.style.backgroundColor = 'var(--success-bg)';
      reportStatusBadge.style.color = 'var(--success-text)';
    } else if (percentage >= 50) {
      reportStatusBadge.textContent = 'Moderate (50-74%)';
      reportStatusBadge.className = 'badge';
      reportStatusBadge.style.backgroundColor = 'var(--warning-bg)';
      reportStatusBadge.style.color = 'var(--warning-text)';
    } else {
      reportStatusBadge.textContent = 'Critical Alert (<50%)';
      reportStatusBadge.className = 'badge';
      reportStatusBadge.style.backgroundColor = 'var(--danger-bg)';
      reportStatusBadge.style.color = 'var(--danger-text)';
    }

    // Visual Stacked Bar
    const presentBarPct = total > 0 ? (presentCount / total) * 100 : 0;
    const absentBarPct = total > 0 ? (absentCount / total) * 100 : 0;

    stackedPresent.style.width = `${presentBarPct}%`;
    stackedPresent.textContent = presentBarPct > 10 ? `${Math.round(presentBarPct)}%` : '';
    stackedAbsent.style.width = `${absentBarPct}%`;
    stackedAbsent.textContent = absentBarPct > 10 ? `${Math.round(absentBarPct)}%` : '';

    legendPresentPct.textContent = `${percentage}%`;
    const absentPercentage = calculateSafeAttendancePercentage(absentCount, total);
    legendAbsentPct.textContent = `${absentPercentage}%`;

    // Filter counts
    countAll.textContent = total;
    countPresent.textContent = presentCount;
    countAbsent.textContent = absentCount;
  }

  function renderStudentsTable() {
    // Filter and search
    const filtered = students.filter(student => {
      const matchesFilter = (currentFilter === 'all') || (student.status === currentFilter);
      const matchesSearch = student.name.toLowerCase().includes(searchQuery) ||
                            student.roll.toLowerCase().includes(searchQuery);
      return matchesFilter && matchesSearch;
    });

    studentTableBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';

      filtered.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.dataset.id = student.id;

        const isPresent = student.status === 'Present';

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td><span class="student-roll-badge">${escapeHtml(student.roll)}</span></td>
          <td>
            <div class="student-row-name">${escapeHtml(student.name)}</div>
            <small class="text-muted">Updated: ${student.updatedAt || 'Recently'}</small>
          </td>
          <td>
            <span class="status-badge ${isPresent ? 'status-present' : 'status-absent'}">
              ${student.status}
            </span>
          </td>
          <td class="text-center">
            <div class="mark-buttons-group">
              <button class="btn-toggle-present ${isPresent ? 'active-status' : ''}" data-action="mark-present" data-id="${student.id}" title="Mark as Present">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Present
              </button>
              <button class="btn-toggle-absent ${!isPresent ? 'active-status' : ''}" data-action="mark-absent" data-id="${student.id}" title="Mark as Absent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Absent
              </button>
            </div>
          </td>
          <td class="text-center">
            <button class="btn-delete-student" data-action="delete" data-id="${student.id}" title="Remove Student">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        `;

        studentTableBody.appendChild(tr);
      });
    }

    updateMetricsAndReport();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // 5. User Interaction & Event Handlers
  // ==========================================

  // Add Student Submission
  addStudentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    nameError.textContent = '';
    rollError.textContent = '';

    const name = studentNameInput.value.trim();
    const roll = rollNumberInput.value.trim().toUpperCase();
    const status = initialStatusSelect.value;

    let hasError = false;

    if (!name) {
      nameError.textContent = 'Please enter a student name.';
      hasError = true;
    }

    if (!roll) {
      rollError.textContent = 'Please enter a roll number.';
      hasError = true;
    } else {
      // Check for duplicate roll number
      const duplicate = students.some(s => s.roll.toUpperCase() === roll);
      if (duplicate) {
        rollError.textContent = `Roll number "${roll}" is already enrolled.`;
        hasError = true;
      }
    }

    if (hasError) return;

    // Create and append student
    const newStudent = {
      id: 'std-' + Date.now(),
      name,
      roll,
      status,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    students.unshift(newStudent);
    saveRoster();
    renderStudentsTable();

    // Reset Form
    studentNameInput.value = '';
    rollNumberInput.value = '';
    studentNameInput.focus();
  });

  // Reset Sample Roster Button
  resetSampleDataBtn.addEventListener('click', () => {
    if (confirm('Reset to the initial 6 sample students?')) {
      students = JSON.parse(JSON.stringify(defaultStudents));
      saveRoster();
      renderStudentsTable();
    }
  });

  // Table Event Delegation (Mark Present, Mark Absent, Delete)
  studentTableBody.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    if (!id || !action) return;

    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex === -1) return;

    if (action === 'mark-present') {
      students[studentIndex].status = 'Present';
      students[studentIndex].updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      saveRoster();
      renderStudentsTable();
    } else if (action === 'mark-absent') {
      students[studentIndex].status = 'Absent';
      students[studentIndex].updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      saveRoster();
      renderStudentsTable();
    } else if (action === 'delete') {
      const studentName = students[studentIndex].name;
      if (confirm(`Remove "${studentName}" from the roster?`)) {
        students.splice(studentIndex, 1);
        saveRoster();
        renderStudentsTable();
      }
    }
  });

  // Bulk Actions: Mark All Present
  markAllPresentBtn.addEventListener('click', () => {
    if (students.length === 0) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    students.forEach(s => {
      s.status = 'Present';
      s.updatedAt = timestamp;
    });
    saveRoster();
    renderStudentsTable();
  });

  // Bulk Actions: Mark All Absent
  markAllAbsentBtn.addEventListener('click', () => {
    if (students.length === 0) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    students.forEach(s => {
      s.status = 'Absent';
      s.updatedAt = timestamp;
    });
    saveRoster();
    renderStudentsTable();
  });

  // Search Filter
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderStudentsTable();
  });

  // Filter Pills (All / Present / Absent)
  const pills = [filterAll, filterPresent, filterAbsent];
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderStudentsTable();
    });
  });

  // Export CSV Feature
  exportCsvBtn.addEventListener('click', () => {
    if (students.length === 0) {
      alert('Roster is empty. Nothing to export.');
      return;
    }

    const headers = ['Roll Number', 'Student Name', 'Status', 'Last Updated'];
    const rows = students.map(s => [
      `"${s.roll}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.updatedAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `smart_attendance_report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ==========================================
  // 6. Project Consultation Interactive Sandbox
  // ==========================================

  function logToTerminal(lines, type = 'info') {
    const formatted = lines.map(line => {
      let className = 'term-line-info';
      if (type === 'error') className = 'term-line-error';
      else if (type === 'success') className = 'term-line-success';
      else if (type === 'warn') className = 'term-line-warn';

      return `<div class="${className}">${escapeHtml(line)}</div>`;
    }).join('');

    simTerminalOutput.innerHTML = formatted;
  }

  // Buggy Code Simulation: Replicates Python ZeroDivisionError
  runBuggySimBtn.addEventListener('click', () => {
    const present = parseInt(simPresentInput.value, 10) || 0;
    const total = parseInt(simTotalInput.value, 10);

    // If total is 0 or NaN (simulating total = 0)
    if (total === 0 || isNaN(total)) {
      const errorOutput = [
        `>>> Executing buggy attendance_percentage(present=${present}, total=${total}) ...`,
        `Traceback (most recent call last):`,
        `  File "analytics/attendance_calc.py", line 2, in attendance_percentage`,
        `    return (present / total) * 100`,
        `ZeroDivisionError: division by zero`,
        ``,
        `[CONSULTATION ALERT]`,
        `Status: Error Detected`,
        `Priority: High`,
        `Root Cause: Total classes or student roster is 0 without zero-check guard.`,
        `Remediation: Apply guard condition 'if total <= 0: return 0.0'`
      ];
      logToTerminal(errorOutput, 'error');
    } else {
      const result = ((present / total) * 100).toFixed(2);
      const output = [
        `>>> Executing buggy attendance_percentage(present=${present}, total=${total}) ...`,
        `Calculation: (${present} / ${total}) * 100`,
        `Result: ${result}%`,
        ``,
        `[NOTE] Code completed without exception because total (${total}) > 0.`,
        `However, the function remains vulnerable to crash whenever total == 0.`
      ];
      logToTerminal(output, 'warn');
    }
  });

  // Fixed Code Simulation: Replicates Defensive Python Check
  runFixedSimBtn.addEventListener('click', () => {
    const present = parseInt(simPresentInput.value, 10) || 0;
    const total = parseInt(simTotalInput.value, 10) || 0;

    let result = 0.0;
    let guardTriggered = false;

    if (total <= 0) {
      result = 0.0;
      guardTriggered = true;
    } else {
      result = Number(((present / total) * 100).toFixed(2));
    }

    const output = [
      `>>> Executing patched attendance_percentage(present=${present}, total=${total}) ...`,
      guardTriggered 
        ? `[GUARD TRIGGERED] Condition (total <= 0) met. Returning default 0.0% safely.`
        : `[CALCULATION] Valid total (${total}). Returning ${result}%.`,
      `Final Output: ${result}%`,
      ``,
      `[SUCCESS] ZeroDivisionError completely mitigated!`,
      `Runtime stability verified across edge conditions.`
    ];

    logToTerminal(output, 'success');
  });

  // Quick Zero Scenario Button
  setZeroScenarioBtn.addEventListener('click', () => {
    simPresentInput.value = 0;
    simTotalInput.value = 0;
    logToTerminal([
      `> Scenario preset loaded: present = 0, total = 0.`,
      `Click "Simulate Buggy Code" to reproduce ZeroDivisionError,`,
      `or click "Execute Patched Code" to verify the suggested fix.`
    ], 'info');
  });

  // ==========================================
  // 7. Nav Links & Smooth Transitions
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Theme / Compact Mode Toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  let isCompact = false;
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      isCompact = !isCompact;
      document.body.classList.toggle('compact-view', isCompact);
      themeToggleBtn.title = isCompact ? 'Normal View' : 'Compact View';
    });
  }

  // Initial Run
  initDateBadge();
  renderStudentsTable();
});
