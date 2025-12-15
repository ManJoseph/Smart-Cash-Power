import { useCallback, useEffect, useState, useMemo } from 'react';
import './index.css';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-10">
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
                <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-6">
                  <PurchaseScreen
                    meters={meters} // Pass canonical meters to purchase screen
                    onNavigateBack={() => navigate('/dashboard')}
                  />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={['USER']}>
                <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-6">
                  <HistoryScreen onNavigateBack={() => navigate('/dashboard')} />
                </div>
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
                <SettingsScreen
                  currentUser={currentUser as AuthUser}
                  onUpdateSuccess={(updatedUser) => {
                    const newCurrentUser = { ...currentUser, ...updatedUser };
                    setCurrentUser(newCurrentUser);
                    localStorage.setItem('user', JSON.stringify(newCurrentUser));
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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
        onAuthenticated(response.user as AuthUser);
      } else {
        await registerUser(data);
        setSuccessMessage('Account created successfully! Please login to continue.');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || (mode === 'login' ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
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
    } catch (e) {
      console.error(e);
      setError('Failed to send reset request. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-800">SmartCashPower</h1>
        <p className="text-gray-600">Smarter electricity for homes and businesses.</p>
      </header>
      {!isForgot ? (
        <>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <input name="fullName" type="text" required className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name" />
                <input name="phoneNumber" type="tel" required className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone Number" />
              </>
            )}
            <input name="email" type="email" required className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" />
            <input name="password" type="password" required className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
            {error && <p className="text-red-500 text-center">{error}</p>}
            {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {mode === 'login' ? 'Login' : 'Sign Up'}
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
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </button>
          )}
          <div className="text-center">
            <button onClick={toggleMode} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500">
              {mode === 'login' ? 'New user? Create an account' : 'Already have an account? Login'}
            </button>
          </div>
        </>
      ) : (
        <>
          <form className="space-y-4" onSubmit={handleForgotSubmit}>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-center">{error}</p>}
            {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}
            <button
              type="submit"
              disabled={isSendingReset}
              className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSendingReset ? 'Sending...' : 'Send reset request'}
            </button>
          </form>
          <button
            type="button"
            disabled={!isAllowedToReset}
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(forgotEmail)}`)}
            className={`mt-4 w-full px-4 py-3 font-semibold rounded-lg ${
              isAllowedToReset ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setIsForgot(false);
              setError(null);
              setSuccessMessage(null);
            }}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Back to login
          </button>
        </>
      )}
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
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {currentUser.fullName || currentUser.name || currentUser.email}!</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/settings" className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Logout
          </button>
        </div>
      </header>

      {/* Add Meter Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">My Meters</h3>
          <button
            onClick={() => setShowAddMeter(!showAddMeter)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {showAddMeter ? 'Cancel' : '+ Add Meter'}
          </button>
        </div>

        {showAddMeter && (
          <form onSubmit={handleAddMeter} className="p-4 bg-blue-50 rounded-lg space-y-3">
            <input
              type="text"
              value={newMeterNumber}
              onChange={(e) => setNewMeterNumber(e.target.value)}
              placeholder="Enter Meter Number"
              className="w-full px-4 py-2 text-gray-700 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAddingMeter}
            />
            {addMeterError && <p className="text-red-500 text-sm">{addMeterError}</p>}
            {addMeterSuccess && <p className="text-green-600 text-sm">Meter added successfully!</p>}
            <button
              type="submit"
              disabled={isAddingMeter || !newMeterNumber.trim()}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isAddingMeter ? 'Adding...' : 'Add Meter'}
            </button>
          </form>
        )}

        <div className="pt-2">
            <input
                type="text"
                placeholder="Search by meter number..."
                value={meterSearch}
                onChange={(e) => setMeterSearch(e.target.value)}
                className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        {/* Meters List */}
        {isLoadingMeters ? (
          <p className="text-center text-gray-500 py-4">Loading meters...</p>
        ) : filteredMeters.length > 0 ? (
          <div className="space-y-3">
            {filteredMeters.map((meter) => (
              <MeterCard
                key={meter.id ?? meter.meterNumber}
                meter={meter}
                onClick={() => setSelectedMeter(meter)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No meters found.</p>
            <p className="text-sm text-gray-400">
                {meterSearch ? `No meters match your search for "${meterSearch}".` : 'Add a meter to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 text-center">
        <button
          onClick={() => onNavigateToPurchase()}
          disabled={meters.length === 0}
          className="w-full px-6 py-4 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Buy Electricity
        </button>
        <button
          onClick={onNavigateToHistory}
          className="w-full px-6 py-3 font-semibold text-blue-600 bg-transparent border-2 border-blue-600 rounded-lg hover:bg-blue-50"
        >
          View History
        </button>
      </div>
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
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
        setMessage('Settings saved successfully.');
      } else {
        setMessage(null);
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to save settings.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Account settings</h2>
      <form className="space-y-4" onSubmit={handleSave}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={currentUser.email}
            disabled
            className="w-full px-4 py-3 text-gray-500 bg-gray-100 rounded-lg border border-transparent"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Phone number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="pt-4 space-y-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Change password</h3>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
        </div>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {message && <p className="text-sm text-green-600 text-center">{message}</p>}
        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)} // Go back to the previous page
            className="w-full px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </form>
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

  return (
    <div className="w-full bg-white shadow-lg rounded-3xl p-10 space-y-10">
      <section className="space-y-6 text-center">
        <p className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">Smart utility management</p>
        <h1 className="text-5xl font-extrabold text-gray-900">
          Power your home the smart way
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Buy electricity tokens, monitor meters, and keep every transaction at your fingertips. SmartCashPower brings the full experience to web and mobile.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={handlePrimaryAction} className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700">
            {currentUser ? 'Go to my workspace' : 'Get started'}
          </button>
          {!currentUser && (
            <button onClick={() => navigate('/signup')} className="px-8 py-4 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-lg hover:bg-blue-50">
              Create account
            </button>
          )}
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          { title: 'Instant purchases', description: 'Buy electricity for any registered meter in just three steps.' },
          { title: 'Usage analytics', description: 'Track spending history and keep tabs on token deliveries.' },
          { title: 'Admin oversight', description: 'Admins get approvals, customer insights, and transaction monitoring.' },
        ].map((card) => (
          <div key={card.title} className="p-6 border border-gray-100 rounded-2xl bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800">{card.title}</h3>
            <p className="text-gray-600 mt-2">{card.description}</p>
          </div>
        ))}
      </section>
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
  // ... (rest of the handlers are fine)
  const handleCancelConfirmation = () => {
    setDeleteConfirmationProps({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    setStatusConfirmationProps({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm' });
  };
  
  const handleBlockUser = async (userId: number | string) => {
    try {
      await blockUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: false } : u)));
      handleCancelConfirmation();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnblockUser = async (userId: number | string) => {
    try {
      await unblockUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: true } : u)));
      handleCancelConfirmation();
    } catch (e) {
      console.error(e);
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
          setAllMeters((prev) => prev.filter((m) => m.id !== meterId));
          handleCancelConfirmation();
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const handleApproveReset = async (userId: number | string) => {
    try {
      await approvePasswordReset(userId);
      setPendingResets((prev) => prev.filter((r) => r.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* ... Header and stats are fine */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white rounded-3xl p-8 shadow-lg">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Admin Console</p>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser?.fullName || currentUser?.email}</h2>
          <p className="text-gray-600 mt-2">Monitor transactions, onboard users, and keep the grid running smoothly.</p>
        </div>
        <button onClick={onLogout} className="self-start px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">
          Logout
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 bg-white rounded-2xl shadow">
          <p className="text-sm text-gray-500">Active users</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{activeUsers}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow">
          <p className="text-sm text-gray-500">Meters monitored</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{metersMonitored}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow">
          <p className="text-sm text-gray-500">Pending tickets</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{transactions.filter((t) => t.status && t.status !== 'SUCCESS' && t.status !== 'COMPLETED').length}</p>
        </div>
      </div>

      {error && ( <div className="p-6 bg-red-50 text-red-700 rounded-2xl shadow"> <p className="font-bold">Failed to load admin data</p> <p>Please ensure you are logged in as an Administrator and have a valid network connection.</p> </div> )}

      {/* ... Password Reset Requests are fine */}
       <div className="bg-white rounded-3xl p-8 shadow space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Password Reset Requests</h3>
        {isLoading ? <p>Loading...</p> : pendingResets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 pr-4 font-semibold text-gray-600">User</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Email</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Requested At</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingResets.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4">{r.fullName || '—'}</td>
                    <td className="py-2 pr-4">{r.email}</td>
                    <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">
                      <button onClick={() => handleApproveReset(r.id)} className="text-sm font-semibold text-green-600 hover:underline" > Approve </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No pending password reset requests.</p>
        )}
      </div>

      {/* Customer Management */}
      <div className="bg-white rounded-3xl p-8 shadow space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Customer Management</h3>
        </div>
        <input type="text" placeholder="Search users by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
        {isLoading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              {/* ... table head */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 pr-4 font-semibold text-gray-600">User</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Email</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Meters</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Status</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4">{u.fullName || '—'}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.meterCount ?? 0}</td>
                    <td className="py-2 pr-4">
                      <button onClick={() => handleRequestStatusChange(u)} className={`px-2 py-1 text-xs font-semibold rounded-full ${ u.active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700' }`} >
                        {u.active ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-right space-x-4">
                      <button onClick={() => handleDeleteUser(u.id)} className="text-sm font-semibold text-red-600 hover:underline" > Delete </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Meters */}
      <div className="bg-white rounded-3xl p-8 shadow space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">All Registered Meters</h3>
        <input type="text" placeholder="Search meters by number or owner..." value={meterSearch} onChange={(e) => setMeterSearch(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
        {isLoading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              {/* ... table head */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 pr-4 font-semibold text-gray-600">Meter Number</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Owner</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600">Status</th>
                  <th className="py-2 pr-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeters.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4">{m.meterNumber}</td>
                    <td className="py-2 pr-4">{m.ownerFullName || 'N/A'}</td>
                    <td className="py-2 pr-4">{m.active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 pr-4 text-right">
                      <button onClick={() => handleDeleteMeter(m.id)} className="text-sm font-semibold text-red-600 hover:underline" > Delete </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Transactions */}
      <div className="bg-white rounded-3xl p-8 shadow space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">All Transactions</h3>
        <input type="text" placeholder="Search transactions by meter or user..." value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
        {isLoading ? <p>Loading...</p> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTransactions.map((tx) => (
              <button key={tx.transactionId} onClick={() => setSelectedTransaction(tx)} className="w-full text-left flex items-center justify-between border border-gray-100 rounded-2xl p-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{tx.meterNumber}</p>
                  <p className="text-xs text-gray-500"> {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString() : 'N/A'} </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{tx.amountPaid} RWF</p>
                  <p className={`text-xs font-semibold ${ tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? 'text-green-600' : tx.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600' }`} >
                    {tx.status || 'N/A'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ConfirmationModal isOpen={deleteConfirmationProps.isOpen} title={deleteConfirmationProps.title} message={deleteConfirmationProps.message} onConfirm={deleteConfirmationProps.onConfirm} onCancel={handleCancelConfirmation} confirmText="Delete" />
      <ConfirmationModal isOpen={statusConfirmationProps.isOpen} title={statusConfirmationProps.title} message={statusConfirmationProps.message} onConfirm={statusConfirmationProps.onConfirm} onCancel={handleCancelConfirmation} confirmText={statusConfirmationProps.confirmText} />
      <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    </div>
  );
};


export default App;