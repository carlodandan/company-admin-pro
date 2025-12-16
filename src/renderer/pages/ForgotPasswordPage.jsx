import React, { useState } from 'react';
import { 
  Mail, Lock, Key, Shield, AlertCircle, 
  CheckCircle2, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = ({ onResetPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    super_admin_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showSuperPassword, setShowSuperPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (error) setError('');
  };

  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.super_admin_password) {
      errors.super_admin_password = 'Super Admin Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    if (!formData.new_password) {
      errors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirm_password) {
      errors.confirm_password = 'Please confirm your password';
    } else if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVerify = async (e) => {
  e.preventDefault();
  
  if (!validateStep1()) {
    return;
  }

  setIsLoading(true);
  setError('');
  setSuccess('');

  try {
    // Call the verifySuperAdminPassword API method
    const result = await window.electronAPI.verifySuperAdminPassword(
      formData.email,
      formData.super_admin_password
    );
    
    if (result.success) {
      setSuccess('Verification successful! You can now reset your password.');
      setStep(2);
    } else {
      setError(result.error || 'Verification failed. Please check your email and Super Admin Password.');
    }
  } catch (err) {
    setError('An unexpected error occurred');
    console.error('Verification error:', err);
  } finally {
    setIsLoading(false);
  }
};

  const handleReset = async (e) => {
  e.preventDefault();
  
  if (!validateStep2()) {
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    // Call the resetAdminPassword API method
    const result = await window.electronAPI.resetAdminPassword(
      formData.email,
      formData.super_admin_password,
      formData.new_password
    );
    
    if (result.success) {
      setSuccess('Password reset successful! You can now login with your new password.');
      // Clear form
      setFormData({
        email: '',
        super_admin_password: '',
        new_password: '',
        confirm_password: ''
      });
      setStep(1);
    } else {
      setError(result.error || 'Password reset failed');
    }
  } catch (err) {
    setError('An unexpected error occurred');
    console.error('Reset error:', err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-black p-3 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-xl mb-3">
            <Key className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Reset Admin Password</h1>
          <p className="text-xs text-gray-400">
            Requires Super Admin Password for verification
          </p>
        </div>

        {/* Back to Login */}
        <div className="mb-4">
          <Link 
            to="/login" 
            className="inline-flex items-center text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Login
          </Link>
        </div>

        {/* Reset Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50 p-4 shadow-xl">
          {step === 1 ? (
            /* Step 1: Verification */
            <form onSubmit={handleVerify} className="space-y-4">
              {/* Critical Warning */}
              <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">🔐 Super Admin Password Required</h3>
                    <p className="text-xs text-gray-400">
                      You must provide the Super Admin Password that was generated during registration. 
                      This password is tied to your registered email.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-gray-300">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-9 w-full py-2.5 bg-gray-900/50 border ${
                      formErrors.email ? 'border-red-500' : 'border-gray-700'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs transition-all duration-200`}
                    placeholder="admin@yourcompany.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-400 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Super Admin Password */}
              <div className="space-y-1.5">
                <label htmlFor="super_admin_password" className="block text-xs font-medium text-gray-300">
                  Super Admin Password *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    id="super_admin_password"
                    name="super_admin_password"
                    type={showSuperPassword ? "text" : "password"}
                    value={formData.super_admin_password}
                    onChange={handleInputChange}
                    className={`pl-9 pr-9 w-full py-2.5 bg-gray-900/50 border ${
                      formErrors.super_admin_password ? 'border-red-500' : 'border-gray-700'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs transition-all duration-200`}
                    placeholder="Enter Super Admin Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSuperPassword(!showSuperPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showSuperPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                {formErrors.super_admin_password && (
                  <p className="text-xs text-red-400 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formErrors.super_admin_password}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This is the password generated during registration (16 characters with symbols)
                </p>
              </div>

              {/* Reminder Notice */}
              <div className="p-2 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-medium text-white mb-0.5">Remember?</h3>
                    <p className="text-xs text-gray-400">
                      You were instructed to save this password securely during registration.
                      It cannot be recovered if lost.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div className="p-2 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <p className="text-red-400 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {error}
                </p>
                </div>
              )}

              {success && (
                <div className="p-2 bg-green-900/20 border border-green-800/50 rounded-lg">
                  <p className="text-green-400 text-xs flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-2" />
                    {success}
                  </p>
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg font-medium text-white bg-linear-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs"
              >
                {isLoading ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying Super Admin Password...
                  </>
                ) : (
                  'Verify & Proceed to Password Reset'
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Reset Password */
            <form onSubmit={handleReset} className="space-y-4">
              {/* Success Verification */}
              <div className="p-2 bg-green-900/20 border border-green-800/50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 text-green-400 mr-2" />
                  <div className="flex-1">
                    <p className="text-green-400 text-xs font-medium">✓ Verification Successful</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Email: <span className="text-gray-300">{formData.email}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="new_password" className="block text-xs font-medium text-gray-300">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    id="new_password"
                    name="new_password"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.new_password}
                    onChange={handleInputChange}
                    className={`pl-9 pr-9 w-full py-2.5 bg-gray-900/50 border ${
                      formErrors.new_password ? 'border-red-500' : 'border-gray-700'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs transition-all duration-200`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                {formErrors.new_password && (
                  <p className="text-xs text-red-400 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formErrors.new_password}
                  </p>
                )}
                {formData.new_password && (
                  <div className="text-xs text-gray-400 mt-1">
                    Password strength: {formData.new_password.length >= 8 ? '✓ Strong' : '⚠ Weak'}
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="block text-xs font-medium text-gray-300">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className={`pl-9 pr-9 w-full py-2.5 bg-gray-900/50 border ${
                      formErrors.confirm_password ? 'border-red-500' : 'border-gray-700'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs transition-all duration-200`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                {formErrors.confirm_password && (
                  <p className="text-xs text-red-400 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formErrors.confirm_password}
                  </p>
                )}
              </div>

              {/* Important Notice */}
              <div className="p-2 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-medium text-white mb-0.5">Security Note</h3>
                    <p className="text-xs text-gray-400">
                      Your Super Admin Password will remain unchanged. 
                      It's still required for future password resets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <p className="text-red-400 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {error}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-2 bg-green-900/20 border border-green-800/50 rounded-lg">
                  <p className="text-green-400 text-xs flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-2" />
                    {success}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 border border-gray-600 rounded-lg font-medium text-gray-300 hover:text-white hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-xs"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-4 border border-transparent rounded-lg font-medium text-white bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-gray-700/50 mt-4">
            <p className="text-xs text-gray-500">
              If you lost your Super Admin Password, contact system administrator.
              <br />
              <span className="text-red-400">⚠ Cannot be recovered through this system</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Secure Password Recovery System • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;