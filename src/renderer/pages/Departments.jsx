import React, { useState, useEffect } from 'react';
import { Plus, Building, Users, PhilippinePeso, Loader2, Edit, Trash2 } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', budget: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Departments component mounted, loading data...');
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      console.log('Loading departments...');
      setLoading(true);
      setError(null);
      const data = await window.electronAPI.getAllDepartments();
      console.log('Departments loaded:', data);
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Failed to load departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.budget) {
      alert('Please fill in all fields');
      return;
    }

    const budgetValue = parseFloat(newDepartment.budget);
    if (isNaN(budgetValue) || budgetValue < 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating department:', newDepartment);
      const result = await window.electronAPI.createDepartment({
        name: newDepartment.name.trim(),
        budget: budgetValue
      });
      
      console.log('Department created result:', result);
      
      // Reset form
      setNewDepartment({ name: '', budget: '' });
      setShowAddModal(false);
      
      // Force a fresh reload
      await loadDepartments();
      
      alert('Department added successfully!');
    } catch (error) {
      console.error('Error adding department:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setError(`Error adding department: ${errorMessage}`);
      alert(`Error adding department: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      console.log('Deleting department ID:', id);
      await window.electronAPI.deleteDepartment(id);
      console.log('Department deleted, reloading list...');
      await loadDepartments();
      alert('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert(`Error deleting department: ${error.message || 'Unknown error'}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleEditDepartment = (dept) => {
    // You can implement edit functionality here
    alert(`Edit functionality for ${dept.name} would go here`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage company departments and budgets</p>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          {isSubmitting ? 'Adding...' : 'Add Department'}
        </button>
      </div>
      {/* Departments Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Yet</h3>
          <p className="text-gray-600 mb-4">Add your first department to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{dept.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditDepartment(dept)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit size={16} className="text-blue-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhilippinePeso size={16} className="text-green-600" />
                    <span className="text-sm text-gray-600">Annual Budget</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(dept.budget)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-600">Employees</span>
                  </div>
                  <span className="font-bold text-gray-900">{dept.employee_count || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Salary</span>
                  <span className="font-bold text-gray-900">{formatCurrency(dept.avg_salary || 0)}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Created: {new Date(dept.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-950/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Department</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Engineering"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Budget *
                  </label>
                  <input
                    type="number"
                    value={newDepartment.budget}
                    onChange={(e) => setNewDepartment({...newDepartment, budget: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 500000"
                    min="0"
                    step="1000"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (!isSubmitting) {
                      setShowAddModal(false);
                      setNewDepartment({ name: '', budget: '' });
                    }
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDepartment}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;