import { useCallback, useEffect, useState } from 'react';
import './index.css';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { addMeter, getStoredUser, getUserMeters, loginUser, logoutUser, registerUser } from './services/apiService';
import PurchaseScreen from './components/PurchaseScreen';
import HistoryScreen from './components/HistoryScreen';
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

type Meter = {
  id?: number | string;
  meterNumber: string;
  currentUnits?: number;
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
  const [isLoadingMeters, setIsLoadingMeters] = useState(false);

  const fetchMeters = useCallback(
    async (userOverride?: AuthUser | null) => {
      const user = userOverride ?? currentUser;
      if (!user || user.role === 'ADMIN') {
        setMeters([]);
        return;
      }
      setIsLoadingMeters(true);
      try {
        const userMeters = await getUserMeters();
        setMeters(userMeters);
      } catch (error) {
        console.error('Failed to fetch meters', error);
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
    if (currentUser && currentUser.role !== 'ADMIN') {
      fetchMeters(currentUser);
    }
  }, [currentUser, fetchMeters]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMeters([]);
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
                  meters={meters}
                  isLoadingMeters={isLoadingMeters}
                  onNavigateToPurchase={() => navigate('/dashboard/purchase')}
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
                    meters={meters}
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
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    } catch (err) {
      setError(mode === 'login' ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
      console.error(err);
    }
  };

  const toggleMode = () => {
    const nextPath = mode === 'login' ? '/signup' : '/login';
    navigate(nextPath);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-800">SmartCashPower</h1>
        <p className="text-gray-600">Smarter electricity for homes and businesses.</p>
      </header>
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
      <div className="text-center">
        <button onClick={toggleMode} className="text-sm font-medium text-blue-600 hover:text-blue-500">
          {mode === 'login' ? 'New user? Create an account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

interface DashboardScreenProps {
    currentUser: AuthUser;
    handleLogout: () => void;
    meters: Meter[];
    isLoadingMeters: boolean;
    onNavigateToPurchase: () => void;
    onNavigateToHistory: () => void;
    onRefreshMeters: () => void;
}

const DashboardScreen = ({ currentUser, handleLogout, meters, isLoadingMeters, onNavigateToPurchase, onNavigateToHistory, onRefreshMeters }: DashboardScreenProps) => {
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [isAddingMeter, setIsAddingMeter] = useState(false);
  const [addMeterError, setAddMeterError] = useState<string | null>(null);
  const [addMeterSuccess, setAddMeterSuccess] = useState(false);
  const [metersList, setMetersList] = useState<Meter[]>(meters);

  useEffect(() => {
    setMetersList(meters);
  }, [meters]);

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

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {currentUser.fullName || currentUser.name || currentUser.email}!</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Logout
        </button>
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

        {/* Meters List */}
        {isLoadingMeters ? (
          <p className="text-center text-gray-500 py-4">Loading meters...</p>
        ) : metersList.length > 0 ? (
          <div className="space-y-3">
            {metersList.map((meter) => (
              <MeterCard 
                key={meter.id ?? meter.meterNumber} 
                meterNumber={meter.meterNumber} 
                currentUnits={meter.currentUnits !== undefined ? `${meter.currentUnits.toFixed(2)} kWh` : 'N/A'}
                meterId={meter.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No meters found.</p>
            <p className="text-sm text-gray-400">Add a meter to get started with purchasing electricity.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 text-center">
        <button 
          onClick={onNavigateToPurchase} 
          disabled={metersList.length === 0}
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
    </div>
  );
};

const MeterCard = ({ meterNumber, currentUnits, meterId }: { meterNumber: string; currentUnits: string; meterId?: number | string }) => (
  <div className="p-6 bg-linear-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Meter Number</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{meterNumber}</p>
        {meterId && <p className="text-xs text-gray-400 mt-1">ID: {meterId}</p>}
      </div>
      <div className="text-right ml-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Units</p>
        <p className="text-2xl font-bold text-green-600 mt-1">{currentUnits}</p>
        <p className="text-xs text-gray-400 mt-1">Available</p>
      </div>
    </div>
  </div>
);

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

const AdminDashboard = ({ currentUser, onLogout }: AdminDashboardProps) => {
  return (
    <div className="space-y-8">
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
        {[
          { label: 'Active users', value: '1,248', trend: '+4.2%' },
          { label: 'Meters monitored', value: '5,430', trend: '+2.1%' },
          { label: 'Pending tickets', value: '12', trend: '-1.1%' },
        ].map((card) => (
          <div key={card.label} className="p-6 bg-white rounded-2xl shadow">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{card.value}</p>
            <p className="text-green-600 text-sm font-semibold mt-1">{card.trend} vs last week</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl p-8 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Quick actions</h3>
          <Link to="/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">
            View client workspace
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Review flagged transactions', description: 'Investigate anomalies triggered by the fraud monitor.' },
            { title: 'Approve new meter registrations', description: 'Validate customer requests and keep records updated.' },
            { title: 'Send system notification', description: 'Push outage alerts to all impacted customers.' },
            { title: 'Assign support agent', description: 'Distribute tickets to the right operations contact.' },
          ].map((item) => (
            <div key={item.title} className="border border-gray-100 rounded-2xl p-4">
              <h4 className="font-semibold text-gray-800">{item.title}</h4>
              <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              <button className="mt-3 text-sm font-semibold text-blue-600 hover:underline">Open</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;