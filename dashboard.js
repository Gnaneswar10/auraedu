/* ============================================================
   AuraEdu Admin Dashboard | dashboard.js
   ============================================================ */

// Initial Seed Data
const defaultStudents = [
  { id: 1, name: 'Aarav Sharma', roll: '101', grade: '10th Grade', parentContact: '9876543210', feeTotal: 45000, feePaid: 45000, isPresent: true },
  { id: 2, name: 'Diya Patel', roll: '102', grade: '9th Grade', parentContact: '9876543211', feeTotal: 40000, feePaid: 20000, isPresent: true },
  { id: 3, name: 'Rohan Gupta', roll: '103', grade: '8th Grade', parentContact: '9876543212', feeTotal: 35000, feePaid: 0, isPresent: false },
  { id: 4, name: 'Priya Singh', roll: '104', grade: '10th Grade', parentContact: '9876543213', feeTotal: 45000, feePaid: 45000, isPresent: true },
  { id: 5, name: 'Vivaan Reddy', roll: '105', grade: '9th Grade', parentContact: '9876543214', feeTotal: 40000, feePaid: 40000, isPresent: true }
];

// Initialize LocalStorage if empty
if (!localStorage.getItem('AuraEdu_students')) {
  localStorage.setItem('AuraEdu_students', JSON.stringify(defaultStudents));
}

let students = JSON.parse(localStorage.getItem('AuraEdu_students'));

function saveToLocalStorage() {
  localStorage.setItem('AuraEdu_students', JSON.stringify(students));
  updateDashboardStats();
}

/* ── View Navigation ────────────────────────────────────── */
const navItems = document.querySelectorAll('.nav-item[data-view]');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    // Update Active Nav
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    
    // Show View
    const targetId = `view-${item.dataset.view}`;
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    
    // Refresh Data Based on View
    if (item.dataset.view === 'dashboard') updateDashboardStats();
    if (item.dataset.view === 'students') renderStudentsTable();
    if (item.dataset.view === 'attendance') renderAttendanceTable();
    if (item.dataset.view === 'fees') renderFeesTable();
  });
});

// Helper function for html buttons
window.switchView = function(viewName) {
  document.querySelector(`.nav-item[data-view="${viewName}"]`).click();
};

document.getElementById('attendance-date').textContent = new Date().toDateString();

/* ── Toast Notification ─────────────────────────────────── */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.backgroundColor = isError ? 'var(--red)' : 'var(--green)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── DOM Elements ───────────────────────────────────────── */
const studentsTableBody = document.querySelector('#students-table tbody');
const attendanceTableBody = document.querySelector('#attendance-table tbody');
const feesTableBody = document.querySelector('#fees-table tbody');
const recentStudentsBody = document.querySelector('#recent-students-table tbody');

/* ── 1. Dashboard Stats ─────────────────────────────────── */
function updateDashboardStats() {
  const totalStudents = students.length;
  const presentCount = students.filter(s => s.isPresent).length;
  const attendancePct = totalStudents === 0 ? 0 : Math.round((presentCount / totalStudents) * 100);
  
  let totalCollected = 0;
  let totalPending = 0;
  students.forEach(s => {
    totalCollected += Number(s.feePaid);
    totalPending += (Number(s.feeTotal) - Number(s.feePaid));
  });

  document.getElementById('dash-total-students').textContent = totalStudents;
  document.getElementById('dash-attendance').textContent = `${attendancePct}%`;
  document.getElementById('dash-collected').textContent = `₹${totalCollected.toLocaleString()}`;
  document.getElementById('dash-pending').textContent = `₹${totalPending.toLocaleString()}`;

  // Populate Recent Admissions (last 3)
  recentStudentsBody.innerHTML = '';
  const recent = [...students].reverse().slice(0, 3);
  recent.forEach(s => {
    recentStudentsBody.innerHTML += `
      <tr>
        <td style="font-weight:600">${s.name}</td>
        <td>${s.grade}</td>
        <td>${s.roll}</td>
      </tr>
    `;
  });
}

