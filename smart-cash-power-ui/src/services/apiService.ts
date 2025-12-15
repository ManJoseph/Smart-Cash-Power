import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

const AUTH_TOKEN_KEY = 'scp-auth-token';

// 2. setAuthHeader(token)
const setAuthHeader = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

// On initial load, try to load the token from local storage
const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
if (storedToken) {
  setAuthHeader(storedToken);
}

// Automatically handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear user data and redirect to login
      setAuthHeader(null);
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Error handler to provide user-friendly messages
const handleApiError = (error: any): never => {
  if (error.response) {
    const message = error.response.data?.message || error.response.data || 'An error occurred. Please try again.';
    throw new Error(message);
  } else if (error.request) {
    throw new Error('Unable to connect to server. Please check your connection.');
  } else {
    throw new Error('An unexpected error occurred. Please try again.');
  }
};

export interface LoginResponse {
  token: string;
  user: {
    userId?: number | string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    role?: string;
    createdAt?: string;
  };
}

// 3. registerUser(registrationData)
export const registerUser = async (registrationData: any) => {
  try {
    const response = await api.post('/auth/register', registrationData);
    return {
      user: {
        userId: response.data.userId,
        email: response.data.email,
        fullName: response.data.fullName,
        phoneNumber: response.data.phoneNumber,
        role: response.data.role,
        createdAt: response.data.createdAt,
      }
    };
  } catch (error: any) {
    console.error('Registration failed:', error);
    handleApiError(error);
  }
};

// 4. loginUser(email, password)
export const loginUser = async (loginData: { email: string; password: string }): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', loginData);
    const { token, user } = response.data;
    
    setAuthHeader(token);
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error);
    handleApiError(error);
  }
};

// 5. logoutUser()
export const logoutUser = () => {
  setAuthHeader(null);
  localStorage.removeItem('user');
  // Redirect to login page to ensure clean state
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Function to get user from local storage
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};


// 6. getUserMeters()
export const getUserMeters = async () => {
  try {
    const response = await api.get('/meters');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get user meters:', error);
    return [];
  }
};

// 7. addMeter(meterNumber)
export const addMeter = async (meterData: { meterNumber: string }) => {
  try {
    const response = await api.post('/meters', meterData);
    return response.data;
  } catch (error) {
    console.error('Failed to add meter:', error);
    handleApiError(error);
  }
};

// 8. initiatePurchase(request)
export const initiatePurchase = async (request: any): Promise<any> => {
  try {
    const response = await api.post('/transactions/purchase', request);
    return response.data;
  } catch (error: any) {
    console.error('Purchase initiation failed:', error);
    handleApiError(error);
  }
};

// 9. getTransactionHistory()
export const getTransactionHistory = async (): Promise<any[]> => {
  try {
    const response = await api.get('/transactions/history');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get transaction history:', error);
    return [];
  }
};

// Admin APIs
export const getAdminUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to load admin users:', error);
    handleApiError(error);
  }
};

export const getAdminTransactions = async (startIso: string, endIso: string) => {
  try {
    const response = await api.get('/admin/reports/transactions', {
      params: { startDate: startIso, endDate: endIso },
    });
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to load admin transactions:', error);
    handleApiError(error);
  }
};

export const blockUser = async (userId: number | string) => {
  try {
    await api.post(`/admin/users/${userId}/block`);
  } catch (error: any) {
    console.error('Failed to block user:', error);
    handleApiError(error);
  }
};

export const unblockUser = async (userId: number | string) => {
  try {
    await api.post(`/admin/users/${userId}/unblock`);
  } catch (error: any) {
    console.error('Failed to unblock user:', error);
    handleApiError(error);
  }
};

export const deleteUser = async (userId: number | string) => {
  try {
    await api.delete(`/admin/users/${userId}`);
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    handleApiError(error);
  }
};

export const getAdminMeters = async () => {
  try {
    const response = await api.get('/admin/meters');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to load admin meters:', error);
    handleApiError(error);
  }
};

export const deleteMeter = async (meterId: number | string) => {
  try {
    await api.delete(`/admin/meters/${meterId}`);
  } catch (error: any) {
    console.error('Failed to delete meter:', error);
    handleApiError(error);
  }
};

export const deleteOwnedMeter = async (meterId: number | string) => {
  try {
    await api.delete(`/meters/${meterId}`);
  } catch (error: any) {
    console.error('Failed to delete meter:', error);
    handleApiError(error);
  }
};

export const approvePasswordReset = async (userId: number | string) => {
  try {
    await api.post(`/admin/password-resets/${userId}/approve`);
  } catch (error: any) {
    console.error('Failed to approve password reset:', error);
    handleApiError(error);
  }
};

export const getPendingResets = async () => {
  try {
    const response = await api.get('/admin/password-resets');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get pending resets:', error);
    handleApiError(error);
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    await api.post('/auth/forgot-password', { email });
  } catch (error: any) {
    console.error('Failed to request password reset:', error);
    handleApiError(error);
  }
};

export const checkResetStatus = async (email: string) => {
  try {
    const response = await api.get('/auth/reset-status', { params: { email } });
    return Boolean(response.data?.allowed);
  } catch (error: any) {
    console.error('Failed to check reset status:', error);
    handleApiError(error);
  }
};

export const resetPassword = async (email: string, newPassword: string) => {
  try {
    await api.post('/auth/reset-password', { email, newPassword });
  } catch (error: any) {
    console.error('Failed to reset password:', error);
    handleApiError(error);
  }
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  } catch (error: any) {
    console.error('Failed to change password:', error);
    handleApiError(error);
  }
};

export const updateUserProfile = async (data: { fullName: string, phoneNumber: string }) => {
  try {
    const response = await api.put('/auth/profile', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    handleApiError(error);
  }
};

export const updateMeterUnits = async (meterId: number | string, data: { currentUnits: number; usedUnits: number }) => {
  try {
    await api.put(`/meters/${meterId}/units`, data);
  } catch (error: any) {
    console.error(`Failed to update units for meter ${meterId}:`, error);
    handleApiError(error);
  }
};


export default api;