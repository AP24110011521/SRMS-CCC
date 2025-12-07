# SRMS - Student Record Management System

A lightweight, minimal, and expandable Student Record Management System built with vanilla HTML, CSS, JavaScript, and Node.js/Express. Data is persisted in plain text files using newline-delimited JSON (JSONL) format.

## 🎯 Features

### 4 Role-Based Interfaces

1. **Admin**
   - Add students and teachers
   - View all students with search functionality
   - Manage fee status (paid/pending/payment-requested)
   - Assign student IDs and passwords

2. **Teacher**
   - View students by class (year/branch/section)
   - Mark attendance (date-based: present/absent)
   - Enter marks per student (subject, term)
   - Filter students by multiple criteria

3. **Student**
   - View personal profile
   - Check marks by subject and term
   - View attendance history with percentage
   - Monitor fee status

4. **Parent**
   - View child's complete academic record
   - Check marks and attendance
   - Monitor fee status
   - Request fee payment

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔐 Default Credentials

### Admin
- **ID:** `admin`
- **Password:** `admin123`

### Sample Teacher
- **ID:** `T001`
- **Password:** `123456`

### Sample Student
- **ID:** `S1001`
- **Password:** `123456`

### Sample Parent
- **Phone:** `9876543210`
- **Password:** `123456`

## 📁 Project Structure

```
ccc srms/
├── data/                    # Data storage (JSONL files)
│   ├── students.txt        # Student records
│   ├── teachers.txt        # Teacher records
│   ├── attendance.txt      # Attendance records
│   ├── marks.txt           # Marks records
│   └── parents.txt         # Parent accounts
├── public/                  # Frontend files
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling
│   └── app.js              # Client-side JavaScript
├── server.js               # Express server & API
├── package.json            # Dependencies
└── README.md               # This file
```

## 💾 Data Storage

All data is stored in plain text files using **newline-delimited JSON (JSONL)** format. Each line is a valid JSON object, making it:
- ✅ Human-readable
- ✅ Easy to edit manually
- ✅ Simple to migrate to databases later
- ✅ Version control friendly

### Example (students.txt):
```json
{"studentId":"S1001","name":"Rahul Kumar","dob":"2006-03-15","year":"2","branch":"CSE","section":"A","password":"hashed","parentPhone":"9876543210","feeStatus":"paid"}
{"studentId":"S1002","name":"Priya Sharma","dob":"2006-07-22","year":"2","branch":"CSE","section":"A","password":"hashed","parentPhone":"9876543211","feeStatus":"pending"}
```

## 🎨 UI/UX Features

- **Modern Dark Theme** with vibrant gradients
- **Glassmorphism** effects on cards
- **Smooth Animations** and transitions
- **Responsive Design** (mobile-friendly)
- **Interactive Elements** with hover effects
- **Clean Typography** using Inter font
- **Role-based Color Coding**

## 🔒 Security Features

- ✅ SHA-256 password hashing
- ✅ Role-based access control
- ✅ Input validation (client & server)
- ✅ Secure session management
- ✅ Protected API endpoints

## 📊 Sample Data Included

The system comes pre-loaded with:
- **5 Students** across different years and branches
- **3 Teachers** for different subjects
- **Sample Attendance** records
- **Sample Marks** for multiple subjects
- **Parent Accounts** linked to students

## 🛠️ API Endpoints

### Authentication
- `POST /api/login` - Login for all roles

### Admin
- `POST /api/admin/add-student` - Add new student
- `POST /api/admin/add-teacher` - Add new teacher
- `GET /api/admin/students` - Get all students
- `POST /api/admin/update-fee` - Update fee status

### Teacher
- `GET /api/teacher/students` - Get students by class
- `POST /api/teacher/attendance` - Mark attendance
- `POST /api/teacher/marks` - Enter marks

### Student
- `GET /api/student/:studentId` - Get student profile
- `GET /api/student/:studentId/marks` - Get student marks
- `GET /api/student/:studentId/attendance` - Get attendance

### Parent
- `GET /api/parent/:parentPhone` - Get child's complete data
- `POST /api/parent/pay-fee` - Request fee payment

## 🔄 Future Enhancements

- [ ] CSV export for reports
- [ ] Email notifications
- [ ] Bulk upload (CSV import)
- [ ] Advanced analytics dashboard
- [ ] Timetable management
- [ ] Assignment submission
- [ ] Real payment gateway integration
- [ ] Database migration (SQLite/PostgreSQL)

## 📝 Notes

- Passwords are hashed using SHA-256 (placeholder for production-grade hashing like bcrypt)
- For production, implement proper authentication (JWT, sessions)
- Consider migrating to a proper database for larger datasets
- Add HTTPS for production deployment

## 🤝 Contributing

This is a minimal, expandable system. Feel free to:
- Add new features
- Improve security
- Enhance UI/UX
- Optimize performance

## 📄 License

ISC License - Free to use and modify

## 🆘 Support

For issues or questions:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure port 3000 is available
4. Check data files are properly formatted

---

**Built with ❤️ using vanilla HTML, CSS, JavaScript, and Node.js**
