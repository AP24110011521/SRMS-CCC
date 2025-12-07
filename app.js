// ===== STATE MANAGEMENT =====
let currentUser = null;
let currentRole = null;

// ===== UTILITY FUNCTIONS =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type} show`;
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function showError(elementId, message) {
    showMessage(elementId, message, 'error');
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);
    return await response.json();
}

// ===== ROLE SELECTION =====
document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
        const role = card.dataset.role;
        showLoginPage(role);
    });
});

function showLoginPage(role) {
    currentRole = role;

    const icons = {
        admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',
        teacher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>',
        student: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
        parent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>'
    };

    const labels = {
        admin: 'Admin ID',
        teacher: 'Teacher ID',
        student: 'Student ID',
        parent: 'Parent Phone'
    };

    document.getElementById('loginRoleIcon').innerHTML = icons[role];
    document.getElementById('loginRoleTitle').textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
    document.getElementById('userIdLabel').textContent = labels[role];

    showPage('loginPage');
}

// ===== BACK TO ROLES =====
document.getElementById('backToRoles').addEventListener('click', () => {
    showPage('roleSelection');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.remove('show');
});

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    const result = await apiCall('/api/login', 'POST', {
        role: currentRole,
        userId,
        password
    });

    if (result.success) {
        currentUser = result;

        switch (currentRole) {
            case 'admin':
                showAdminDashboard();
                break;
            case 'teacher':
                showTeacherDashboard();
                break;
            case 'student':
                showStudentDashboard();
                break;
            case 'parent':
                showParentDashboard();
                break;
        }
    } else {
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = result.message || 'Invalid credentials';
        errorEl.classList.add('show');
    }
});

// ===== ADMIN DASHBOARD =====
async function showAdminDashboard() {
    showPage('adminDashboard');
    loadStudentsList();
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const parent = btn.closest('.dashboard-content');
        parent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        parent.querySelector(`#${tabName}`).classList.add('active');

        if (tabName === 'viewStudents') {
            loadStudentsList();
        }
    });
});

// Add Student
document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/api/admin/add-student', 'POST', data);

    if (result.success) {
        showMessage('addStudentMessage', 'Student added successfully!', 'success');
        e.target.reset();
    } else {
        showError('addStudentMessage', result.message);
    }
});

// Add Teacher
document.getElementById('addTeacherForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/api/admin/add-teacher', 'POST', data);

    if (result.success) {
        showMessage('addTeacherMessage', 'Teacher added successfully!', 'success');
        e.target.reset();
    } else {
        showError('addTeacherMessage', result.message);
    }
});

// Load Students List
async function loadStudentsList() {
    const result = await apiCall('/api/admin/students');

    if (result.success) {
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';

        result.students.forEach(student => {
            const row = document.createElement('tr');

            const feeStatusClass = student.feeStatus === 'paid' ? 'badge-success' :
                student.feeStatus === 'partial' ? 'badge-warning' : 'badge-danger';

            const feeTotal = student.feeAmount || 0;
            const feePaid = student.feePaid || 0;

            row.innerHTML = `
                <td>${student.studentId}</td>
                <td>${student.name}</td>
                <td>${student.year}</td>
                <td>${student.branch}</td>
                <td>${student.section}</td>
                <td>${student.hostel || 'Not Assigned'}</td>
                <td>${student.club || 'None'}</td>
                <td>₹${feeTotal.toLocaleString()}</td>
                <td>₹${feePaid.toLocaleString()}</td>
                <td><span class="badge ${feeStatusClass}">${student.feeStatus}</span></td>
            `;

            tbody.appendChild(row);
        });
    }
}

// Search Students
document.getElementById('searchStudents')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Admin Logout
document.getElementById('adminLogout').addEventListener('click', () => {
    currentUser = null;
    currentRole = null;
    showPage('roleSelection');
});

// ===== TEACHER DASHBOARD =====
async function showTeacherDashboard() {
    showPage('teacherDashboard');
    document.getElementById('teacherName').textContent = currentUser.name;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
}

