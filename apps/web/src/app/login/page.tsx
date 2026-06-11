'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const getApiUrl = (path: string = '') => `https://balochi-bazar-backend.vercel.app${path}`;

  // Tabs: 'LOGIN' | 'REGISTER'
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Input states
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');

  // OTP mock states
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Read optional tab query param
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('REGISTER');
    }
  }, [searchParams]);

  // Countdown timer for mock OTP
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleSendOtp = () => {
    if (!regPhone || regPhone.length < 10) {
      setError('Please enter a valid phone number first.');
      return;
    }
    setError('');
    
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpTimer(60); // 60 seconds cooldown

    // Trigger visual mock OTP toast alert
    setSuccess(`✉️ Verification SMS Sent! Code is ${code}. Please enter this code to verify.`);
    setTimeout(() => setSuccess(''), 8000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneOrEmail, password: loginPassword })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid username or password');

      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      
      setSuccess('Logged in successfully! Redirecting...');
      setTimeout(() => {
        router.push('/orders');
        // Force header update
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!otpSent || regOtp !== generatedOtp) {
      setError('Verification Code (OTP) is invalid or has not been requested.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: regPhone,
          password: regPassword,
          name: regName,
          email: regEmail || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));

      setSuccess('Account registered and logged in successfully!');
      setTimeout(() => {
        router.push('/orders');
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Dynamic styles injected directly */}
      <style dangerouslySetInnerHTML={{__html: `
        .login-page-container {
          background-color: #eff0f5;
          min-height: 80vh;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Inter, sans-serif;
        }
        .login-card {
          background: #ffffff;
          max-width: 850px;
          width: 100%;
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          border-radius: 2px;
          box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .login-left {
          padding: 40px;
        }
        .login-right {
          padding: 40px;
          border-left: 1px solid #eff0f5;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .login-title {
          font-size: 22px;
          color: #424242;
          margin-bottom: 25px;
          font-weight: 400;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .daraz-input-group {
          margin-bottom: 20px;
        }
        .daraz-label {
          display: block;
          font-size: 14px;
          color: #424242;
          margin-bottom: 8px;
        }
        .daraz-input {
          width: 100%;
          height: 44px;
          border: 1px solid #d5d5d5;
          background: #fff;
          padding: 10px 12px;
          font-size: 14px;
          color: #212121;
          border-radius: 2px;
          transition: border-color 0.2s;
          outline: none;
        }
        .daraz-input:focus {
          border-color: #f85606;
        }
        .daraz-btn-primary {
          width: 100%;
          height: 48px;
          background: #f85606;
          color: #fff;
          border: none;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.2s;
          margin-top: 20px;
        }
        .daraz-btn-primary:hover {
          background: #d04505;
        }
        .daraz-btn-primary:disabled {
          background: #fca880;
          cursor: not-allowed;
        }
        .forgot-link {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #1a73e8;
          text-decoration: none;
          margin-top: 6px;
          cursor: pointer;
        }
        .forgot-link:hover {
          color: #f85606;
        }
        .switch-link-container {
          font-size: 13px;
          color: #424242;
          margin-bottom: 25px;
        }
        .switch-link {
          color: #1a73e8;
          text-decoration: none;
          cursor: pointer;
          margin-left: 4px;
        }
        .switch-link:hover {
          color: #f85606;
          text-decoration: underline;
        }
        .social-login-title {
          font-size: 13px;
          color: #757575;
          margin-top: 15px;
          margin-bottom: 15px;
        }
        .social-btn {
          width: 100%;
          height: 40px;
          border: none;
          border-radius: 2px;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
          transition: opacity 0.2s;
        }
        .social-btn:hover {
          opacity: 0.9;
        }
        .social-btn-facebook {
          background: #3b5998;
        }
        .social-btn-google {
          background: #d34836;
        }
        .daraz-otp-wrapper {
          display: flex;
          gap: 10px;
        }
        .daraz-btn-otp {
          height: 44px;
          background: #fff;
          border: 1px solid #d5d5d5;
          color: #f85606;
          padding: 0 15px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 2px;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .daraz-btn-otp:hover {
          border-color: #f85606;
          background: rgba(248, 86, 6, 0.02);
        }
        .daraz-btn-otp:disabled {
          color: #999;
          border-color: #d5d5d5;
          cursor: not-allowed;
        }
        .alert-box {
          padding: 12px 16px;
          border-radius: 2px;
          font-size: 13px;
          margin-bottom: 20px;
          border: 1px solid transparent;
        }
        .alert-box-error {
          background: #fff3f3;
          border-color: #fca;
          color: #d32f2f;
        }
        .alert-box-success {
          background: #f3fbf4;
          border-color: #cfa;
          color: #2e7d32;
        }
        @media (max-width: 768px) {
          .login-card {
            grid-template-columns: 1fr;
          }
          .login-right {
            border-left: none;
            border-top: 1px solid #eff0f5;
            padding-top: 30px;
          }
        }
      `}} />

      <div className="login-card">
        {/* Left Side: Forms */}
        <div className="login-left">
          <div className="login-title">
            <span>
              {activeTab === 'LOGIN' 
                ? 'Welcome to Balochi Bazzar! Please login.' 
                : 'Create your Balochi Bazzar Account'}
            </span>
          </div>

          {/* Error and Success notifications */}
          {error && (
            <div className="alert-box alert-box-error">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="alert-box alert-box-success">
              {success}
            </div>
          )}

          {activeTab === 'LOGIN' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit}>
              <div className="daraz-input-group">
                <label className="daraz-label">Phone Number or Email*</label>
                <input 
                  type="text" 
                  required 
                  className="daraz-input" 
                  placeholder="Please enter your Phone Number or Email" 
                  value={phoneOrEmail} 
                  onChange={(e) => setPhoneOrEmail(e.target.value)} 
                />
              </div>
              <div className="daraz-input-group">
                <label className="daraz-label">Password*</label>
                <input 
                  type="password" 
                  required 
                  className="daraz-input" 
                  placeholder="Please enter your password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                />
                <span className="forgot-link" onClick={() => alert('For password resets, contact Atelier Gwadar Support.')}>
                  Forgot Password?
                </span>
              </div>
              
              <button 
                type="submit" 
                className="daraz-btn-primary"
                disabled={loading}
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit}>
              <div className="daraz-input-group">
                <label className="daraz-label">Phone Number*</label>
                <div className="daraz-otp-wrapper">
                  <input 
                    type="tel" 
                    required 
                    className="daraz-input" 
                    placeholder="Please enter your phone number" 
                    value={regPhone} 
                    onChange={(e) => setRegPhone(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    onClick={handleSendOtp} 
                    className="daraz-btn-otp"
                    disabled={otpTimer > 0}
                  >
                    {otpTimer > 0 ? `Retry in ${otpTimer}s` : 'Send Code'}
                  </button>
                </div>
              </div>
              <div className="daraz-input-group">
                <label className="daraz-label">Verification Code*</label>
                <input 
                  type="text" 
                  required 
                  className="daraz-input" 
                  placeholder="Verification Code" 
                  value={regOtp} 
                  onChange={(e) => setRegOtp(e.target.value)} 
                />
              </div>
              <div className="daraz-input-group">
                <label className="daraz-label">Password*</label>
                <input 
                  type="password" 
                  required 
                  className="daraz-input" 
                  placeholder="Minimum 6 characters" 
                  value={regPassword} 
                  onChange={(e) => setRegPassword(e.target.value)} 
                />
              </div>
              <div className="daraz-input-group">
                <label className="daraz-label">Full Name*</label>
                <input 
                  type="text" 
                  required 
                  className="daraz-input" 
                  placeholder="Enter your first and last name" 
                  value={regName} 
                  onChange={(e) => setRegName(e.target.value)} 
                />
              </div>
              <div className="daraz-input-group">
                <label className="daraz-label">Email Address (Optional)</label>
                <input 
                  type="email" 
                  className="daraz-input" 
                  placeholder="Please enter your email" 
                  value={regEmail} 
                  onChange={(e) => setRegEmail(e.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                className="daraz-btn-primary"
                disabled={loading}
              >
                {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Switch Link & Social Login */}
        <div className="login-right">
          {activeTab === 'LOGIN' ? (
            <div className="switch-link-container">
              <span>New member?</span>
              <span className="switch-link" onClick={() => { setActiveTab('REGISTER'); setError(''); setSuccess(''); }}>
                Register
              </span>
              <span> here.</span>
            </div>
          ) : (
            <div className="switch-link-container">
              <span>Already member?</span>
              <span className="switch-link" onClick={() => { setActiveTab('LOGIN'); setError(''); setSuccess(''); }}>
                Login
              </span>
              <span> here.</span>
            </div>
          )}

          <div className="social-login-title">
            {activeTab === 'LOGIN' ? 'Or, login with' : 'Or, sign up with'}
          </div>

          <button className="social-btn social-btn-facebook" onClick={() => alert('Facebook Login is a placeholder demo.')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>

          <button className="social-btn social-btn-google" onClick={() => alert('Google Login is a placeholder demo.')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.829-6.357-6.315 0-3.485 2.847-6.315 6.357-6.315 1.6 0 3.03.593 4.137 1.573l3.076-3.076C19.333 2.222 15.937 1 12.24 1 5.94 1 1 5.93 1 12.2s4.94 11.2 11.24 11.2c6.1 0 11.24-4.38 11.24-11.2 0-.74-.065-1.415-.205-1.915H12.24z"/>
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        paddingTop: '8rem', 
        paddingBottom: '8rem', 
        textAlign: 'center', 
        color: '#333', 
        background: '#eff0f5', 
        minHeight: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f85606' }}>Loading Balochi Bazzar Auth...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
