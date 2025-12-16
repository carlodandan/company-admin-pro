class DatabaseService {
  // Employee operations
  static async getAllEmployees() {
    if (!window.electronAPI) {
      return [];
    }
    return window.electronAPI.getAllEmployees();
  }

  static async getEmployeeById(id) {
    if (!window.electronAPI) {
      return null;
    }
    return window.electronAPI.getEmployeeById(id);
  }

  static async createEmployee(employeeData) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.createEmployee(employeeData);
  }

  static async updateEmployee(id, employeeData) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.updateEmployee(id, employeeData);
  }

  static async deleteEmployee(id) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.deleteEmployee(id);
  }

  // Department operations
  static async getAllDepartments() {
    if (!window.electronAPI) {
      return [];
    }
    return window.electronAPI.getAllDepartments();
  }

  // Attendance operations
  static async getTodayAttendance() {
    if (!window.electronAPI) {
      return [];
    }
    return window.electronAPI.getTodayAttendance();
  }

  static async recordAttendance(attendanceData) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.recordAttendance(attendanceData);
  }

  // Payroll operations
  static async processPayroll(payrollData) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.processPayroll(payrollData);
  }

  static async getAllPayroll() {
    if (!window.electronAPI) {
      return [];
    }
    return window.electronAPI.getAllPayroll();
  }

  // Database operations
  static async query(sql, params) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.query(sql, params);
  }

  static async execute(sql, params) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.execute(sql, params);
  }

  static async backupDatabase() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.backupDatabase();
  }
}

export default DatabaseService;