// Load Students for Attendance
document.getElementById('loadStudentsBtn').addEventListener('click', async () => {
    const year = document.getElementById('attendanceYear').value;
    const branch = document.getElementById('attendanceBranch').value;
    const section = document.getElementById('attendanceSection').value;

    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (branch) params.append('branch', branch);
    if (section) params.append('section', section);

    const result = await apiCall(`/api/teacher/students?${params}`);

    if (result.success) {
        const container = document.getElementById('attendanceList');
        container.innerHTML = '';

        result.students.forEach(student => {
            const item = document.createElement('div');
            item.className = 'attendance-item';
            item.innerHTML = `
                <div class="student-info">
                    <div class="name">${student.name}</div>
                    <div class="id">${student.studentId}</div>
                </div>
                <div class="attendance-toggle">
                    <button class="attendance-btn present" data-student-id="${student.studentId}" data-status="present">Present</button>
                    <button class="attendance-btn absent" data-student-id="${student.studentId}" data-status="absent">Absent</button>
                </div>
            `;
            container.appendChild(item);
        });

        document.querySelectorAll('.attendance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.parentElement;
                parent.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active', e.target.dataset.status);
            });
        });

        document.getElementById('submitAttendanceBtn').style.display = 'block';
    }
});

// Submit Attendance
document.getElementById('submitAttendanceBtn').addEventListener('click', async () => {
    const date = document.getElementById('attendanceDate').value;
    const activeButtons = document.querySelectorAll('.attendance-btn.active');

    if (!date) {
        showError('attendanceMessage', 'Please select a date');
        return;
    }

    if (activeButtons.length === 0) {
        showError('attendanceMessage', 'Please mark attendance for at least one student');
        return;
    }

    for (const btn of activeButtons) {
        await apiCall('/api/teacher/attendance', 'POST', {
            date,
            studentId: btn.dataset.studentId,
            status: btn.dataset.status
        });
    }

    showMessage('attendanceMessage', 'Attendance submitted successfully!', 'success');
    document.getElementById('attendanceList').innerHTML = '';
    document.getElementById('submitAttendanceBtn').style.display = 'none';
});

// Enter Marks
document.getElementById('enterMarksForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/api/teacher/marks', 'POST', data);

    if (result.success) {
        showMessage('marksMessage', 'Marks submitted successfully!', 'success');
        e.target.reset();
    } else {
        showError('marksMessage', result.message);
    }
});

// Teacher Logout
document.getElementById('teacherLogout').addEventListener('click', () => {
    currentUser = null;
    currentRole = null;
    showPage('roleSelection');
});

