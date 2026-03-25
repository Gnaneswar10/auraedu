import { getCurrentUser, getUserProfile, signOut } from './lib/supabase.js';
import { studentsAPI, attendanceAPI, feeAPI, dashboardAPI, notificationsAPI, announcementsAPI } from './lib/api.js';

let currentUser = null;
let userProfile = null;
let attendanceChanges = new Map();

async function init() {
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      window.location.href = '/auth.html';
      return;
    }

    userProfile = await getUserProfile();
    if (!userProfile) {
      console.error('No profile found');
      window.location.href = '/auth.html';
      return;
    }

    updateUserDisplay();
    await loadDashboardData();
    setupEventListeners();
    setupNavigation();

  } catch (error) {
    console.error('Init error:', error);
    showToast('Error loading dashboard. Please try refreshing.', true);
  }
}

function updateUserDisplay() {
  const nameEl = document.querySelector('.user-info .name');
  const roleEl = document.querySelector('.user-info .role');
  const avatarEl = document.querySelector('.avatar');

  if (nameEl) nameEl.textContent = userProfile.full_name || 'User';
  if (roleEl) roleEl.textContent = userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  if (avatarEl) avatarEl.textContent = userProfile.full_name?.charAt(0).toUpperCase() || 'U';
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', async () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const targetId = `view-${item.dataset.view}`;
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(targetId)?.classList.add('active');

      if (item.dataset.view === 'dashboard') await loadDashboardData();
      if (item.dataset.view === 'students') await loadStudents();
      if (item.dataset.view === 'attendance') await loadAttendance();
      if (item.dataset.view === 'fees') await loadFees();
      if (item.dataset.view === 'reports') await loadReports();
      if (item.dataset.view === 'announcements') await loadAnnouncements();
    });
  });

  window.switchView = function(viewName) {
    document.querySelector(`.nav-item[data-view="${viewName}"]`)?.click();
  };
}

