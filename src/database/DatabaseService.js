const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseService {
  constructor() {
    const userDataPath = require('electron').app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'company-admin.sqlite');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON');
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.createTables();
    this.migrateDatabase();
    this.createUsersTable();
    this.initializeDefaultUser();
  }

  createTables() {
    // Departments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        budget REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employees table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id TEXT UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        position TEXT NOT NULL,
        department_id INTEGER,
        salary REAL NOT NULL,
        hire_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    // Attendance table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status TEXT NOT NULL DEFAULT 'Present',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE(employee_id, date)
      )
    `);

    // Payroll table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        basic_salary REAL NOT NULL,
        allowances REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        net_salary REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        payment_date DATE,
        cutoff_type TEXT DEFAULT 'Full Month',
        working_days INTEGER DEFAULT 24,
        days_present INTEGER DEFAULT 24,
        daily_rate REAL DEFAULT 0,
        breakdown TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE(employee_id, period_start, period_end)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
      CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_start, period_end);
    `);
  }

  createUsersTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        avatar TEXT,
        phone TEXT,
        position TEXT,
        department TEXT,
        hire_date DATE,
        bio TEXT,
        theme_preference TEXT DEFAULT 'light',
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

// Initialize default admin user
initializeDefaultUser() {
  try {
    // Check if admin user exists
    const checkStmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?');
    const result = checkStmt.get('admin@company.com');
    
    if (result.count === 0) {
      const stmt = this.db.prepare(`
        INSERT INTO users (email, display_name, position, department, hire_date, bio)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        'admin@company.com',
        'Admin User',
        'System Administrator',
        'IT Department',
        new Date().toISOString().split('T')[0],
        'System administrator with full access to all features.'
      );
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error initializing default user:', error);
  }
}

  saveUserProfile(userData) {
    try {
      // First, check if we need to update email (user is changing their email)
      const existingUser = this.getUserProfile(userData.email);
      
      if (existingUser) {
        // User exists with this email, update it
        const stmt = this.db.prepare(`
          UPDATE users SET
            display_name = ?,
            avatar = ?,
            phone = ?,
            position = ?,
            department = ?,
            hire_date = ?,
            bio = ?,
            theme_preference = ?,
            language = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE email = ?
        `);
        
        const info = stmt.run(
          userData.displayName || '',
          userData.avatar || null,
          userData.phone || null,
          userData.position || null,
          userData.department || null,
          userData.hireDate || null,
          userData.bio || null,
          userData.themePreference || 'light',
          userData.language || 'en',
          userData.email
        );
        
        return { id: existingUser.id, changes: info.changes };
      } else {
        // Check if user exists with old email (email change scenario)
        // This would require knowing the old email, which you don't have in this method
        // You might need to pass both old and new email
        
        // For now, just insert new user
        const stmt = this.db.prepare(`
          INSERT INTO users (
            email, display_name, avatar, phone, position, 
            department, hire_date, bio, theme_preference, language
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(
          userData.email,
          userData.displayName || '',
          userData.avatar || null,
          userData.phone || null,
          userData.position || null,
          userData.department || null,
          userData.hireDate || null,
          userData.bio || null,
          userData.themePreference || 'light',
          userData.language || 'en'
        );
        
        return { id: info.lastInsertRowid, changes: info.changes };
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }


  // Get user profile by email
  getUserProfile(email) {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      return stmt.get(email);
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user avatar
  updateUserAvatar(email, avatarData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET avatar = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE email = ?
      `);
      
      const info = stmt.run(avatarData, email);
      return { changes: info.changes };
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  // Get all user settings (including preferences)
  getUserSettings(email) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          email,
          display_name as displayName,
          avatar,
          phone,
          position,
          department,
          hire_date as hireDate,
          bio,
          theme_preference as themePreference,
          language,
          created_at as createdAt,
          updated_at as updatedAt
        FROM users 
        WHERE email = ?
      `);
      
      return stmt.get(email);
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Employee methods
  getAllEmployees() {
    const stmt = this.db.prepare(`
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at DESC
    `);
    return stmt.all();
  }

  getEmployeeById(id) {
    const stmt = this.db.prepare(`
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `);
    return stmt.get(id);
  }

  createEmployee(employee) {
    const stmt = this.db.prepare(`
      INSERT INTO employees (
        company_id, first_name, last_name, email, phone, 
        position, department_id, salary, hire_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const info = stmt.run(
        employee.company_id,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.phone,
        employee.position,
        employee.department_id,
        employee.salary,
        employee.hire_date,
        employee.status || 'Active'
      );
      return { id: info.lastInsertRowid, changes: info.changes };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  updateEmployee(id, employeeData) {
    const fields = [];
    const values = [];

    // Build dynamic update query
    Object.entries(employeeData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    // Add updated_at timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    if (fields.length === 0) {
      return { changes: 0 };
    }

    const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const stmt = this.db.prepare(sql);
    const info = stmt.run(...values);
    return { changes: info.changes };
  }

  deleteEmployee(id) {
    const stmt = this.db.prepare('DELETE FROM employees WHERE id = ?');
    const info = stmt.run(id);
    return { changes: info.changes };
  }

  // Department methods
  getAllDepartments() {
    const stmt = this.db.prepare(`
      SELECT 
        d.*,
        COUNT(e.id) as employee_count,
        COALESCE(AVG(e.salary), 0) as avg_salary
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'Active'
      GROUP BY d.id
      ORDER BY d.name
    `);
    return stmt.all();
  }

  // Create a new department
  createDepartment(department) {
    const stmt = this.db.prepare(`
      INSERT INTO departments (name, budget) 
      VALUES (?, ?)
    `);

    try {
      const info = stmt.run(department.name, department.budget);
      return { id: info.lastInsertRowid, changes: info.changes };
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // DatabaseService.js - Add this in the Department methods section
  deleteDepartment(id) {
    try {
      // First check if there are any employees in this department
      const checkStmt = this.db.prepare('SELECT COUNT(*) as count FROM employees WHERE department_id = ?');
      const result = checkStmt.get(id);
      
      if (result.count > 0) {
        throw new Error('Cannot delete department that has employees. Please reassign or delete employees first.');
      }
      
      const stmt = this.db.prepare('DELETE FROM departments WHERE id = ?');
      const info = stmt.run(id);
      return { changes: info.changes };
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Attendance methods
  getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        d.name as department_name
      FROM attendance a
      INNER JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE date(a.date) = date(?)
      ORDER BY a.check_in DESC
    `);
    return stmt.all(today);
  }

  // Record attendance
  recordAttendance(attendance) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO attendance 
      (employee_id, date, check_in, check_out, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      const info = stmt.run(
        attendance.employee_id,
        attendance.date,
        attendance.check_in,
        attendance.check_out,
        attendance.status || 'Present',
        attendance.notes || null
      );
      return { id: info.lastInsertRowid, changes: info.changes };
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  getWeeklyAttendance() {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6); // Last 7 days including today
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      const stmt = this.db.prepare(`
        SELECT 
          date(a.date) as date,
          strftime('%w', a.date) as day_of_week,
          COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
          COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
          COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late,
          COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) as leave,
          COUNT(*) as total
        FROM attendance a
        WHERE date(a.date) BETWEEN date(?) AND date(?)
        GROUP BY date(a.date)
        ORDER BY date(a.date) ASC
      `);
      
      const rows = stmt.all(startDateStr, endDateStr);
      
      // Create an array for all 7 days
      const weeklyData = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = currentDate.getDate();
        
        // Find data for this date
        const dayData = rows.find(row => row.date === dateStr);
        
        weeklyData.push({
          day: dayName,
          date: dateStr,
          present: dayData ? dayData.present : 0,
          absent: dayData ? dayData.absent : 0,
          late: dayData ? dayData.late : 0,
          leave: dayData ? dayData.leave : 0,
          total: dayData ? dayData.total : 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly attendance:', error);
      throw error;
    }
  }

  // Also add a method to get today's summary
  getTodayAttendanceSummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
          COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
          COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late,
          COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) as leave,
          COUNT(*) as total
        FROM attendance a
        WHERE date(a.date) = date(?)
      `);
      
      const result = stmt.get(today);
      
      if (result && result.total > 0) {
        const rate = ((result.present / result.total) * 100).toFixed(1);
        return {
          presentToday: result.present,
          absentToday: result.absent,
          lateToday: result.late,
          leaveToday: result.leave,
          attendanceRate: `${rate}%`
        };
      }
      
      // Return defaults if no data
      return {
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        leaveToday: 0,
        attendanceRate: '0%'
      };
    } catch (error) {
      console.error('Error getting today\'s attendance summary:', error);
      return {
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        leaveToday: 0,
        attendanceRate: '0%'
      };
    }
  }

  getMonthlyAttendanceReport(year, month) {
    try {
      // Calculate start and end dates for the month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
      
      const stmt = this.db.prepare(`
        SELECT 
          e.id as employee_id,
          e.first_name || ' ' || e.last_name as employee_name,
          d.name as department_name,
          COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
          COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late_days,
          COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) as leave_days,
          COUNT(a.id) as total_recorded_days
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.id = a.employee_id 
          AND strftime('%Y-%m', a.date) = ?
        WHERE e.status = 'Active'
        GROUP BY e.id
        ORDER BY e.first_name, e.last_name
      `);
      
      return stmt.all(`${year}-${month.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('Error getting monthly attendance report:', error);
      throw error;
    }
  }

  // Payroll methods
  processPayroll(payrollData) {
    const stmt = this.db.prepare(`
      INSERT INTO payroll (
        employee_id, period_start, period_end, basic_salary,
        allowances, deductions, net_salary, status, payment_date,
        cutoff_type, working_days, days_present, daily_rate, breakdown
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      payrollData.employee_id,
      payrollData.period_start,
      payrollData.period_end,
      payrollData.basic_salary,
      payrollData.allowances || 0,
      payrollData.deductions || 0,
      payrollData.net_salary,
      payrollData.status || 'Pending',
      payrollData.payment_date || null,
      payrollData.cutoff_type || 'Full Month',
      payrollData.working_days || 24,
      payrollData.days_present || 24,
      payrollData.daily_rate || (payrollData.basic_salary / 24),
      JSON.stringify(payrollData.breakdown || {})
    );

    return { id: info.lastInsertRowid, changes: info.changes };
  }

  // Get all payroll records
  getAllPayroll() {
    const stmt = this.db.prepare(`
      SELECT 
        p.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        e.salary as monthly_salary,
        d.name as department_name
      FROM payroll p
      INNER JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY p.period_end DESC
    `);
    return stmt.all();
  }

  getPayrollSummary(year, month) {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const stmt = this.db.prepare(`
      SELECT 
        p.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        e.salary as basic_salary,
        d.name as department_name
      FROM payroll p
      INNER JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE p.period_start >= date(?) AND p.period_end <= date(?)
      ORDER BY p.period_end DESC, e.last_name
    `);
    
    return stmt.all(startDate, endDate);
  } catch (error) {
    console.error('Error getting payroll summary:', error);
    throw error;
  }
}

markPayrollAsPaid(payrollId, paymentDate = null) {
  try {
    const date = paymentDate || new Date().toISOString().split('T')[0];
    const stmt = this.db.prepare(`
      UPDATE payroll 
      SET status = 'Paid', payment_date = ?
      WHERE id = ?
    `);
    
    const info = stmt.run(date, payrollId);
    return { changes: info.changes };
  } catch (error) {
    console.error('Error marking payroll as paid:', error);
    throw error;
  }
}

// Get payroll by employee and period
getPayrollByEmployeeAndPeriod(employeeId, year, month) {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const stmt = this.db.prepare(`
      SELECT * FROM payroll 
      WHERE employee_id = ? 
        AND period_start >= date(?) 
        AND period_end <= date(?)
    `);
    
    return stmt.get(employeeId, startDate, endDate);
  } catch (error) {
    console.error('Error getting payroll by employee and period:', error);
    throw error;
  }
}

// Get attendance for specific cutoff period
getAttendanceForCutoff(year, month, isFirstHalf) {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-${isFirstHalf ? '01' : '11'}`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${isFirstHalf ? '10' : '25'}`;
    
    const stmt = this.db.prepare(`
      SELECT 
        e.id as employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.salary as monthly_salary,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as days_present,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as days_absent,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as days_late,
        COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) as days_leave,
        COUNT(*) as total_recorded_days
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id 
        AND date(a.date) BETWEEN date(?) AND date(?)
      WHERE e.status = 'Active'
      GROUP BY e.id
      ORDER BY e.first_name, e.last_name
    `);
    
    return stmt.all(startDate, endDate);
  } catch (error) {
    console.error('Error getting attendance for cutoff:', error);
    throw error;
  }
}

// Process bi-monthly payroll
processBiMonthlyPayroll(payrollData) {
  try {
    const stmt = this.db.prepare(`
      INSERT INTO payroll (
        employee_id, period_start, period_end, basic_salary,
        allowances, deductions, net_salary, status, payment_date,
        cutoff_type, working_days, days_present, daily_rate, breakdown
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      payrollData.employee_id,
      payrollData.period_start,
      payrollData.period_end,
      payrollData.basic_salary,
      payrollData.allowances || 0,
      payrollData.deductions || 0,
      payrollData.net_salary,
      payrollData.status || 'Pending',
      payrollData.payment_date || null,
      payrollData.cutoff_type || 'First Half',
      payrollData.working_days || 12,
      payrollData.days_present || 12,
      payrollData.daily_rate || 0,
      JSON.stringify(payrollData.breakdown || {})
    );

    return { id: info.lastInsertRowid, changes: info.changes };
  } catch (error) {
    console.error('Error processing bi-monthly payroll:', error);
    throw error;
  }
}

// Get payroll by cutoff period
getPayrollByCutoff(year, month, cutoffType) {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-${cutoffType === 'First Half' ? '01' : '11'}`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${cutoffType === 'First Half' ? '10' : '25'}`;
    
    const stmt = this.db.prepare(`
      SELECT 
        p.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        e.salary as monthly_salary,
        d.name as department_name
      FROM payroll p
      INNER JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE p.period_start = date(?) AND p.period_end = date(?)
      ORDER BY e.last_name
    `);
    
    const result = stmt.all(startDate, endDate);
    
    // Add cutoff_type to results for backward compatibility
    return result.map(row => ({
      ...row,
      cutoff_type: row.cutoff_type || cutoffType
    }));
    
  } catch (error) {
    console.error('Error getting payroll by cutoff:', error);
    // Fallback to query without cutoff_type column
    const startDate = `${year}-${month.toString().padStart(2, '0')}-${cutoffType === 'First Half' ? '01' : '11'}`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${cutoffType === 'First Half' ? '10' : '25'}`;
    
    const stmt = this.db.prepare(`
      SELECT 
        p.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        e.salary as monthly_salary,
        d.name as department_name
      FROM payroll p
      INNER JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE p.period_start = date(?) AND p.period_end = date(?)
      ORDER BY e.last_name
    `);
    
    const result = stmt.all(startDate, endDate);
    
    // Add cutoff_type for backward compatibility
    return result.map(row => ({
      ...row,
      cutoff_type: cutoffType
    }));
  }
}

migrateDatabase() {
  try {
    // Check if new columns exist, if not add them
    const columns = this.db.prepare(`
      PRAGMA table_info(payroll)
    `).all();
    
    const columnNames = columns.map(col => col.name);

    // Add cutoff_type if it doesn't exist
    if (!columnNames.includes('cutoff_type')) {
      this.db.exec(`ALTER TABLE payroll ADD COLUMN cutoff_type TEXT DEFAULT 'Full Month'`);
      console.log('Added cutoff_type column to payroll table');
    }
    
    // Add working_days if it doesn't exist
    if (!columnNames.includes('working_days')) {
      this.db.exec(`ALTER TABLE payroll ADD COLUMN working_days INTEGER DEFAULT 24`);
      console.log('Added working_days column to payroll table');
    }
    
    // Add days_present if it doesn't exist
    if (!columnNames.includes('days_present')) {
      this.db.exec(`ALTER TABLE payroll ADD COLUMN days_present INTEGER DEFAULT 24`);
      console.log('Added days_present column to payroll table');
    }
    
    // Add daily_rate if it doesn't exist
    if (!columnNames.includes('daily_rate')) {
      this.db.exec(`ALTER TABLE payroll ADD COLUMN daily_rate REAL DEFAULT 0`);
      console.log('Added daily_rate column to payroll table');
    }
    
    // Add breakdown if it doesn't exist
    if (!columnNames.includes('breakdown')) {
      this.db.exec(`ALTER TABLE payroll ADD COLUMN breakdown TEXT`);
      console.log('Added breakdown column to payroll table');
    }

    // Check and migrate users table
    const usersColumns = this.db.prepare(`
      PRAGMA table_info(users)
    `).all();
    
    const usersColumnNames = usersColumns.map(col => col.name);
    
    // Add display_name if it doesn't exist
    if (!usersColumnNames.includes('display_name')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ''`);
      console.log('Added display_name column to users table');
    }
    
    // Add avatar if it doesn't exist
    if (!usersColumnNames.includes('avatar')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`);
      console.log('Added avatar column to users table');
    }
    
    // Add phone if it doesn't exist
    if (!usersColumnNames.includes('phone')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN phone TEXT`);
      console.log('Added phone column to users table');
    }
    
    // Add position if it doesn't exist
    if (!usersColumnNames.includes('position')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN position TEXT`);
      console.log('Added position column to users table');
    }
    
    // Add department if it doesn't exist
    if (!usersColumnNames.includes('department')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN department TEXT`);
      console.log('Added department column to users table');
    }
    
    // Add hire_date if it doesn't exist
    if (!usersColumnNames.includes('hire_date')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN hire_date DATE`);
      console.log('Added hire_date column to users table');
    }
    
    // Add bio if it doesn't exist
    if (!usersColumnNames.includes('bio')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN bio TEXT`);
      console.log('Added bio column to users table');
    }
    
    // Add theme_preference if it doesn't exist
    if (!usersColumnNames.includes('theme_preference')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN theme_preference TEXT DEFAULT 'light'`);
      console.log('Added theme_preference column to users table');
    }
    
    // Add language if it doesn't exist
    if (!usersColumnNames.includes('language')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'`);
      console.log('Added language column to users table');
    }


    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
  }
}

  // Generic query methods for IPC
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  execute(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseService;