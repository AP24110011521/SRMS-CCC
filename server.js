const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
    students: path.join(DATA_DIR, 'students.txt'),
    teachers: path.join(DATA_DIR, 'teachers.txt'),
    attendance: path.join(DATA_DIR, 'attendance.txt'),
    marks: path.join(DATA_DIR, 'marks.txt'),
    parents: path.join(DATA_DIR, 'parents.txt'),
    payments: path.join(DATA_DIR, 'payments.txt')
};

// Utility: Hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Utility: Read JSONL file
async function readJSONL(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
}

// Utility: Append to JSONL file
async function appendJSONL(filePath, data) {
    await fs.appendFile(filePath, JSON.stringify(data) + '\n');
}

// Utility: Rewrite entire JSONL file
async function writeJSONL(filePath, dataArray) {
    const content = dataArray.map(item => JSON.stringify(item)).join('\n') + '\n';
    await fs.writeFile(filePath, content);
}

// Initialize data directory
async function initDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Create empty files if they don't exist
        for (const file of Object.values(FILES)) {
            try {
                await fs.access(file);
            } catch {
                await fs.writeFile(file, '');
            }
        }
    } catch (err) {
        console.error('Error initializing data directory:', err);
    }
}

// ===== AUTH ENDPOINTS =====

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { role, userId, password } = req.body;

    try {
        const hashedPassword = hashPassword(password);

        if (role === 'admin') {
            // Hardcoded admin credentials
            if (userId === 'admin' && hashedPassword === hashPassword('admin123')) {
                return res.json({ success: true, role: 'admin', userId: 'admin' });
            }
        } else if (role === 'teacher') {
            const teachers = await readJSONL(FILES.teachers);
            const teacher = teachers.find(t => t.teacherId === userId && t.password === hashedPassword);
            if (teacher) {
                return res.json({ success: true, role: 'teacher', userId: teacher.teacherId, name: teacher.name });
            }
        } else if (role === 'student') {
            const students = await readJSONL(FILES.students);
            const student = students.find(s => s.studentId === userId && s.password === hashedPassword);
            if (student) {
                return res.json({ success: true, role: 'student', userId: student.studentId, name: student.name });
            }
        } else if (role === 'parent') {
            const parents = await readJSONL(FILES.parents);
            const parent = parents.find(p => p.parentPhone === userId && p.password === hashedPassword);
            if (parent) {
                return res.json({ success: true, role: 'parent', userId: parent.parentPhone, studentId: parent.studentId });
            }
        }

        res.json({ success: false, message: 'Invalid credentials' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ===== ADMIN ENDPOINTS =====

// Add student
app.post('/api/admin/add-student', async (req, res) => {
    try {
        const { name, dob, year, branch, section, studentId, password, parentPhone, hostel, club, feeAmount } = req.body;

        // Validate required fields
        if (!name || !dob || !year || !branch || !section || !studentId || !password || !parentPhone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if student ID already exists
        const students = await readJSONL(FILES.students);
        if (students.find(s => s.studentId === studentId)) {
            return res.status(400).json({ success: false, message: 'Student ID already exists' });
        }

        const student = {
            studentId,
            name,
            dob,
            year,
            branch,
            section,
            password: hashPassword(password),
            parentPhone,
            hostel: hostel || 'Not Assigned',
            club: club || 'None',
            feeAmount: parseFloat(feeAmount) || 0,
            feePaid: 0,
            feeStatus: 'pending'
        };

        await appendJSONL(FILES.students, student);

        // Create parent account
        const parents = await readJSONL(FILES.parents);
        if (!parents.find(p => p.parentPhone === parentPhone)) {
            const parent = {
                parentPhone,
                studentId,
                password: hashPassword(password) // Same password as student initially
            };
            await appendJSONL(FILES.parents, parent);
        }

        res.json({ success: true, message: 'Student added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Edit student
app.post('/api/admin/edit-student', async (req, res) => {
    try {
        const { studentId, name, dob, year, branch, section, parentPhone, hostel, club, feeAmount } = req.body;

        const students = await readJSONL(FILES.students);
        const index = students.findIndex(s => s.studentId === studentId);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Update student data, keep password and feePaid unchanged
        students[index] = {
            ...students[index],
            name: name || students[index].name,
            dob: dob || students[index].dob,
            year: year || students[index].year,
            branch: branch || students[index].branch,
            section: section || students[index].section,
            parentPhone: parentPhone || students[index].parentPhone,
            hostel: hostel !== undefined ? hostel : students[index].hostel,
            club: club !== undefined ? club : students[index].club,
            feeAmount: feeAmount !== undefined ? parseFloat(feeAmount) : students[index].feeAmount
        };

        // Update fee status based on payment
        const feePaid = students[index].feePaid || 0;
        const totalFee = students[index].feeAmount || 0;
        if (feePaid >= totalFee && totalFee > 0) {
            students[index].feeStatus = 'paid';
        } else if (feePaid > 0) {
            students[index].feeStatus = 'partial';
        } else {
            students[index].feeStatus = 'pending';
        }

        await writeJSONL(FILES.students, students);

        res.json({ success: true, message: 'Student updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add teacher
app.post('/api/admin/add-teacher', async (req, res) => {
    try {
        const { name, subject, teacherId, password } = req.body;

        if (!name || !subject || !teacherId || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const teachers = await readJSONL(FILES.teachers);
        if (teachers.find(t => t.teacherId === teacherId)) {
            return res.status(400).json({ success: false, message: 'Teacher ID already exists' });
        }

        const teacher = {
            teacherId,
            name,
            subject,
            password: hashPassword(password)
        };

        await appendJSONL(FILES.teachers, teacher);
        res.json({ success: true, message: 'Teacher added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Edit teacher
app.post('/api/admin/edit-teacher', async (req, res) => {
    try {
        const { teacherId, name, subject } = req.body;

        const teachers = await readJSONL(FILES.teachers);
        const index = teachers.findIndex(t => t.teacherId === teacherId);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Update teacher data, keep password unchanged
        teachers[index] = {
            ...teachers[index],
            name: name || teachers[index].name,
            subject: subject || teachers[index].subject
        };

        await writeJSONL(FILES.teachers, teachers);

        res.json({ success: true, message: 'Teacher updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all students
app.get('/api/admin/students', async (req, res) => {
    try {
        const students = await readJSONL(FILES.students);
        // Remove password from response
        const sanitized = students.map(({ password, ...rest }) => rest);
        res.json({ success: true, students: sanitized });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all teachers
app.get('/api/admin/teachers', async (req, res) => {
    try {
        const teachers = await readJSONL(FILES.teachers);
        // Remove password from response
        const sanitized = teachers.map(({ password, ...rest }) => rest);
        res.json({ success: true, teachers: sanitized });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update fee status
app.post('/api/admin/update-fee', async (req, res) => {
    try {
        const { studentId, feeStatus } = req.body;

        const students = await readJSONL(FILES.students);
        const index = students.findIndex(s => s.studentId === studentId);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        students[index].feeStatus = feeStatus;
        await writeJSONL(FILES.students, students);

        res.json({ success: true, message: 'Fee status updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ===== TEACHER ENDPOINTS =====

// Get students by class
app.get('/api/teacher/students', async (req, res) => {
    try {
        const { year, branch, section } = req.query;
        let students = await readJSONL(FILES.students);

        if (year) students = students.filter(s => s.year === year);
        if (branch) students = students.filter(s => s.branch === branch);
        if (section) students = students.filter(s => s.section === section);

        const sanitized = students.map(({ password, ...rest }) => rest);
        res.json({ success: true, students: sanitized });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark attendance
app.post('/api/teacher/attendance', async (req, res) => {
    try {
        const { date, studentId, status } = req.body;

        if (!date || !studentId || !status) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const attendance = {
            date,
            studentId,
            status
        };

        await appendJSONL(FILES.attendance, attendance);
        res.json({ success: true, message: 'Attendance marked' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add marks
app.post('/api/teacher/marks', async (req, res) => {
    try {
        const { studentId, subject, term, marks } = req.body;

        if (!studentId || !subject || !term || marks === undefined) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const markEntry = {
            studentId,
            subject,
            term,
            marks: parseFloat(marks)
        };

        await appendJSONL(FILES.marks, markEntry);
        res.json({ success: true, message: 'Marks added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ===== STUDENT ENDPOINTS =====

// Get student profile
app.get('/api/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const students = await readJSONL(FILES.students);
        const student = students.find(s => s.studentId === studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const { password, ...profile } = student;
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get student marks
app.get('/api/student/:studentId/marks', async (req, res) => {
    try {
        const { studentId } = req.params;
        const allMarks = await readJSONL(FILES.marks);
        const marks = allMarks.filter(m => m.studentId === studentId);

        res.json({ success: true, marks });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get student attendance
app.get('/api/student/:studentId/attendance', async (req, res) => {
    try {
        const { studentId } = req.params;
        const allAttendance = await readJSONL(FILES.attendance);
        const attendance = allAttendance.filter(a => a.studentId === studentId);

        // Calculate percentage
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

        res.json({ success: true, attendance, percentage });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ===== PARENT ENDPOINTS =====

// Get child data
app.get('/api/parent/:parentPhone', async (req, res) => {
    try {
        const { parentPhone } = req.params;
        const parents = await readJSONL(FILES.parents);
        const parent = parents.find(p => p.parentPhone === parentPhone);

        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        const students = await readJSONL(FILES.students);
        const student = students.find(s => s.studentId === parent.studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const { password, ...profile } = student;
        const allMarks = await readJSONL(FILES.marks);
        const marks = allMarks.filter(m => m.studentId === parent.studentId);
        const allAttendance = await readJSONL(FILES.attendance);
        const attendance = allAttendance.filter(a => a.studentId === parent.studentId);

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

        // Get payment history
        const allPayments = await readJSONL(FILES.payments);
        const payments = allPayments.filter(p => p.studentId === parent.studentId);

        res.json({
            success: true,
            profile,
            marks,
            attendance,
            attendancePercentage: percentage,
            payments
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Process payment
app.post('/api/parent/pay-fee', async (req, res) => {
    try {
        const { studentId, amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount' });
        }

        const students = await readJSONL(FILES.students);
        const index = students.findIndex(s => s.studentId === studentId);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Update fee paid
        const currentPaid = students[index].feePaid || 0;
        const newPaid = currentPaid + parseFloat(amount);
        students[index].feePaid = newPaid;

        // Update fee status
        const totalFee = students[index].feeAmount || 0;
        if (newPaid >= totalFee && totalFee > 0) {
            students[index].feeStatus = 'paid';
        } else if (newPaid > 0) {
            students[index].feeStatus = 'partial';
        }

        await writeJSONL(FILES.students, students);

        // Record payment
        const payment = {
            studentId,
            amount: parseFloat(amount),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        await appendJSONL(FILES.payments, payment);

        res.json({
            success: true,
            message: 'Payment processed successfully',
            feePaid: newPaid,
            feeRemaining: Math.max(0, totalFee - newPaid)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start server
initDataDir().then(() => {
    app.listen(PORT, () => {
        console.log(`SRMS Server running on http://localhost:${PORT}`);
    });
});
