import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    email: '',
    displayName: '',
    avatar: '',
    position: '',
    department: '',
    role: '',
    loading: true
  });

  useEffect(() => {
    loadUserProfile();
    
    // Listen for profile updates from Settings page
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        setUser(prev => ({
          ...prev,
          displayName: event.detail.displayName || prev.displayName,
          avatar: event.detail.avatar || prev.avatar,
          email: event.detail.email || prev.email,
          position: event.detail.position || prev.position,
          department: event.detail.department || prev.department
        }));
      }
    };
    
    // Listen for avatar updates
    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatar) {
        setUser(prev => ({
          ...prev,
          avatar: event.detail.avatar
        }));
      }
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      // Try to get the currently logged-in user email from session
      // You might need to adjust this based on how you store the current user session
      const currentUserEmail = getCurrentUserEmail();
      
      if (!currentUserEmail) {
        console.warn('No current user email found, using default');
        setUser(prev => ({ 
          ...prev, 
          email: 'admin@company.com',
          displayName: 'Administrator',
          loading: false 
        }));
        return;
      }

      // Load user from database
      const userData = await window.electronAPI.getUserSettings(currentUserEmail);
      
      if (userData) {
        setUser({
          email: userData.email || currentUserEmail,
          displayName: userData.displayName || 'Administrator',
          avatar: userData.avatar || '',
          position: userData.position || 'System Administrator',
          department: userData.department || 'IT Department',
          role: 'Admin',
          loading: false
        });
      } else {
        // User doesn't exist in database, create default profile
        setUser({
          email: currentUserEmail,
          displayName: currentUserEmail.split('@')[0],
          avatar: '',
          position: 'System Administrator',
          department: 'IT Department',
          role: 'Admin',
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading user profile from database:', error);
      setUser({
        email: 'admin@company.com',
        displayName: 'Administrator',
        avatar: '',
        position: 'System Administrator',
        department: 'IT Department',
        role: 'Admin',
        loading: false
      });
    }
  };

  // Helper function to get current user email
  // You'll need to implement this based on your auth system
  const getCurrentUserEmail = () => {
    // Example: Get from session storage (if you use it)
    // return sessionStorage.getItem('currentUserEmail');
    
    // For now, return a default or implement your auth logic
    return 'admin@company.com';
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};