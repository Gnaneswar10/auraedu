import { supabase } from './supabase.js';

export const studentsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(student) {
    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const attendanceAPI = {
  async getByDate(date) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        student:students(*)
      `)
      .eq('date', date);

    if (error) throw error;
    return data;
  },

  async getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  },

  async mark(studentId, date, status, remarks, markedBy) {
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert([{
        student_id: studentId,
        date,
        status,
        remarks,
        marked_by: markedBy
      }], {
        onConflict: 'student_id,date'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStudentAttendance(studentId, startDate, endDate) {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getAttendanceStats() {
    const today = new Date().toISOString().split('T')[0];

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('status', 'active');

    if (studentsError) throw studentsError;

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('date', today);

    if (attendanceError) throw attendanceError;

    const totalStudents = students.length;
    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return {
      total: totalStudents,
      present: presentCount,
      absent: absentCount,
      percentage
    };
  }
};

export const feeAPI = {
  async getAllRecords() {
    const { data, error } = await supabase
      .from('fee_records')
      .select(`
        *,
        student:students(*),
        fee_structure:fee_structures(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getStudentFeeRecord(studentId) {
    const { data, error } = await supabase
      .from('fee_records')
      .select(`
        *,
        fee_structure:fee_structures(*),
        payments:fee_payments(*)
      `)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createFeeRecord(studentId, feeStructureId, totalAmount) {
    const { data, error } = await supabase
      .from('fee_records')
      .insert([{
        student_id: studentId,
        fee_structure_id: feeStructureId,
        total_amount: totalAmount,
        paid_amount: 0,
        pending_amount: totalAmount,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async recordPayment(feeRecordId, amount, paymentMethod, transactionId, receivedBy, remarks) {
    const { data, error } = await supabase
      .from('fee_payments')
      .insert([{
        fee_record_id: feeRecordId,
        amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        payment_date: new Date().toISOString().split('T')[0],
        remarks,
        received_by: receivedBy
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFeeStats() {
    const { data, error } = await supabase
      .from('fee_records')
      .select('total_amount, paid_amount, pending_amount');

    if (error) throw error;

    const totalCollected = data.reduce((sum, record) => sum + parseFloat(record.paid_amount || 0), 0);
    const totalPending = data.reduce((sum, record) => sum + parseFloat(record.pending_amount || 0), 0);
    const totalExpected = data.reduce((sum, record) => sum + parseFloat(record.total_amount || 0), 0);

    return {
      collected: totalCollected,
      pending: totalPending,
      expected: totalExpected,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
    };
  }
};

export const announcementsAPI = {
  async getActive() {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        publisher:profiles!published_by(full_name, role)
      `)
      .lte('published_at', new Date().toISOString())
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  },

  async create(title, content, type, targetAudience, publishedBy) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        title,
        content,
        type,
        target_audience: targetAudience,
        published_by: publishedBy
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const notificationsAPI = {
  async getUnread(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async create(userId, title, message, type) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const dashboardAPI = {
  async getStats() {
    const [students, attendanceStats, feeStats] = await Promise.all([
      studentsAPI.getAll(),
      attendanceAPI.getAttendanceStats(),
      feeAPI.getFeeStats()
    ]);

    return {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'active').length,
      attendance: attendanceStats,
      fees: feeStats
    };
  }
};