function setupEventListeners() {
  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut();
        window.location.href = '/auth.html';
      } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', true);
      }
    });
  }

  const addStudentBtn = document.getElementById('btn-add-student');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => openStudentModal());
  }

  const closeModalBtn = document.getElementById('btn-close-modal');
  const cancelModalBtn = document.getElementById('btn-cancel-modal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeStudentModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeStudentModal);

  const studentForm = document.getElementById('student-form');
  if (studentForm) {
    studentForm.addEventListener('submit', handleStudentFormSubmit);
  }

  const saveAttendanceBtn = document.getElementById('btn-save-attendance');
  if (saveAttendanceBtn) {
    saveAttendanceBtn.addEventListener('click', handleSaveAttendance);
  }

  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  const exportReportBtn = document.getElementById('btn-export-report');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', handleExportReport);
  }

  const createAnnouncementBtn = document.getElementById('btn-create-announcement');
  if (createAnnouncementBtn) {
    createAnnouncementBtn.addEventListener('click', () => openAnnouncementModal());
  }

  const closeAnnouncementBtn = document.getElementById('btn-close-announcement-modal');
  const cancelAnnouncementBtn = document.getElementById('btn-cancel-announcement-modal');
  if (closeAnnouncementBtn) closeAnnouncementBtn.addEventListener('click', closeAnnouncementModal);
  if (cancelAnnouncementBtn) cancelAnnouncementBtn.addEventListener('click', closeAnnouncementModal);

  const announcementForm = document.getElementById('announcement-form');
  if (announcementForm) {
    announcementForm.addEventListener('submit', handleAnnouncementFormSubmit);
  }

  document.getElementById('attendance-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

async function loadDashboardData() {
  try {
    const stats = await dashboardAPI.getStats();

    document.getElementById('dash-total-students').textContent = stats.totalStudents;
    document.getElementById('dash-attendance').textContent = `${stats.attendance.percentage}%`;
    document.getElementById('dash-collected').textContent = `₹${formatNumber(stats.fees.collected)}`;
    document.getElementById('dash-pending').textContent = `₹${formatNumber(stats.fees.pending)}`;

    const students = await studentsAPI.getAll();
    const recentStudents = students.slice(0, 5);
    renderRecentStudents(recentStudents);

    await loadNotifications();

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Error loading dashboard data', true);
  }
}

function renderRecentStudents(students) {
  const tbody = document.querySelector('#recent-students-table tbody');
  if (!tbody) return;

  tbody.innerHTML = students.map(s => `
    <tr>
      <td style="font-weight:600">${s.full_name}</td>
      <td>${s.grade}</td>
      <td>${s.roll_number}</td>
    </tr>
  `).join('');
}

async function loadStudents() {
  try {
    const students = await studentsAPI.getAll();
    renderStudentsTable(students);
  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Error loading students', true);
  }
}

function renderStudentsTable(students) {
  const tbody = document.querySelector('#students-table tbody');
  if (!tbody) return;

  tbody.innerHTML = students.map(s => `
    <tr>
      <td style="font-weight:600; color:var(--accent-cyan)">#${s.roll_number}</td>
      <td style="font-weight:600">${s.full_name}</td>
      <td>${s.grade}</td>
      <td>${s.emergency_contact}</td>
      <td>
        <button class="btn btn-sm btn-outline" style="padding:4px 8px; margin-right:8px" onclick="editStudent('${s.id}')">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" style="padding:4px 8px" onclick="deleteStudent('${s.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openStudentModal(studentId = null) {
  const modal = document.getElementById('student-modal');
  const form = document.getElementById('student-form');
  const title = document.getElementById('modal-title');

  form.reset();
  document.getElementById('student-id').value = '';

  if (studentId) {
    title.textContent = 'Edit Student';
    loadStudentData(studentId);
  } else {
    title.textContent = 'Add New Student';
  }

  modal.classList.add('open');
}

async function loadStudentData(studentId) {
  try {
    const student = await studentsAPI.getById(studentId);
    if (student) {
      document.getElementById('student-id').value = student.id;
      document.getElementById('student-name').value = student.full_name;
      document.getElementById('student-roll').value = student.roll_number;
      document.getElementById('student-grade').value = student.grade;
      document.getElementById('student-contact').value = student.emergency_contact;
    }
  } catch (error) {
    console.error('Error loading student:', error);
    showToast('Error loading student data', true);
  }
}

window.editStudent = function(id) {
  openStudentModal(id);
};

window.deleteStudent = async function(id) {
  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
    return;
  }

  try {
    await studentsAPI.delete(id);
    showToast('Student deleted successfully');
    await loadStudents();
  } catch (error) {
    console.error('Error deleting student:', error);
    showToast('Error deleting student', true);
  }
};

function closeStudentModal() {
  document.getElementById('student-modal').classList.remove('open');
}

async function handleStudentFormSubmit(e) {
  e.preventDefault();

  const studentId = document.getElementById('student-id').value;
  const studentData = {
    full_name: document.getElementById('student-name').value.trim(),
    roll_number: document.getElementById('student-roll').value.trim(),
    grade: document.getElementById('student-grade').value,
    emergency_contact: document.getElementById('student-contact').value.trim(),
    date_of_birth: '2010-01-01',
    gender: 'male',
    admission_date: new Date().toISOString().split('T')[0],
    address: 'Address',
    section: 'A',
    status: 'active'
  };

  try {
    if (studentId) {
      await studentsAPI.update(studentId, studentData);
      showToast('Student updated successfully');
    } else {
      const newStudent = await studentsAPI.create(studentData);
      showToast('Student added successfully');

      const feeAmount = parseFloat(document.getElementById('student-fee').value) || 45000;
      await feeAPI.createFeeRecord(newStudent.id, null, feeAmount);
    }

    closeStudentModal();
    await loadStudents();
    if (document.querySelector('.nav-item[data-view="dashboard"]').classList.contains('active')) {
      await loadDashboardData();
    }
  } catch (error) {
    console.error('Error saving student:', error);
    showToast(error.message || 'Error saving student', true);
  }
}

async function loadAttendance() {
  try {
    const students = await studentsAPI.getAll();
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await attendanceAPI.getByDate(today);

    const attendanceMap = new Map();
    todayAttendance.forEach(record => {
      attendanceMap.set(record.student_id, record.status);
    });

    renderAttendanceTable(students, attendanceMap);
  } catch (error) {
    console.error('Error loading attendance:', error);
    showToast('Error loading attendance', true);
  }
}

function renderAttendanceTable(students, attendanceMap) {
  const tbody = document.querySelector('#attendance-table tbody');
  if (!tbody) return;

  tbody.innerHTML = students.map(s => {
    const status = attendanceMap.get(s.id) || 'absent';
    const isPresent = status === 'present';
    const checked = isPresent ? 'checked' : '';

    return `
      <tr>
        <td style="color:var(--accent-cyan); font-weight:600">#${s.roll_number}</td>
        <td style="font-weight:600">${s.full_name}</td>
        <td>${s.grade}</td>
        <td>
          <div style="display:flex; align-items:center; gap:12px">
            <label class="switch">
              <input type="checkbox" ${checked} data-student-id="${s.id}" onchange="toggleAttendance('${s.id}', this)">
              <span class="slider"></span>
            </label>
            <span id="att-text-${s.id}" style="font-size:0.8rem; font-weight:600; color: ${isPresent ? 'var(--green)' : 'var(--red)'}">
              ${isPresent ? 'Present' : 'Absent'}
            </span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleAttendance = function(studentId, checkbox) {
  const isChecked = checkbox.checked;
  const status = isChecked ? 'present' : 'absent';
  const textEl = document.getElementById(`att-text-${studentId}`);

  if (textEl) {
    textEl.textContent = isChecked ? 'Present' : 'Absent';
    textEl.style.color = isChecked ? 'var(--green)' : 'var(--red)';
  }

  attendanceChanges.set(studentId, status);
};

async function handleSaveAttendance() {
  if (attendanceChanges.size === 0) {
    showToast('No attendance changes to save', false);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const btn = document.getElementById('btn-save-attendance');
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const promises = Array.from(attendanceChanges.entries()).map(([studentId, status]) =>
      attendanceAPI.mark(studentId, today, status, null, currentUser.id)
    );

    await Promise.all(promises);
    attendanceChanges.clear();
    showToast(`Attendance saved for ${promises.length} students`);
    await loadDashboardData();
  } catch (error) {
    console.error('Error saving attendance:', error);
    showToast('Error saving attendance', true);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function loadFees() {
  try {
    const feeRecords = await feeAPI.getAllRecords();
    renderFeesTable(feeRecords);
  } catch (error) {
    console.error('Error loading fees:', error);
    showToast('Error loading fee records', true);
  }
}

function renderFeesTable(feeRecords) {
  const tbody = document.querySelector('#fees-table tbody');
  if (!tbody) return;

  tbody.innerHTML = feeRecords.map(record => {
    const total = parseFloat(record.total_amount);
    const paid = parseFloat(record.paid_amount);
    const pending = parseFloat(record.pending_amount);

    let statusHTML = '';
    if (record.status === 'paid') {
      statusHTML = `<span class="status paid">Paid in Full</span>`;
    } else if (record.status === 'partial') {
      statusHTML = `<span class="status pending">Partial (₹${formatNumber(pending)} Pending)</span>`;
    } else {
      statusHTML = `<span class="status absent">Unpaid (₹${formatNumber(total)} Pending)</span>`;
    }

    return `
      <tr>
        <td style="color:var(--accent-cyan); font-weight:600">#${record.student.roll_number}</td>
        <td style="font-weight:600">${record.student.full_name}</td>
        <td>₹${formatNumber(total)}</td>
        <td>${statusHTML}</td>
        <td>
          ${pending > 0
            ? `<button class="btn btn-sm btn-outline" style="color:var(--green); border-color:var(--green)" onclick="collectFee('${record.id}', ${pending})">Collect Fee</button>`
            : `<button class="btn btn-sm" disabled style="opacity:0.5; background:var(--bg-card)">Cleared</button>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

window.collectFee = async function(feeRecordId, pendingAmount) {
  const result = prompt(`Enter amount to collect (Max: ₹${formatNumber(pendingAmount)}):`);
  if (result === null) return;

  const amount = parseFloat(result);
  if (isNaN(amount) || amount <= 0 || amount > pendingAmount) {
    showToast('Invalid amount entered', true);
    return;
  }

  try {
    await feeAPI.recordPayment(
      feeRecordId,
      amount,
      'cash',
      null,
      currentUser.id,
      'Payment collected'
    );

    showToast(`Payment of ₹${formatNumber(amount)} recorded successfully`);
    await loadFees();
    await loadDashboardData();
  } catch (error) {
    console.error('Error recording payment:', error);
    showToast('Error recording payment', true);
  }
};

async function loadNotifications() {
  try {
    const notifications = await notificationsAPI.getUnread(currentUser.id);
    const badge = document.querySelector('.icon-btn .badge');
    if (badge && notifications.length > 0) {
      badge.textContent = notifications.length;
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const activeView = document.querySelector('.view.active');

  if (!searchTerm) {
    const tables = activeView.querySelectorAll('.data-table tbody tr');
    tables.forEach(row => row.style.display = '');
    return;
  }

  const tables = activeView.querySelectorAll('.data-table tbody tr');
  tables.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.style.backgroundColor = isError ? 'var(--red)' : 'var(--green)';
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

async function loadReports() {
  try {
    const [students, attendanceStats, feeStats, feeRecords] = await Promise.all([
      studentsAPI.getAll(),
      attendanceAPI.getAttendanceStats(),
      feeAPI.getFeeStats(),
      feeAPI.getAllRecords()
    ]);

    document.getElementById('report-attendance-rate').textContent = `${attendanceStats.percentage}%`;
    document.getElementById('report-collection-rate').textContent = `${feeStats.collectionRate}%`;
    document.getElementById('report-active-students').textContent = students.filter(s => s.status === 'active').length;

    const defaulters = feeRecords.filter(r => r.status === 'pending' || r.status === 'partial').length;
    document.getElementById('report-defaulters').textContent = defaulters;

    document.getElementById('fee-expected').textContent = `₹${formatNumber(feeStats.expected)}`;
    document.getElementById('fee-collected').textContent = `₹${formatNumber(feeStats.collected)}`;
    document.getElementById('fee-pending').textContent = `₹${formatNumber(feeStats.pending)}`;

    const progressBar = document.getElementById('fee-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${feeStats.collectionRate}%`;
    }

    await loadGradeStats(students, feeRecords);

  } catch (error) {
    console.error('Error loading reports:', error);
    showToast('Error loading reports', true);
  }
}

async function loadGradeStats(students, feeRecords) {
  const gradeMap = new Map();

  students.forEach(s => {
    if (!gradeMap.has(s.grade)) {
      gradeMap.set(s.grade, {
        grade: s.grade,
        totalStudents: 0,
        attendanceCount: 0,
        feeCollected: 0,
        feeTotal: 0
      });
    }
    const stats = gradeMap.get(s.grade);
    stats.totalStudents++;
  });

  feeRecords.forEach(record => {
    const student = students.find(s => s.id === record.student_id);
    if (student && gradeMap.has(student.grade)) {
      const stats = gradeMap.get(student.grade);
      stats.feeCollected += parseFloat(record.paid_amount || 0);
      stats.feeTotal += parseFloat(record.total_amount || 0);
    }
  });

  const tbody = document.querySelector('#grade-stats-table tbody');
  if (!tbody) return;

  const gradeData = Array.from(gradeMap.values());
  tbody.innerHTML = gradeData.map(g => {
    const collectionRate = g.feeTotal > 0 ? Math.round((g.feeCollected / g.feeTotal) * 100) : 0;
    return `
      <tr>
        <td style="font-weight:600">${g.grade}</td>
        <td>${g.totalStudents}</td>
        <td>-</td>
        <td>${collectionRate}%</td>
      </tr>
    `;
  }).join('');
}

async function loadAnnouncements() {
  try {
    const announcements = await announcementsAPI.getActive();
    renderAnnouncements(announcements);
  } catch (error) {
    console.error('Error loading announcements:', error);
    showToast('Error loading announcements', true);
  }
}

function renderAnnouncements(announcements) {
  const container = document.getElementById('announcements-list');
  if (!container) return;

  if (announcements.length === 0) {
    container.innerHTML = `
      <div class="panel" style="text-align:center; padding:48px; color:var(--text-muted)">
        <div style="font-size:3rem; margin-bottom:16px">📢</div>
        <h3 style="margin-bottom:8px">No announcements yet</h3>
        <p>Create your first announcement to communicate with your school community</p>
      </div>
    `;
    return;
  }

  container.innerHTML = announcements.map(a => {
    const date = new Date(a.published_at).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    let typeClass = 'blue';
    let typeIcon = '📢';
    if (a.type === 'urgent') {
      typeClass = 'red';
      typeIcon = '⚠️';
    } else if (a.type === 'event') {
      typeClass = 'purple';
      typeIcon = '🎉';
    }

    return `
      <div class="panel">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px">
          <div style="display:flex; gap:16px; align-items:start">
            <div class="stat-icon ${typeClass}" style="width:48px; height:48px; font-size:1.2rem">
              ${typeIcon}
            </div>
            <div>
              <h3 style="font-family:var(--font-head); font-size:1.1rem; margin-bottom:4px">${a.title}</h3>
              <p style="font-size:0.85rem; color:var(--text-muted)">
                Published by ${a.publisher?.full_name || 'Admin'} on ${date}
              </p>
            </div>
          </div>
          <span class="status ${a.type === 'urgent' ? 'absent' : a.type === 'event' ? 'pending' : 'present'}" style="text-transform:capitalize">
            ${a.type}
          </span>
        </div>
        <p style="line-height:1.7; color:var(--text-main)">${a.content}</p>
        ${a.target_audience && a.target_audience.length > 0 ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border)">
            <span style="font-size:0.85rem; color:var(--text-muted)">
              Target: ${a.target_audience.join(', ')}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function openAnnouncementModal() {
  const modal = document.getElementById('announcement-modal');
  const form = document.getElementById('announcement-form');
  form.reset();
  modal.classList.add('open');
}

function closeAnnouncementModal() {
  document.getElementById('announcement-modal').classList.remove('open');
}

async function handleAnnouncementFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('announcement-title').value.trim();
  const content = document.getElementById('announcement-content').value.trim();
  const type = document.getElementById('announcement-type').value;
  const audienceSelect = document.getElementById('announcement-audience');
  const selectedAudience = Array.from(audienceSelect.selectedOptions).map(opt => opt.value);

  try {
    await announcementsAPI.create(
      title,
      content,
      type,
      selectedAudience,
      currentUser.id
    );

    showToast('Announcement published successfully');
    closeAnnouncementModal();
    await loadAnnouncements();
  } catch (error) {
    console.error('Error creating announcement:', error);
    showToast('Error publishing announcement', true);
  }
}

function handleExportReport() {
  showToast('Generating report... This feature will export data to CSV');

  setTimeout(async () => {
    try {
      const [students, feeRecords] = await Promise.all([
        studentsAPI.getAll(),
        feeAPI.getAllRecords()
      ]);

      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Roll Number,Name,Grade,Fee Status,Total Fee,Paid Amount,Pending Amount\n';

      feeRecords.forEach(record => {
        const student = students.find(s => s.id === record.student_id);
        if (student) {
          csvContent += `${student.roll_number},${student.full_name},${student.grade},${record.status},${record.total_amount},${record.paid_amount},${record.pending_amount}\n`;
        }
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `school_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      showToast('Error exporting report', true);
    }
  }, 500);
}

init();