/* ── 2. Students View (CRUD) ────────────────────────────── */
function renderStudentsTable() {
  studentsTableBody.innerHTML = '';
  students.forEach(student => {
    studentsTableBody.innerHTML += `
      <tr>
        <td style="font-weight:600; color:var(--accent-cyan)">#${student.roll}</td>
        <td style="font-weight:600">${student.name}</td>
        <td>${student.grade}</td>
        <td>${student.parentContact}</td>
        <td>
          <button class="btn btn-sm btn-outline" style="padding:4px 8px; margin-right:8px" onclick="editStudent(${student.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" style="padding:4px 8px" onclick="deleteStudent(${student.id})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// Modal Logic
const modal = document.getElementById('student-modal');
const form = document.getElementById('student-form');

document.getElementById('btn-add-student').addEventListener('click', () => {
  form.reset();
  document.getElementById('student-id').value = '';
  document.getElementById('modal-title').textContent = 'Add New Student';
  modal.classList.add('open');
});

document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('btn-cancel-modal').addEventListener('click', () => modal.classList.remove('open'));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const idValue = document.getElementById('student-id').value;
  const newStudent = {
    id: idValue ? parseInt(idValue) : Date.now(),
    name: document.getElementById('student-name').value,
    roll: document.getElementById('student-roll').value,
    grade: document.getElementById('student-grade').value,
    parentContact: document.getElementById('student-contact').value,
    feeTotal: document.getElementById('student-fee').value,
    feePaid: 0, // Defaults to 0 for new
    isPresent: true // Default
  };

  if (idValue) {
    // Edit existing
    const idx = students.findIndex(s => s.id === parseInt(idValue));
    // Keep existing fee paid and attendance status
    newStudent.feePaid = students[idx].feePaid;
    newStudent.isPresent = students[idx].isPresent;
    students[idx] = newStudent;
    showToast('Student Updated Successfully!');
  } else {
    // Add new
    students.push(newStudent);
    showToast('Student Added Successfully!');
  }

  saveToLocalStorage();
  renderStudentsTable();
  modal.classList.remove('open');
});

window.editStudent = function(id) {
  const student = students.find(s => s.id === id);
  document.getElementById('student-id').value = student.id;
  document.getElementById('student-name').value = student.name;
  document.getElementById('student-roll').value = student.roll;
  document.getElementById('student-grade').value = student.grade;
  document.getElementById('student-contact').value = student.parentContact;
  document.getElementById('student-fee').value = student.feeTotal;
  
  document.getElementById('modal-title').textContent = 'Edit Student';
  modal.classList.add('open');
};

window.deleteStudent = function(id) {
  if (confirm("Are you sure you want to delete this student?")) {
    students = students.filter(s => s.id !== id);
    saveToLocalStorage();
    renderStudentsTable();
    showToast('Student deleted.', false);
  }
};

/* ── 3. Attendance View ─────────────────────────────────── */
function renderAttendanceTable() {
  attendanceTableBody.innerHTML = '';
  students.forEach(student => {
    // Determine toggle state
    const isChecked = student.isPresent ? 'checked' : '';
    attendanceTableBody.innerHTML += `
      <tr>
        <td style="color:var(--accent-cyan); font-weight:600">#${student.roll}</td>
        <td style="font-weight:600">${student.name}</td>
        <td>${student.grade}</td>
        <td>
          <div style="display:flex; align-items:center; gap:12px">
            <label class="switch">
              <input type="checkbox" ${isChecked} onchange="toggleAttendance(${student.id}, this)">
              <span class="slider"></span>
            </label>
            <span id="att-text-${student.id}" style="font-size:0.8rem; font-weight:600; color: ${student.isPresent ? 'var(--green)' : 'var(--red)'}">
              ${student.isPresent ? 'Present' : 'Absent'}
            </span>
          </div>
        </td>
      </tr>
    `;
  });
}

window.toggleAttendance = function(id, checkboxWrapper) {
  const isChecked = checkboxWrapper.checked;
  const valText = document.getElementById(`att-text-${id}`);
  
  // Update UI immediately for snappiness
  if (isChecked) {
    valText.textContent = 'Present';
    valText.style.color = 'var(--green)';
  } else {
    valText.textContent = 'Absent';
    valText.style.color = 'var(--red)';
  }
  
  // Update state
  const student = students.find(s => s.id === id);
  student.isPresent = isChecked;
};

document.getElementById('btn-save-attendance').addEventListener('click', () => {
  saveToLocalStorage();
  showToast('Attendance saved securely. SMS alerts queued.');
});

/* ── 4. Fees View ───────────────────────────────────────── */
function renderFeesTable() {
  feesTableBody.innerHTML = '';
  students.forEach(student => {
    const total = Number(student.feeTotal);
    const paid = Number(student.feePaid);
    const pending = total - paid;
    
    let statusHTML = '';
    if (pending === 0) statusHTML = `<span class="status paid">Paid in Full</span>`;
    else if (paid > 0) statusHTML = `<span class="status pending">Partial (₹${pending} Pending)</span>`;
    else statusHTML = `<span class="status absent">Unpaid (₹${total} Pending)</span>`;

    feesTableBody.innerHTML += `
      <tr>
        <td style="color:var(--accent-cyan); font-weight:600">#${student.roll}</td>
        <td style="font-weight:600">${student.name}</td>
        <td>₹${total.toLocaleString()}</td>
        <td>${statusHTML}</td>
        <td>
          ${pending > 0 
            ? `<button class="btn btn-sm btn-outline" style="color:var(--green); border-color:var(--green)" onclick="collectFee(${student.id}, ${pending})">Collect Fee</button>` 
            : `<button class="btn btn-sm" disabled style="opacity:0.5; background:var(--bg-card)">Cleared</button>`
          }
        </td>
      </tr>
    `;
  });
}

window.collectFee = function(id, pendingAmount) {
  const result = prompt(`Enter amount to collect (Max: ₹${pendingAmount}):`);
  if (result !== null) {
    const amount = Number(result);
    if (!isNaN(amount) && amount > 0 && amount <= pendingAmount) {
      const student = students.find(s => s.id === id);
      student.feePaid += amount;
      saveToLocalStorage();
      renderFeesTable();
      showToast(`Collected ₹${amount} from ${student.name}`);
    } else {
      showToast('Invalid amount entered.', true);
    }
  }
};

// Initial Render
updateDashboardStats();

