import { useCallback, useEffect, useState, useMemo } from 'react';
import './index.css';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Users, 
  Activity, 
  CreditCard,
  Home,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  X,
  BarChart3,
  DollarSign,
  Clock,
  UserCheck,
  UserX,
  FileText,
  Power
} from 'lucide-react';
import {
  addMeter,
  approvePasswordReset,
  blockUser,
  changePassword,
  deleteMeter,
  deleteOwnedMeter,
  deleteUser,
  getAdminMeters,
  getAdminTransactions,
  getAdminUsers,
  getStoredUser,
  getUserMeters,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  checkResetStatus,
  resetPassword,
  updateMeterUnits,
  updateUserProfile,
} from './services/apiService';
import PurchaseScreen from './components/PurchaseScreen';
import HistoryScreen from './components/HistoryScreen';
import ResetPasswordPage from './components/ResetPasswordPage';
import ConfirmationModal from './components/ConfirmationModal';
import type { ReactElement } from 'react';

type UserRole = 'ADMIN' | 'USER' | string;

type AuthUser = {
  userId?: number | string;
  email?: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  role?: UserRole;
};

export type Meter = {
  id?: number | string;
  meterNumber: string;
  currentUnits?: number;
  usedUnits?: number;
  active?: boolean;
};

const resolveDestination = (user: AuthUser | null) => {
  if (!user) return '/';
  return user.role === 'ADMIN' ? '/admin' : '/dashboard';
};

