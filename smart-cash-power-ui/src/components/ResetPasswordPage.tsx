import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/apiService';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(email, newPassword);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
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
            Reset Your Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your new password for {email}
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full pl-11 pr-4 py-3 rounded-lg transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full pl-11 pr-4 py-3 rounded-lg transition-all"
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
              disabled={isResetting}
              className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: 'var(--gradient-green)',
                color: 'white',
              }}
            >
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 text-sm font-medium transition-colors"
            style={{ color: 'var(--green-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-light)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
          >
            ← Back to login
          </button>
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

export default ResetPasswordPage;
