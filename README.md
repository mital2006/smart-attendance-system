# Smart Attendance System

A modern, responsive, and professional web dashboard for managing student attendance, featuring an integrated **Software Error Consultation Report** and interactive diagnostic sandbox.

---

## 📋 Features

1. **Student Enrollment**:
   - Add student full names and unique roll numbers.
   - Real-time validation preventing duplicate roll numbers or blank inputs.

2. **Attendance Tracking**:
   - Mark individual students as **Present** or **Absent** with instant toggle buttons.
   - Bulk action buttons: **Mark All Present** and **Mark All Absent**.
   - Student removal action with confirmation.

3. **Live Metrics & Visual Dashboard**:
   - **Total Enrolled Students** metric card.
   - **Present Students** counter.
   - **Absent Students** counter.
   - **Attendance Percentage** indicator with dynamic progress bar.
   - Safe client-side computation: gracefully handles 0 students without division by zero.

4. **Attendance Report & Breakdown**:
   - Summary statistics (total registered, present, absent, percentage, standing badge).
   - Dynamic proportional breakdown bar with percentage tooltips.
   - Export report directly to **CSV** (`smart_attendance_report_<date>.csv`).
   - LocalStorage auto-save so records persist across browser reloads.

5. **Project Consultation Section (Intentional Bug Analysis)**:
   - **Status**: Error Detected
   - **Priority**: High
   - **Error Message**: `ZeroDivisionError: division by zero`
   - **Cause**: Total classes or student roster is zero. The calculation divides by total without checking if `total > 0`.
   - **Buggy Implementation (Python)**:
     ```python
     def attendance_percentage(present, total):
         return (present / total) * 100
     ```
   - **Suggested Fix (Python)**:
     ```python
     def attendance_percentage(present, total):
         if total <= 0:
             return 0.0
         return round((present / total) * 100, 2)
     ```
   - **Interactive Reproduction Sandbox**: Live test terminal within the webpage to simulate both the Python crash (`ZeroDivisionError`) when `total = 0` and the verified safe patched execution.

6. **Design**:
   - Clean blue-and-white enterprise dashboard aesthetic.
   - Fully responsive layout for desktop, tablet, and mobile devices.

---

## 🚀 How to Run Locally

You can run this application without installing any dependencies.

### Option 1: Direct Browser Launch (Simplest)
1. Navigate to the project directory:
   ```
   C:\Users\mital\.gemini\antigravity\scratch\smart-attendance-system
   ```
2. Double-click **`index.html`** or right-click and choose **Open with** &rarr; **Google Chrome**, **Microsoft Edge**, or **Firefox**.

### Option 2: Launch via PowerShell
In PowerShell:
```powershell
Start-Process "C:\Users\mital\.gemini\antigravity\scratch\smart-attendance-system\index.html"
```

### Option 3: Using VS Code Live Server
1. Open folder `smart-attendance-system` in VS Code.
2. Right click `index.html` and click **"Open with Live Server"**.

### Option 4: Using Python HTTP Server (if Python is installed)
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

### Option 5: Using Node.js (if Node is installed)
```bash
npx serve
```

---

## 📁 Project Structure

```
smart-attendance-system/
│
├── index.html       # HTML5 Semantic structure, dashboard layouts, consultation card
├── style.css        # Professional blue-and-white theme, responsive grid/flexbox
├── script.js        # State management, safe calculation, local storage, simulator
└── README.md        # Documentation and running instructions
```

---

## 🔍 Software Error Consultation Summary

| Attribute | Value |
|-----------|-------|
| **Module** | `analytics/attendance_calc.py` |
| **Status** | **Error Detected** |
| **Priority** | **High** |
| **Error Message** | `ZeroDivisionError: division by zero` |
| **Root Cause** | Total classes / students equal zero. The routine performs `present / total` without a prerequisite boundary check. |
| **Remediation** | Validate whether `total > 0`. If `total <= 0`, return `0.0`. |
