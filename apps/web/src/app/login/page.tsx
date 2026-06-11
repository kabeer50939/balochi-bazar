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
  const [forgotHover, setForgotHover] = useState(false);

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
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '7rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        maxWidth: '850px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'var(--bg-secondary, #131a22)'
      }}>
        
        {/* Left Panel: Auth Forms */}
        <div style={{ padding: '3rem 2.5rem', background: '#17202a', color: '#fff' }}>
          {/* Tabs header */}
          <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
            <span 
              onClick={() => { setActiveTab('LOGIN'); setError(''); setSuccess(''); }} 
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: activeTab === 'LOGIN' ? '#f85606' : '#85929e',
                borderBottom: activeTab === 'LOGIN' ? '3px solid #f85606' : 'none',
                paddingBottom: '0.5rem'
              }}
            >
              Sign In
            </span>
            <span 
              onClick={() => { setActiveTab('REGISTER'); setError(''); setSuccess(''); }} 
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: activeTab === 'REGISTER' ? '#f85606' : '#85929e',
                borderBottom: activeTab === 'REGISTER' ? '3px solid #f85606' : 'none',
                paddingBottom: '0.5rem'
              }}
            >
              Register Account
            </span>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(34,197,94,0.2)' }}>
              {success}
            </div>
          )}

          {activeTab === 'LOGIN' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Phone or Email</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '42px' }}
                  placeholder="e.g. 03327579515 or kabeer@bazar.com" 
                  value={phoneOrEmail} 
                  onChange={(e) => setPhoneOrEmail(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '42px' }}
                  placeholder="••••••••" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#85929e', marginBottom: '2rem' }}>
                <span 
                  style={{ cursor: 'pointer', color: forgotHover ? '#f85606' : '#85929e', transition: 'color 0.2s' }} 
                  onMouseEnter={() => setForgotHover(true)}
                  onMouseLeave={() => setForgotHover(false)}
                  onClick={() => alert('For password resets, contact Atelier Gwadar Support.')}
                >
                  Forgot Password?
                </span>
                <span style={{ cursor: 'pointer', color: '#f85606' }} onClick={() => { setActiveTab('REGISTER'); }}>New Member? Register</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', background: '#f85606', borderColor: '#f85606', fontWeight: 'bold', fontSize: '1rem', height: '44px' }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'LOGIN'}
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '40px' }}
                  placeholder="e.g. Kabeer Ahmed" 
                  value={regName} 
                  onChange={(e) => setRegName(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="tel" 
                    required 
                    className="form-input" 
                    style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '40px', flexGrow: 1 }}
                    placeholder="e.g. 03327579515" 
                    value={regPhone} 
                    onChange={(e) => setRegPhone(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    onClick={handleSendOtp} 
                    className="btn btn-secondary" 
                    style={{ height: '40px', fontSize: '0.8rem', padding: '0 1rem', whiteSpace: 'nowrap', borderColor: '#34495e', background: '#2c3e50', color: '#fff' }}
                    disabled={otpTimer > 0}
                  >
                    {otpTimer > 0 ? `Retry in ${otpTimer}s` : 'Send Code'}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Verification Code (SMS OTP)</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '40px' }}
                  placeholder="Enter SMS verification code" 
                  value={regOtp} 
                  onChange={(e) => setRegOtp(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Email Address (Optional)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '40px' }}
                  placeholder="e.g. client@bazar.com" 
                  value={regEmail} 
                  onChange={(e) => setRegEmail(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" style={{ color: '#abb2b9', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Password</label>
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  style={{ background: '#2c3e50', border: '1px solid #34495e', color: '#fff', padding: '10px 12px', height: '40px' }}
                  placeholder="Minimum 6 characters" 
                  value={regPassword} 
                  onChange={(e) => setRegPassword(e.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', background: '#f85606', borderColor: '#f85606', fontWeight: 'bold', fontSize: '1rem', height: '44px' }}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'SIGN UP'}
              </button>
            </form>
          )}
        </div>

        {/* Right Panel: Call to Action / Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #131a22 0%, #1f2a38 100%)',
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: '#fff',
          borderLeft: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(248, 86, 6, 0.1)', color: '#f85606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem' }}>
            🛒
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: '#f85606' }}>
            Balochi Bazzar
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a6acaf', lineHeight: '1.6', maxWidth: '280px', margin: '0 auto 1.5rem auto' }}>
            Join Gwadar's premium platform for hand-embroidered Balochi Doch garments, dress styling, and costume rentals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '240px', fontSize: '0.8rem', textAlign: 'left', color: '#d5dbdb' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>✨</span>
              <span>100% Authentic Hand-embroidery</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>📐</span>
              <span>Custom Sizing & Tailoring Specs</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>🚚</span>
              <span>Free Delivery in Gwadar City</span>
            </div>
          </div>
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
        color: '#fff', 
        background: '#131a22', 
        minHeight: '100vh' 
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f85606' }}>Loading Balochi Bazzar Auth...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
