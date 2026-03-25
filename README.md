# AuraEdu - School Management System

A comprehensive, production-ready school management platform built with modern web technologies, Supabase backend, and real-time features.

## Features

### Core Features
- **Student Management** - Complete CRUD operations for student records
- **Attendance Tracking** - Daily attendance with real-time updates
- **Fee Management** - Track payments, generate receipts, automated reminders
- **Analytics Dashboard** - Comprehensive reports and insights
- **Announcements** - School-wide communication system
- **Role-based Access** - Admin, Teacher, Parent, and Student roles

### Advanced Features
- Real-time data synchronization
- CSV export for reports
- Responsive design for all devices
- Secure authentication with Supabase
- Row Level Security (RLS) for data protection
- Grade-wise statistics and analytics
- Fee collection tracking and defaulter alerts

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time)
- **Build Tool**: Vite
- **Styling**: Custom CSS with modern design tokens

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following tables:
- `profiles` - User profiles and roles
- `students` - Student information
- `attendance_records` - Daily attendance tracking
- `fee_structures` - Fee templates by grade
- `fee_records` - Student fee tracking
- `fee_payments` - Payment transactions
- `subjects` - Course subjects
- `exams` - Examination schedules
- `exam_results` - Student results
- `staff` - Staff management
- `announcements` - School announcements
- `notifications` - User notifications

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   cd auraedu-school-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Create a `.env` file in the root directory:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Database Setup**
   The database schema has already been applied via migration. Your tables are ready to use.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### First Time Setup

1. **Create an Admin Account**
   - Go to the auth page
   - Click "Sign Up"
   - Fill in your details
   - Select "Admin" as the role
   - Sign up

2. **Add Students**
   - Login with your admin account
   - Go to "Students" section
   - Click "Add Student"
   - Fill in student details

3. **Mark Attendance**
   - Go to "Attendance" section
   - Toggle students present/absent
   - Click "Save Attendance"

4. **Manage Fees**
   - Go to "Fee Management"
   - Click "Collect Fee" for any student
   - Enter payment amount

5. **View Reports**
   - Go to "Analytics" section
   - View comprehensive statistics
   - Export reports as CSV

## Security

- All tables are protected with Row Level Security (RLS)
- Users can only access data relevant to their role
- Passwords are securely hashed
- API keys are environment variables
- Real-time subscriptions are authenticated

## Production Deployment

### Build for Production
```bash
npm run build
```

This creates an optimized build in the `dist` folder.

### Deploy Options

1. **Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Supabase Hosting**
   - Build your project
   - Upload the `dist` folder to Supabase Storage
   - Enable static hosting

### Environment Variables
Make sure to set your environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Usage Guide

### For Administrators
- Manage students, staff, and school data
- Track attendance and fees
- Generate reports and analytics
- Create announcements
- Export data

### For Teachers
- Mark daily attendance
- View student records
- Access announcements

### For Parents
- View their children's attendance
- Check fee status
- Receive notifications

## Support

For issues or questions, please contact the development team or open an issue in the repository.

## License

This project is proprietary software developed for AuraEdu.
