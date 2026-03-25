# AuraEdu School Management System - Setup Guide

## Quick Start

This is a production-ready school management system with real database integration, authentication, and advanced features.

### What's Included

1. **Complete Database Schema** - All tables are created and secured with Row Level Security
2. **Authentication System** - Sign up, login, role-based access control
3. **Student Management** - Add, edit, delete student records
4. **Attendance Tracking** - Mark daily attendance with real-time updates
5. **Fee Management** - Track payments, generate receipts, view defaulters
6. **Analytics Dashboard** - Comprehensive reports and insights
7. **Announcements** - School-wide communication system
8. **Data Export** - CSV export for all reports

## Database Configuration

Your Supabase database has been configured with the following:

### Tables Created
- `profiles` - User accounts and roles
- `students` - Student information
- `attendance_records` - Daily attendance
- `fee_structures` - Fee templates
- `fee_records` - Student fees
- `fee_payments` - Payment history
- `subjects` - Course subjects
- `exams` - Examinations
- `exam_results` - Student results
- `staff` - Staff records
- `announcements` - Communications
- `notifications` - User notifications

### Security Features
- Row Level Security (RLS) enabled on all tables
- Role-based access policies (admin, teacher, parent, student)
- Secure authentication with Supabase Auth
- Automated triggers for data integrity

## Step-by-Step Setup

### 1. Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings > API
4. Copy the Project URL and anon/public key

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## First Time Usage

### Creating Your Admin Account

1. Navigate to `http://localhost:3000`
2. Click "Portal Login" in the navigation
3. Click "Sign Up"
4. Fill in:
   - Full Name: Your Name
   - Email: admin@yourschool.edu
   - Password: Choose a secure password (min 6 characters)
   - Role: Admin
5. Click "Sign Up"
6. You'll be automatically logged in and redirected to the dashboard

### Adding Students

1. Go to "Students" from the sidebar
2. Click "Add Student"
3. Fill in the form:
   - Full Name: Student's full name
   - Roll Number: Unique identifier
   - Grade: Select from dropdown
   - Parent Contact: Phone number
   - Annual Fee: Fee amount (default ₹45,000)
4. Click "Save Student"

The system automatically:
- Creates a student record
- Generates a fee record
- Sets up attendance tracking

### Marking Attendance

1. Go to "Attendance" from the sidebar
2. Toggle the switch for each student (Green = Present, Red = Absent)
3. Click "Save Attendance"

Attendance is date-stamped and can be updated throughout the day.

### Managing Fees

1. Go to "Fee Management" from the sidebar
2. View all students and their fee status
3. Click "Collect Fee" to record a payment
4. Enter the amount collected
5. Payment is recorded and status is automatically updated

### Viewing Reports

1. Go to "Analytics" from the sidebar
2. View:
   - Overall statistics
   - Attendance rates
   - Fee collection rates
   - Grade-wise performance
3. Click "Export Report" to download CSV

### Creating Announcements

1. Go to "Announcements" from the sidebar
2. Click "New Announcement"
3. Fill in:
   - Title: Short headline
   - Message: Detailed content
   - Type: General/Urgent/Event
   - Target Audience: Select recipients
4. Click "Publish Announcement"

## Features Breakdown

### Dashboard
- Real-time statistics
- Total students count
- Today's attendance percentage
- Fee collection summary
- Recent admissions list
- System alerts

### Student Management
- Complete CRUD operations
- Search functionality
- Student profiles with all details
- Parent contact information
- Status tracking (active/inactive/graduated)

### Attendance System
- Daily attendance marking
- Bulk update capability
- Historical records
- Attendance rate calculation
- Present/Absent/Late/Half-day status

### Fee Management
- Multiple fee structures by grade
- Payment tracking
- Partial payment support
- Automatic status calculation
- Payment history
- Receipt generation

### Analytics & Reports
- Attendance trends
- Fee collection rates
- Grade-wise statistics
- Defaulter lists
- CSV export functionality
- Visual progress indicators

### Announcements
- School-wide broadcasting
- Targeted messaging (parents, teachers, students)
- Urgent alerts
- Event notifications
- Publication scheduling

## User Roles & Permissions

### Admin
- Full access to all features
- Create/edit/delete students
- Manage fees and payments
- Mark attendance
- Create announcements
- View all reports
- Export data

### Teacher
- View student records
- Mark attendance
- View announcements
- Limited access to reports

### Parent
- View their children's records
- Check attendance history
- View fee status
- Receive announcements

### Student
- View own records
- Check attendance
- View exam results

## Database Maintenance

### Backing Up Data

```bash
# From Supabase dashboard:
# 1. Go to Database > Backups
# 2. Click "Create backup"
# 3. Download when ready
```

### Monitoring

- Check Supabase dashboard for:
  - Database size
  - API requests
  - Active users
  - Error logs

## Troubleshooting

### Login Issues
- Ensure Supabase URL and key are correct in `.env`
- Check that email confirmation is disabled in Supabase Auth settings
- Verify RLS policies are active

### Data Not Loading
- Check browser console for errors
- Verify Supabase connection in Network tab
- Ensure user has correct role assigned

### Permission Errors
- RLS policies restrict access by role
- Verify user profile has correct role
- Check that policies are enabled in Supabase

## Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

## Security Best Practices

1. **Never commit `.env` file**
2. **Use strong passwords**
3. **Enable 2FA on Supabase account**
4. **Regularly update dependencies**
5. **Monitor database access logs**
6. **Keep Supabase keys secure**
7. **Use HTTPS in production**

## Support & Updates

For technical support or feature requests, contact the development team.

## Appendix: API Reference

### Student Operations
```javascript
// Get all students
await studentsAPI.getAll()

// Get single student
await studentsAPI.getById(id)

// Create student
await studentsAPI.create(studentData)

// Update student
await studentsAPI.update(id, updates)

// Delete student
await studentsAPI.delete(id)
```

### Attendance Operations
```javascript
// Mark attendance
await attendanceAPI.mark(studentId, date, status, remarks, markedBy)

// Get attendance stats
await attendanceAPI.getAttendanceStats()

// Get student attendance
await attendanceAPI.getStudentAttendance(studentId, startDate, endDate)
```

### Fee Operations
```javascript
// Record payment
await feeAPI.recordPayment(feeRecordId, amount, method, transactionId, receivedBy)

// Get fee stats
await feeAPI.getFeeStats()
```

## Advanced Features Coming Soon

- SMS integration for parent alerts
- Email notifications
- GPS bus tracking
- Mobile app (qPASS)
- Exam management module
- Library management
- HR & payroll
- Report card generation
- Parent portal access
