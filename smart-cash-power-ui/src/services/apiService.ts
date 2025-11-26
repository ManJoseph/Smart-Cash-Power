import axios from 'axios';

// 1. Axios Setup: Create a default Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

const AUTH_HEADER_STORAGE_KEY = 'scpAuthHeader';

const buildBasicHeader = (email: string, password: string) => `Basic ${btoa(`${email}:${password}`)}`;

const setAuthHeader = (headerValue: string | null) => {
  if (headerValue) {
    api.defaults.headers.common['Authorization'] = headerValue;
    localStorage.setItem(AUTH_HEADER_STORAGE_KEY, headerValue);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
  }
};

const storedHeader = localStorage.getItem(AUTH_HEADER_STORAGE_KEY);
if (storedHeader) {
  setAuthHeader(storedHeader);
}

// Automatically expire sessions on 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
      delete api.defaults.headers.common['Authorization'];
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
    // Server responded with error status
    const message = error.response.data?.message || error.response.data || 'An error occurred. Please try again.';
    throw new Error(message);
  } else if (error.request) {
    // Request made but no response
    throw new Error('Unable to connect to server. Please check your connection.');
  } else {
    // Something else happened
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
    // Return in the format expected by frontend
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
    const basicHeader = buildBasicHeader(loginData.email, loginData.password);
    setAuthHeader(basicHeader);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
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
    // Return empty array instead of throwing to prevent UI crashes
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
export const initiatePurchase = async (request: TransactionInitiationRequest): Promise<TransactionResponse> => {
  try {
    const response = await api.post('/transactions/purchase', request);
    return response.data;
  } catch (error: any) {
    console.error('Purchase initiation failed:', error);
    handleApiError(error);
  }
};

// 9. getTransactionHistory()
export const getTransactionHistory = async (): Promise<TransactionResponse[]> => {
  try {
    const response = await api.get('/transactions/history');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get transaction history:', error);
    // Return empty array instead of throwing to prevent UI crashes
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

export const approvePasswordReset = async (userId: number | string) => {
  try {
    await api.post(`/admin/password-resets/${userId}/approve`);
  } catch (error: any) {
    console.error('Failed to approve password reset:', error);
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


export default api;