const App = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [drainingMeters, setDrainingMeters] = useState<Meter[]>([]);
  const [isLoadingMeters, setIsLoadingMeters] = useState(false);
  const [zeroedMeters, setZeroedMeters] = useState(new Set<string | number>());

  const fetchMeters = useCallback(
    async (userOverride?: AuthUser | null) => {
      const user = userOverride ?? currentUser;
      if (!user || user.role === 'ADMIN') {
        setMeters([]);
        setDrainingMeters([]);
        return;
      }
      setIsLoadingMeters(true);
      try {
        const userMeters = await getUserMeters();
        setMeters(userMeters);
        setDrainingMeters(userMeters); // Initialize both states
      } catch (error) {
        console.error('Failed to fetch meters', error);
        setMeters([]);
        setDrainingMeters([]);
      } finally {
        setIsLoadingMeters(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'USER') {
      fetchMeters(currentUser);
    } else {
      setMeters([]);
      setDrainingMeters([]);
    }
  }, [currentUser, fetchMeters]);

  // Global draining effect
  useEffect(() => {
    if (currentUser?.role !== 'USER' || drainingMeters.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setDrainingMeters((prev) =>
        prev.map((m) => {
          if (m.currentUnits === 0) return m; // Already zero, do nothing

          const newUnits = Math.max(0, (m.currentUnits ?? 0) - 0.002);
          
          if (newUnits === 0 && m.id && !zeroedMeters.has(m.id)) {
            const totalUsed = (m.usedUnits ?? 0) + (m.currentUnits ?? 0);
            updateMeterUnits(m.id, { currentUnits: 0, usedUnits: totalUsed });
            setZeroedMeters((prevSet) => new Set(prevSet).add(m.id!));
          }

          return {
            ...m,
            currentUnits: newUnits,
            usedUnits: (m.usedUnits ?? 0) + 0.002,
          };
        }),
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser, drainingMeters, zeroedMeters]);

  const handleLogout = async () => {
    // Persist the current state of draining meters before logging out
    if (drainingMeters.length > 0) {
      console.log('Saving meter states before logout...');
      const updatePromises = drainingMeters.map(meter => {
        if (meter.id) {
          return updateMeterUnits(meter.id, {
            currentUnits: meter.currentUnits ?? 0,
            usedUnits: meter.usedUnits ?? 0,
          });
        }
        return Promise.resolve(); // Should not happen if meters are loaded correctly
      });

      await Promise.allSettled(updatePromises);
      console.log('Finished saving meter states.');
    }

    // Proceed with original logout logic
    logoutUser();
    setCurrentUser(null);
    setMeters([]);
    setDrainingMeters([]);
    navigate('/', { replace: true });
  };

  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role !== 'ADMIN') {
      await fetchMeters(user);
    }
    navigate(resolveDestination(user), { replace: true });
  };

  if (isBootstrapping) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg-darkest)' }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage currentUser={currentUser} />} />
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to={resolveDestination(currentUser)} replace />
            ) : (
              <AuthScreen key="login" mode="login" onAuthenticated={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            currentUser ? (
              <Navigate to={resolveDestination(currentUser)} replace />
            ) : (
              <AuthScreen key="signup" mode="signup" onAuthenticated={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['USER']}>
              <DashboardScreen
                currentUser={currentUser as AuthUser}
                handleLogout={handleLogout}
                meters={drainingMeters} // Pass draining meters to dashboard
                isLoadingMeters={isLoadingMeters}
                onNavigateToPurchase={(meter) => navigate('/dashboard/purchase', { state: { meter } })}
                onNavigateToHistory={() => navigate('/dashboard/history')}
                onRefreshMeters={() => fetchMeters(currentUser)}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/purchase"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['USER']}>
              <PurchaseScreen
                meters={meters}
                onNavigateBack={() => navigate('/dashboard')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['USER']}>
              <HistoryScreen onNavigateBack={() => navigate('/dashboard')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['ADMIN']}>
              <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <div className="max-w-5xl mx-auto px-4 py-10">
                <SettingsScreen
                  currentUser={currentUser as AuthUser}
                  onUpdateSuccess={(updatedUser) => {
                    const newCurrentUser = { ...currentUser, ...updatedUser };
                    setCurrentUser(newCurrentUser);
                    localStorage.setItem('user', JSON.stringify(newCurrentUser));
                  }}
                />
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/reset-password" element={
          <div className="max-w-5xl mx-auto px-4 py-10">
            <ResetPasswordScreen />
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

interface AuthScreenProps {
  mode: 'login' | 'signup';
  onAuthenticated: (user: AuthUser) => void;
}

const AuthScreen = ({ mode, onAuthenticated }: AuthScreenProps) => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isAllowedToReset, setIsAllowedToReset] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isForgot) {
      return;
    }
    setError(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    try {
      if (mode === 'login') {
        const response = await loginUser({ email: data.email, password: data.password });
        toast.success(`Welcome back, ${response.user.fullName || response.user.email}!`);
        onAuthenticated(response.user as AuthUser);
      } else {
        await registerUser(data);
        toast.success('Account created successfully! Redirecting to login...');
        setSuccessMessage('Account created successfully! Please login to continue.');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || (mode === 'login' ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
      
      // Check if user is blocked
      if (errorMessage.toLowerCase().includes('blocked') || errorMessage.toLowerCase().includes('inactive')) {
        toast.error('Your account has been blocked. Please contact support.');
      } else {
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
      console.error(err);
    }
  };

  const toggleMode = () => {
    const nextPath = mode === 'login' ? '/signup' : '/login';
    navigate(nextPath);
  };

  useEffect(() => {
    let intervalId: number | undefined;
    if (isForgot && forgotEmail && !isAllowedToReset) {
      intervalId = window.setInterval(async () => {
        try {
          const allowed = await checkResetStatus(forgotEmail);
          if (allowed) {
            setIsAllowedToReset(true);
            if (intervalId) {
              window.clearInterval(intervalId);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isForgot, forgotEmail, isAllowedToReset]);

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!forgotEmail) return;
    setIsSendingReset(true);
    setError(null);
    try {
      await requestPasswordReset(forgotEmail);
      setSuccessMessage('Request sent to admin. Please wait for approval.');
      toast.success('Request sent successfully! Wait for admin approval to continue.', {
        duration: 6000, // 6 seconds for user to read
      });
    } catch (e) {
      console.error(e);
      setError('Failed to send reset request. Please try again.');
      toast.error('Failed to send reset request. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--gradient-dark)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(34, 197, 94, 0.08)' }}></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(34, 197, 94, 0.06)', animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-md mx-auto px-6 animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-green)' }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              SmartCashPower
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {isForgot ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isForgot 
              ? 'Enter your email to request a password reset' 
              : mode === 'login' 
                ? 'Sign in to manage your electricity' 
                : 'Join thousands managing their electricity smarter'}
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          {!isForgot ? (
            <>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Full Name
                      </label>
                      <input 
                        name="fullName" 
                        type="text" 
                        required 
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-lg transition-all"
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Phone Number
                      </label>
                      <input 
                        name="phoneNumber" 
                        type="tel" 
                        required 
                        placeholder="+250 XXX XXX XXX"
                        className="w-full px-4 py-3 rounded-lg transition-all"
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <input 
                    name="password" 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--gradient-green)',
                    color: 'white',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <CheckCircle className="w-5 h-5" />
                </button>
              </form>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="mt-4 text-sm font-medium transition-colors"
                  style={{ color: 'var(--green-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
                >
                  Forgot password?
                </button>
              )}

              <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button 
                  onClick={toggleMode} 
                  className="ml-2 font-medium transition-colors"
                  style={{ color: 'var(--green-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </>
          ) : (
            <>
              <form className="space-y-5" onSubmit={handleForgotSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    disabled={isSendingReset}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: 'var(--gradient-green)',
                    color: 'white',
                  }}
                >
                  {isSendingReset ? 'Sending...' : 'Send Reset Request'}
                </button>
              </form>

              <button
                type="button"
                disabled={!isAllowedToReset}
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(forgotEmail)}`)}
                className="mt-4 w-full px-4 py-3 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
                style={{
                  background: isAllowedToReset ? 'var(--green-primary)' : 'var(--bg-elevated)',
                  color: isAllowedToReset ? 'white' : 'var(--text-disabled)',
                  border: `1px solid ${isAllowedToReset ? 'var(--green-primary)' : 'var(--border-default)'}`,
                }}
              >
                {isAllowedToReset ? 'Continue to Reset Password' : 'Waiting for Admin Approval...'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  setError(null);
                  setSuccessMessage(null);
                  setForgotEmail('');
                  setIsAllowedToReset(false);
                }}
                className="mt-4 text-sm font-medium transition-colors"
                style={{ color: 'var(--green-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-light)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
              >
                ← Back to login
              </button>
            </>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium transition-colors inline-flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

interface DashboardScreenProps {
    currentUser: AuthUser;
    handleLogout: () => void;
    meters: Meter[];
    isLoadingMeters: boolean;
    onNavigateToPurchase: (meter?: Meter) => void;
    onNavigateToHistory: () => void;
    onRefreshMeters: () => void;
}

import MeterDetailModal from './components/MeterDetailModal';
import TransactionDetailModal from './components/TransactionDetailModal';

// ... (rest of the imports)

// ... (App component and other components)

const DashboardScreen = ({ currentUser, handleLogout, meters, isLoadingMeters, onNavigateToPurchase, onNavigateToHistory, onRefreshMeters }: DashboardScreenProps) => {
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [isAddingMeter, setIsAddingMeter] = useState(false);
  const [addMeterError, setAddMeterError] = useState<string | null>(null);
  const [addMeterSuccess, setAddMeterSuccess] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [meterSearch, setMeterSearch] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    meter: Meter | null;
  }>({ isOpen: false, meter: null });

  const filteredMeters = useMemo(() => {
    if (!meterSearch) return meters;
    return meters.filter(meter =>
      meter.meterNumber.toLowerCase().includes(meterSearch.toLowerCase())
    );
  }, [meters, meterSearch]);

  const handleAddMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeterNumber.trim()) {
      setAddMeterError('Please enter a meter number');
      return;
    }

    setIsAddingMeter(true);
    setAddMeterError(null);
    setAddMeterSuccess(false);

    try {
      await addMeter({ meterNumber: newMeterNumber.trim() });
      setAddMeterSuccess(true);
      setNewMeterNumber('');
      // Refresh meters list
      setTimeout(async () => {
        setShowAddMeter(false);
        setAddMeterSuccess(false);
        // Refetch meters instead of reloading page
        onRefreshMeters();
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add meter. Please try again.';
      setAddMeterError(message);
    } finally {
      setIsAddingMeter(false);
    }
  };

  const handlePurchaseRequest = (meter: Meter) => {
    setSelectedMeter(null); // Close the modal
    onNavigateToPurchase(meter); // Navigate to purchase screen with the selected meter
  };

  const handleRequestDeleteMeter = (meter: Meter) => {
    setSelectedMeter(null); // Close the detail modal
    setDeleteConfirmation({ isOpen: true, meter: meter });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.meter?.id) return;
    try {
      await deleteOwnedMeter(deleteConfirmation.meter.id);
      setDeleteConfirmation({ isOpen: false, meter: null });
      onRefreshMeters(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete meter:", error);
      // Optionally, show an error to the user
      setDeleteConfirmation({ isOpen: false, meter: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, meter: null });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-darkest)' }}>
      {/* Header */}
      <header className="p-6 mb-6" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {currentUser.fullName || currentUser.name || currentUser.email}!</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/settings" 
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <SettingsIcon className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
            </Link>
            <button 
              onClick={handleLogout} 
              className="px-4 py-3 rounded-lg font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
        {/* Add Meter Section */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>My Meters</h3>
            <button
              onClick={() => setShowAddMeter(!showAddMeter)}
              className="px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ 
                background: showAddMeter ? 'var(--bg-elevated)' : 'var(--gradient-green)', 
                color: showAddMeter ? 'var(--text-primary)' : 'white',
                border: showAddMeter ? '1px solid var(--border-default)' : 'none'
              }}
            >
              {showAddMeter ? 'Cancel' : '+ Add Meter'}
            </button>
          </div>

          {showAddMeter && (
            <form onSubmit={handleAddMeter} className="p-4 rounded-lg space-y-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <input
                type="text"
                value={newMeterNumber}
                onChange={(e) => setNewMeterNumber(e.target.value)}
                placeholder="Enter Meter Number"
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                disabled={isAddingMeter}
              />
              {addMeterError && <p className="text-sm" style={{ color: '#ef4444' }}>{addMeterError}</p>}
              {addMeterSuccess && <p className="text-sm" style={{ color: 'var(--green-primary)' }}>Meter added successfully!</p>}
              <button
                type="submit"
                disabled={isAddingMeter || !newMeterNumber.trim()}
                className="w-full px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{ background: 'var(--gradient-green)', color: 'white' }}
              >
                {isAddingMeter ? 'Adding...' : 'Add Meter'}
              </button>
            </form>
          )}

          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by meter number..."
              value={meterSearch}
              onChange={(e) => setMeterSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Meters List */}
          {isLoadingMeters ? (
            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Loading meters...</p>
          ) : filteredMeters.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMeters.map((meter) => (
                <button
                  key={meter.id ?? meter.meterNumber}
                  type="button"
                  onClick={() => setSelectedMeter(meter)}
                  className="p-5 rounded-xl text-left transition-all hover:scale-105"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-green)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-glow)' }}>
                      <Power className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
                    </div>
                    {meter.id && <p className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>ID: {meter.id}</p>}
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>METER NUMBER</p>
                  <p className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{meter.meterNumber}</p>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Units</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--green-primary)' }}>
                        {meter.currentUnits !== undefined ? `${meter.currentUnits.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>kWh</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>No meters found.</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {meterSearch ? `No meters match your search for "${meterSearch}".` : 'Add a meter to get started.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => onNavigateToPurchase()}
            disabled={meters.length === 0}
            className="px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--gradient-green)', color: 'white' }}
          >
            ⚡ Buy Electricity
          </button>
          <button
            onClick={onNavigateToHistory}
            className="px-6 py-4 rounded-xl font-semibold transition-all"
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-green)',
              color: 'var(--green-primary)'
            }}
          >
            📊 View History
          </button>
        </div>
      </div>

      {/* Modals */}
      <MeterDetailModal
        meter={selectedMeter}
        onClose={() => setSelectedMeter(null)}
        onPurchase={handlePurchaseRequest}
        onDelete={handleRequestDeleteMeter}
      />
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Meter"
        message={`Are you sure you want to delete meter ${deleteConfirmation.meter?.meterNumber}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
      />
    </div>
  );
};

const MeterCard = ({ meter, onClick }: { meter: Meter; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left p-6 bg-linear-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Meter Number</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{meter.meterNumber}</p>
        {meter.id && <p className="text-xs text-gray-400 mt-1">ID: {meter.id}</p>}
      </div>
      <div className="text-right ml-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Units</p>
        <p className="text-2xl font-bold text-green-600 mt-1">
          {meter.currentUnits !== undefined ? `${meter.currentUnits.toFixed(2)} kWh` : 'N/A'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Available</p>
      </div>
    </div>
  </button>
);

interface SettingsScreenProps {
  currentUser: AuthUser;
  onUpdateSuccess: (user: AuthUser) => void;
}

const SettingsScreen = ({ currentUser, onUpdateSuccess }: SettingsScreenProps) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(currentUser.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setIsSaving(true);
    try {
      let updated = false;
      // Update profile info if it has changed
      if (fullName !== currentUser.fullName || phoneNumber !== currentUser.phoneNumber) {
        const updatedUser = await updateUserProfile({ fullName, phoneNumber });
        onUpdateSuccess(updatedUser); // Update parent state
        updated = true;
      }

      // Change password if fields are filled
      if (currentPassword && newPassword) {
        await changePassword(currentPassword, newPassword);
        updated = true;
      }
      
      if(updated) {
        toast.success('Settings saved successfully');
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to save settings.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-darkest)' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="p-8 rounded-2xl space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Account Settings</h2>
          
          <form className="space-y-5" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
              
              <div className="space-y-4">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{
                  background: 'var(--gradient-green)',
                  color: 'white',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) {
      setError('Missing email.');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email, newPassword);
      setMessage('Password updated. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (e) {
      console.error(e);
      setError('Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Reset password</h2>
        <p className="text-sm text-gray-600 text-center">Set a new password for {email || 'your account'}.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {message && <p className="text-sm text-green-600 text-center">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Updating...' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface LandingPageProps {
  currentUser: AuthUser | null;
}

const LandingPage = ({ currentUser }: LandingPageProps) => {
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    if (currentUser) {
      navigate(resolveDestination(currentUser));
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Instant Purchases',
      description: 'Buy electricity tokens for any registered meter in just three simple steps. Fast, secure, and reliable.',
    },
    {
      icon: TrendingUp,
      title: 'Usage Analytics',
      description: 'Track your spending history and monitor token deliveries in real-time with detailed insights.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-level security with JWT authentication and encrypted transactions for complete peace of mind.',
    },
    {
      icon: Users,
      title: 'Multi-Meter Management',
      description: 'Register and manage multiple electricity meters from one centralized dashboard.',
    },
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description: 'Watch your electricity consumption in real-time with live meter updates and notifications.',
    },
    {
      icon: CreditCard,
      title: 'Flexible Payments',
      description: 'Multiple payment options including mobile money for convenient and instant transactions.',
    },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ background: 'var(--gradient-dark)' }}>
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg" style={{ background: 'rgba(13, 13, 13, 0.8)', borderBottom: '1px solid var(--border-subtle)' }}>
        <nav className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-green)' }}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                SmartCashPower
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('cta')}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Get Started
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <button
                  onClick={handlePrimaryAction}
                  className="px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'var(--gradient-green)',
                    color: 'white',
                  }}
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'var(--gradient-green)',
                      color: 'white',
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative px-6 py-20 md:py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(34, 197, 94, 0.1)' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(34, 197, 94, 0.08)', animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ border: '1px solid var(--border-green)', background: 'rgba(34, 197, 94, 0.1)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--green-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--green-light)' }}>
                Smart Utility Management
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-center mb-6 animate-fade-in" style={{ color: 'var(--text-primary)', animationDelay: '0.1s' }}>
            Power Your Home
            <br />
            <span className="text-gradient-green">
              The Smart Way
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-12 animate-fade-in" style={{ color: 'var(--text-secondary)', animationDelay: '0.2s' }}>
            Buy electricity tokens, monitor meters, and keep every transaction at your fingertips. 
            SmartCashPower brings the full experience to web and mobile.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handlePrimaryAction}
              className="group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: 'var(--gradient-green)',
                color: 'white',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {currentUser ? 'Go to Dashboard' : 'Get Started'}
              <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>

            {!currentUser && (
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: 'var(--green-primary)',
                  color: 'var(--green-primary)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--green-primary)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--green-primary)';
                }}
              >
                Create Account
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Transactions', value: '50K+' },
              { label: 'Uptime', value: '99.9%' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--green-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20" style={{ background: 'var(--bg-darker)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything You Need
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Powerful features designed for modern electricity management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    animationDelay: `${index * 0.1}s`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-green)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-green)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="px-6 py-20" style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #15803d 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Join thousands of users managing their electricity smarter
          </p>
          <button
            onClick={handlePrimaryAction}
            className="px-10 py-5 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
            style={{
              background: 'var(--gradient-green)',
              color: 'white',
              boxShadow: 'var(--shadow-green)',
            }}
          >
            {currentUser ? 'Go to Dashboard' : 'Start Free Today'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ background: 'var(--bg-darkest)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto text-center" style={{ color: 'var(--text-muted)' }}>
          <p>© 2024 SmartCashPower. Built with ❤️ for a smarter energy future.</p>
        </div>
      </footer>
    </div>
  );
};

interface ProtectedRouteProps {
  currentUser: AuthUser | null;
  allowedRoles?: UserRole[];
  children: ReactElement;
}

const ProtectedRoute = ({ currentUser, allowedRoles, children }: ProtectedRouteProps) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!currentUser.role || !allowedRoles.includes(currentUser.role))) {
    return <Navigate to={resolveDestination(currentUser)} replace />;
  }

  return children;
};

interface AdminDashboardProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

// ... imports
import {
  // ... other imports
  getPendingResets,
  unblockUser,
  // ... other imports
} from './services/apiService';
// ...

const AdminDashboard = ({ currentUser, onLogout }: AdminDashboardProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allMeters, setAllMeters] = useState<any[]>([]);
  const [pendingResets, setPendingResets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'meters' | 'transactions' | 'resets' | 'settings'>('overview');

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [meterSearch, setMeterSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');

  // State for modals
  const [deleteConfirmationProps, setDeleteConfirmationProps] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [statusConfirmationProps, setStatusConfirmationProps] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm' });
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, txData, resetsData, metersData] = await Promise.all([
        getAdminUsers(),
        getAdminTransactions(new Date(0).toISOString(), new Date().toISOString()),
        getPendingResets(),
        getAdminMeters(),
      ]);
      setUsers(usersData ?? []);
      setTransactions(txData ?? []);
      setPendingResets(resetsData ?? []);
      setAllMeters(metersData ?? []);
    } catch (e) {
      console.error(e);
      setError('Failed to load admin data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Memoized filtering
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    return users.filter(u =>
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const filteredMeters = useMemo(() => {
    if (!meterSearch) return allMeters;
    return allMeters.filter(m =>
      m.meterNumber?.toLowerCase().includes(meterSearch.toLowerCase()) ||
      m.ownerFullName?.toLowerCase().includes(meterSearch.toLowerCase())
    );
  }, [allMeters, meterSearch]);

  const filteredTransactions = useMemo(() => {
    if (!transactionSearch) return transactions;
    return transactions.filter(tx =>
      tx.meterNumber?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      tx.userFullName?.toLowerCase().includes(transactionSearch.toLowerCase())
    );
  }, [transactions, transactionSearch]);

  const activeUsers = users.length;
  const metersMonitored = allMeters.length;
  const pendingTickets = transactions.filter((t) => t.status && t.status !== 'SUCCESS' && t.status !== 'COMPLETED').length;
  
  const handleCancelConfirmation = () => {
    setDeleteConfirmationProps({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    setStatusConfirmationProps({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm' });
  };
  
  const handleBlockUser = async (userId: number | string) => {
    try {
      await blockUser(userId);
      toast.success('User blocked successfully');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: false } : u)));
      handleCancelConfirmation();
    } catch (e) {
      console.error(e);
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: number | string) => {
    try {
      await unblockUser(userId);
      toast.success('User unblocked successfully');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: true } : u)));
      handleCancelConfirmation();
    } catch (e) {
      console.error(e);
      toast.error('Failed to unblock user');
    }
  };
  
  const handleDeleteUser = (userId: number | string) => {
    setDeleteConfirmationProps({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          toast.success('User deleted successfully');
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          handleCancelConfirmation();
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const handleRequestStatusChange = (user: any) => {
    if (user.active) {
      setStatusConfirmationProps({
        isOpen: true,
        title: 'Change User Status',
        message: `Are you sure you want to block ${user.fullName || user.email}?`,
        onConfirm: () => handleBlockUser(user.id),
        confirmText: 'Block',
      });
    } else {
      setStatusConfirmationProps({
        isOpen: true,
        title: 'Change User Status',
        message: `Are you sure you want to unblock ${user.fullName || user.email}?`,
        onConfirm: () => handleUnblockUser(user.id),
        confirmText: 'Unblock',
      });
    }
  };

  const handleDeleteMeter = (meterId: number | string) => {
    setDeleteConfirmationProps({
      isOpen: true,
      title: 'Delete Meter',
      message: 'Are you sure you want to delete this meter?',
      onConfirm: async () => {
        try {
          await deleteMeter(meterId);
          toast.success('Meter deleted successfully');
          setAllMeters((prev) => prev.filter((m) => m.id !== meterId));
          handleCancelConfirmation();
        } catch (e) {
          console.error(e);
          toast.error('Failed to delete meter');
        }
      },
    });
  };

  const handleApproveReset = async (userId: number | string) => {
    try {
      await approvePasswordReset(userId);
      toast.success('Password reset approved');
      setPendingResets((prev) => prev.filter((r) => r.id !== userId));
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve reset');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-darkest)' }}>
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border-default)' }}>
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-green)' }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('overview')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                background: activeTab === 'overview' ? 'var(--green-glow)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--green-primary)' : 'var(--text-secondary)',
              }}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                background: activeTab === 'users' ? 'var(--green-glow)' : 'transparent',
                color: activeTab === 'users' ? 'var(--green-primary)' : 'var(--text-secondary)',
              }}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Users</span>
            </button>
            <button
              onClick={() => setActiveTab('meters')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                background: activeTab === 'meters' ? 'var(--green-glow)' : 'transparent',
                color: activeTab === 'meters' ? 'var(--green-primary)' : 'var(--text-secondary)',
              }}
            >
              <Power className="w-5 h-5" />
              <span className="font-medium">Meters</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                background: activeTab === 'transactions' ? 'var(--green-glow)' : 'transparent',
                color: activeTab === 'transactions' ? 'var(--green-primary)' : 'var(--text-secondary)',
              }}
            >
              <DollarSign className="w-5 h-5" />
              <span className="font-medium">Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab('resets')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                background: activeTab === 'resets' ? 'var(--green-glow)' : 'transparent',
                color: activeTab === 'resets' ? 'var(--green-primary)' : 'var(--text-secondary)',
              }}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Password Resets</span>
            </button>
          </nav>

          {/* Logout Button */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                color: 'white',
              }}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Welcome back, {currentUser?.fullName || currentUser?.email}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Monitor transactions, manage users, and keep the grid running smoothly.
            </p>
          </div>
          
          {/* Profile Settings Icon */}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: activeTab === 'settings' ? 'var(--green-glow)' : 'var(--bg-card)',
              border: '1px solid var(--border-default)',
            }}
          >
            <SettingsIcon className="w-6 h-6" style={{ color: activeTab === 'settings' ? 'var(--green-primary)' : 'var(--text-secondary)' }} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p className="font-bold" style={{ color: '#ef4444' }}>Failed to load admin data</p>
            <p style={{ color: '#f87171' }}>Please ensure you are logged in as an Administrator.</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              {/* Active Users Card */}
              <div className="p-6 rounded-2xl transition-all hover:scale-105" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                    <Users className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
                  </div>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Active Users</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeUsers}</p>
              </div>

              {/* Meters Monitored Card */}
              <div className="p-6 rounded-2xl transition-all hover:scale-105" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <Power className="w-6 h-6" style={{ color: '#3b82f6' }} />
                  </div>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Meters Monitored</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{metersMonitored}</p>
              </div>

              {/* Pending Tickets Card */}
              <div className="p-6 rounded-2xl transition-all hover:scale-105" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                    <AlertCircle className="w-6 h-6" style={{ color: '#eab308' }} />
                  </div>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Pending Tickets</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{pendingTickets}</p>
              </div>

              {/* Password Reset Requests Card */}
              <div className="p-6 rounded-2xl transition-all hover:scale-105" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                    <FileText className="w-6 h-6" style={{ color: '#a855f7' }} />
                  </div>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Password Resets</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{pendingResets.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {isLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>User</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Email</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Meters</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                      <th className="text-right px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-6 py-4" style={{ color: 'var(--text-primary)' }}>{u.fullName || '—'}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{u.meterCount ?? 0}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleRequestStatusChange(u)}
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: u.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                              color: u.active ? 'var(--green-primary)' : '#eab308',
                            }}
                          >
                            {u.active ? 'Active' : 'Blocked'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-sm font-semibold transition-colors"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Meters Tab */}
        {activeTab === 'meters' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search meters by number or owner..."
                value={meterSearch}
                onChange={(e) => setMeterSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {isLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Meter Number</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Owner</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                      <th className="text-right px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeters.map((m) => (
                      <tr key={m.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-6 py-4" style={{ color: 'var(--text-primary)' }}>{m.meterNumber}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{m.ownerFullName || 'N/A'}</td>
                        <td className="px-6 py-4" style={{ color: m.active ? 'var(--green-primary)' : 'var(--text-muted)' }}>
                          {m.active ? 'Active' : 'Inactive'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteMeter(m.id)}
                            className="text-sm font-semibold transition-colors"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search transactions by meter or user..."
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {isLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTransactions.map((tx) => (
                  <button
                    key={tx.transactionId}
                    onClick={() => setSelectedTransaction(tx)}
                    className="w-full text-left flex items-center justify-between p-4 rounded-xl transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-green)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{tx.meterNumber}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{tx.amountPaid} RWF</p>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? 'var(--green-primary)' :
                                 tx.status === 'FAILED' ? '#ef4444' : '#eab308'
                        }}
                      >
                        {tx.status || 'N/A'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Password Resets Tab */}
        {activeTab === 'resets' && (
          <div className="space-y-6">
            {isLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            ) : pendingResets.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>User</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Email</th>
                      <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Requested At</th>
                      <th className="text-right px-6 py-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingResets.map((r) => (
                      <tr key={r.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-6 py-4" style={{ color: 'var(--text-primary)' }}>{r.fullName || '—'}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{r.email}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleApproveReset(r.id)}
                            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                            style={{ background: 'var(--gradient-green)', color: 'white' }}
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No pending password reset requests.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="p-8 rounded-2xl space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Account Settings</h2>
              
              <form className="space-y-5" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const fullName = formData.get('fullName') as string;
                const phoneNumber = formData.get('phoneNumber') as string;
                const currentPassword = formData.get('currentPassword') as string;
                const newPassword = formData.get('newPassword') as string;
                const confirmPassword = formData.get('confirmPassword') as string;
                
                try {
                  if (newPassword && newPassword !== confirmPassword) {
                    toast.error('New password and confirmation do not match.');
                    return;
                  }
                  
                  let updated = false;
                  
                  if (fullName !== currentUser?.fullName || phoneNumber !== currentUser?.phoneNumber) {
                    await updateUserProfile({ fullName, phoneNumber });
                    updated = true;
                  }
                  
                  if (currentPassword && newPassword) {
                    await changePassword(currentPassword, newPassword);
                    updated = true;
                    (e.target as HTMLFormElement).reset();
                  }
                  
                  if (updated) {
                    toast.success('Settings saved successfully');
                    loadData();
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to save settings');
                }
              }}>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-muted)',
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                  <input
                    name="fullName"
                    type="text"
                    defaultValue={currentUser?.fullName || ''}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
                  <input
                    name="phoneNumber"
                    type="tel"
                    defaultValue={currentUser?.phoneNumber || ''}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                
                <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
                  
                  <div className="space-y-4">
                    <input
                      name="currentPassword"
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    
                    <input
                      name="newPassword"
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: 'var(--gradient-green)',
                    color: 'white',
                  }}
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={deleteConfirmationProps.isOpen}
        title={deleteConfirmationProps.title}
        message={deleteConfirmationProps.message}
        onConfirm={deleteConfirmationProps.onConfirm}
        onCancel={handleCancelConfirmation}
        confirmText="Delete"
      />
      <ConfirmationModal
        isOpen={statusConfirmationProps.isOpen}
        title={statusConfirmationProps.title}
        message={statusConfirmationProps.message}
        onConfirm={statusConfirmationProps.onConfirm}
        onCancel={handleCancelConfirmation}
        confirmText={statusConfirmationProps.confirmText}
      />
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};


export default App;