// ===== STUDENT DASHBOARD =====
async function showStudentDashboard() {
    showPage('studentDashboard');

    const studentId = currentUser.userId;

    // Load profile
    const profile = await apiCall(`/api/student/${studentId}`);
    if (profile.success) {
        document.getElementById('studentName').textContent = profile.profile.name;
        document.getElementById('studentIdDisplay').textContent = profile.profile.studentId;

        // Display hostel and club
        document.getElementById('studentHostel').textContent = profile.profile.hostel || 'Not Assigned';
        document.getElementById('studentClub').textContent = profile.profile.club || 'None';

        // Display fee information
        const feeTotal = profile.profile.feeAmount || 0;
        const feePaid = profile.profile.feePaid || 0;
        const feeRemaining = Math.max(0, feeTotal - feePaid);

        document.getElementById('studentFeeTotal').textContent = `₹${feeTotal.toLocaleString()}`;
        document.getElementById('studentFeePaid').textContent = `₹${feePaid.toLocaleString()}`;
        document.getElementById('studentFeeRemaining').textContent = `₹${feeRemaining.toLocaleString()}`;
        document.getElementById('studentFeeStatus').textContent = profile.profile.feeStatus || 'pending';
    }

    // Load marks
    const marks = await apiCall(`/api/student/${studentId}/marks`);
    if (marks.success) {
        const tbody = document.getElementById('studentMarksTable');
        tbody.innerHTML = '';

        if (marks.marks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No marks available</td></tr>';
        } else {
            marks.marks.forEach(mark => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mark.subject}</td>
                    <td>${mark.term}</td>
                    <td>${mark.marks}</td>
                `;
                tbody.appendChild(row);
            });
        }
    }

    // Load attendance
    const attendance = await apiCall(`/api/student/${studentId}/attendance`);
    if (attendance.success) {
        document.getElementById('studentAttendancePercent').textContent = `${attendance.percentage}%`;

        const tbody = document.getElementById('studentAttendanceTable');
        tbody.innerHTML = '';

        if (attendance.attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No attendance records</td></tr>';
        } else {
            attendance.attendance.slice(-10).reverse().forEach(record => {
                const row = document.createElement('tr');
                const statusClass = record.status === 'present' ? 'badge-success' : 'badge-danger';
                row.innerHTML = `
                    <td>${record.date}</td>
                    <td><span class="badge ${statusClass}">${record.status}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
}

// Student Logout
document.getElementById('studentLogout').addEventListener('click', () => {
    currentUser = null;
    currentRole = null;
    showPage('roleSelection');
});

// ===== PARENT DASHBOARD =====
async function showParentDashboard() {
    showPage('parentDashboard');

    const parentPhone = currentUser.userId;
    document.getElementById('parentPhone').textContent = parentPhone;

    // Load child data
    const result = await apiCall(`/api/parent/${parentPhone}`);

    if (result.success) {
        document.getElementById('childName').textContent = result.profile.name;

        // Display hostel and club
        document.getElementById('childHostel').textContent = result.profile.hostel || 'Not Assigned';
        document.getElementById('childClub').textContent = result.profile.club || 'None';

        // Display fee information
        const feeTotal = result.profile.feeAmount || 0;
        const feePaid = result.profile.feePaid || 0;
        const feeRemaining = Math.max(0, feeTotal - feePaid);

        document.getElementById('childFeeTotal').textContent = `₹${feeTotal.toLocaleString()}`;
        document.getElementById('childFeePaid').textContent = `₹${feePaid.toLocaleString()}`;
        document.getElementById('childFeeRemaining').textContent = `₹${feeRemaining.toLocaleString()}`;
        document.getElementById('childFeeStatus').textContent = result.profile.feeStatus || 'pending';
        document.getElementById('childAttendancePercent').textContent = `${result.attendancePercentage}%`;

        // Store student ID for payment
        document.getElementById('payFeeBtn').dataset.studentId = result.profile.studentId;

        // Load marks
        const tbody = document.getElementById('childMarksTable');
        tbody.innerHTML = '';

        if (result.marks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No marks available</td></tr>';
        } else {
            result.marks.forEach(mark => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mark.subject}</td>
                    <td>${mark.term}</td>
                    <td>${mark.marks}</td>
                `;
                tbody.appendChild(row);
            });
        }

        // Load attendance
        const attendanceTbody = document.getElementById('childAttendanceTable');
        attendanceTbody.innerHTML = '';

        if (result.attendance.length === 0) {
            attendanceTbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No attendance records</td></tr>';
        } else {
            result.attendance.slice(-10).reverse().forEach(record => {
                const row = document.createElement('tr');
                const statusClass = record.status === 'present' ? 'badge-success' : 'badge-danger';
                row.innerHTML = `
                    <td>${record.date}</td>
                    <td><span class="badge ${statusClass}">${record.status}</span></td>
                `;
                attendanceTbody.appendChild(row);
            });
        }

        // Load payment history
        const paymentTbody = document.getElementById('paymentHistoryTable');
        if (paymentTbody) {
            paymentTbody.innerHTML = '';

            if (result.payments && result.payments.length > 0) {
                result.payments.reverse().forEach(payment => {
                    const row = document.createElement('tr');
                    const date = new Date(payment.timestamp);
                    row.innerHTML = `
                        <td>${payment.date}</td>
                        <td>₹${payment.amount.toLocaleString()}</td>
                        <td>${date.toLocaleTimeString()}</td>
                    `;
                    paymentTbody.appendChild(row);
                });
            } else {
                paymentTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No payment history</td></tr>';
            }
        }
    }
}

// Pay Fee Button
document.getElementById('payFeeBtn')?.addEventListener('click', async (e) => {
    const studentId = e.target.dataset.studentId;
    const amountInput = document.getElementById('paymentAmount');
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        showError('paymentMessage', 'Please enter a valid amount');
        return;
    }

    const result = await apiCall('/api/parent/pay-fee', 'POST', { studentId, amount });

    if (result.success) {
        showMessage('paymentMessage', `Payment of ₹${amount.toLocaleString()} processed successfully!`, 'success');
        amountInput.value = '';
        // Reload dashboard to update fee status
        setTimeout(() => showParentDashboard(), 1000);
    } else {
        showError('paymentMessage', result.message);
    }
});

// Parent Logout
document.getElementById('parentLogout').addEventListener('click', () => {
    currentUser = null;
    currentRole = null;
    showPage('roleSelection');
});
