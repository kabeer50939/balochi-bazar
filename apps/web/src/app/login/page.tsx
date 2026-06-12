'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/* ─────────────────────────────────────────────────────────
   Inner component that uses useSearchParams()
   Must be wrapped in <Suspense> by the default export.
───────────────────────────────────────────────────────── */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_BASE = 'https://balochi-bazar-backend.vercel.app';
  const getApiUrl = (path: string) => `${API_BASE}${path}`;

  /* ── Mode: 'LOGIN' or 'SIGNUP' ── */
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  /* ── Login Mode: 'PASSWORD' or 'SMS_OTP' ── */
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'SMS_OTP'>('PASSWORD');

  /* ── Password Login Inputs ── */
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword]     = useState('');
  const [showLoginPwd, setShowLoginPwd]       = useState(false);

  /* ── SMS OTP Login Inputs ── */
  const [smsPhone, setSmsPhone]           = useState('');
  const [smsCode, setSmsCode]             = useState('');
  const [smsOtpSent, setSmsOtpSent]       = useState(false);
  const [smsOtpLoading, setSmsOtpLoading] = useState(false);

  /* ── Register (Signup) Inputs ── */
  const [regPhone, setRegPhone]         = useState('');
  const [regCode, setRegCode]           = useState('');
  const [regCodeSent, setRegCodeSent]   = useState(false);
  const [regCodeLoading, setRegCodeLoading] = useState(false);
  const [regPassword, setRegPassword]   = useState('');
  const [showRegPwd, setShowRegPwd]     = useState(false);
  
  // Birthday
  const [regBirthMonth, setRegBirthMonth] = useState('Month');
  const [regBirthDay, setRegBirthDay]     = useState('Day');
  const [regBirthYear, setRegBirthYear]   = useState('Year');
  
  // Gender & Name
  const [regGender, setRegGender] = useState('Select');
  const [regName, setRegName]     = useState('');
  
  // Custom Address (Optional for delivery)
  const [regSector, setRegSector]     = useState('Mulla Band');
  const [regStreet, setRegStreet]     = useState('');
  const [regLandmark, setRegLandmark] = useState('');

  /* ── UI States ── */
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const redirectPath = searchParams.get('redirect') || '/orders';

  useEffect(() => {
    const token = localStorage.getItem('bazar_token');
    if (token) router.push(redirectPath);
  }, [router, redirectPath]);

  /* ─── Submit Password Login ─── */
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Login successful! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  /* ─── Submit SMS OTP Login ─── */
  const handleSmsLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(getApiUrl('/api/auth/otp-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: smsPhone, otpCode: smsCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Login successful! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) {
      setError(err.message || 'OTP Login failed.');
      setLoading(false);
    }
  };

  /* ─── Request Login OTP ─── */
  const handleSendLoginOtp = () => {
    if (!smsPhone) {
      setError('Please enter your mobile number first.');
      return;
    }
    setSmsOtpLoading(true);
    setError('');
    setSuccess('');

    setTimeout(() => {
      setSmsOtpSent(true);
      setSmsOtpLoading(false);
      setSuccess('SMS verification code sent! Enter code: 8899');
    }, 700);
  };

  /* ─── Request Register OTP ─── */
  const handleSendRegisterOtp = () => {
    if (!regPhone) {
      setError('Please enter your mobile number first.');
      return;
    }
    setRegCodeLoading(true);
    setError('');
    setSuccess('');

    setTimeout(() => {
      setRegCodeSent(true);
      setRegCodeLoading(false);
      setSuccess('Verification code sent! Enter code: 8899');
    }, 700);
  };

  /* ─── Submit Registration (Signup) ─── */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPhone || !regCode || !regPassword || !regName) {
      setError('Please fill in all required fields marked with *');
      return;
    }
    if (regCode !== '8899') {
      setError('Incorrect verification code. For testing, use code: 8899');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: regPhone,
          password:    regPassword,
          name:        regName,
          sectorName:  regSector,
          streetAddress: regStreet || undefined,
          landmark:    regLandmark || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      if (regStreet) {
        await fetch(getApiUrl('/api/auth/address'), {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            sectorName:    regSector,
            streetAddress: regStreet,
            landmark:      regLandmark || undefined,
            isDefault:     true,
          }),
        });
      }

      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Account created successfully! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) {
      setError(err.message || 'Registration error. Please try again.');
      setLoading(false);
    }
  };

  const gwadarSectors = [
    'Mulla Band','Sabiya','Shahi Chaman','Pishukan',
    'Old Town','New Town Phase 1','New Town Phase 2','Singhar','Kohan',
  ];

  // Range arrays for birthday drop-downs
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years  = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - 12 - i));

  /* Colors */
  const ORANGE      = '#F85606';
  const ORANGE_HOVER = '#d04600';
  const LINK_BLUE   = '#1a9cb7';
  const DARK        = '#1D1D1D';
  const LIGHT_GRAY  = '#f4f5f8';
  const BORDER      = '#dfdfdf';

  return (
    <>
      {/* ══════════════════════════════════════════
          PAGE-SPECIFIC CSS RULES (Daraz-exact)
      ══════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .bb-login-page-wrapper * {
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ── Simple simple header ── */
        .bb-simple-header {
          background: #ffffff;
          border-bottom: 1px solid #e8e8e8;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
        }
        .bb-logo-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .bb-logo-icon {
          width: 32px;
          height: 32px;
          background: ${ORANGE};
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .bb-logo-text {
          font-size: 20px;
          font-weight: 800;
          color: ${DARK};
        }
        .bb-logo-text span {
          color: ${ORANGE};
        }

        /* ── Page backdrop ── */
        .bb-page-body {
          min-height: calc(100vh - 60px);
          background: ${LIGHT_GRAY};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }

        /* ── Central Main card ── */
        .bb-auth-box {
          width: 100%;
          max-width: 850px;
          background: #ffffff;
          border-radius: 2px;
          box-shadow: 0 1px 4px 0 rgba(0,0,0,0.05);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.3fr 1fr;
        }
        @media (max-width: 768px) {
          .bb-auth-box {
            grid-template-columns: 1fr;
          }
          .bb-auth-col-right {
            display: none !important;
          }
        }

        /* ── Form side ── */
        .bb-auth-col-left {
          padding: 40px 35px 35px 35px;
        }

        .bb-form-title {
          font-size: 22px;
          font-weight: 400;
          color: #424242;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        /* ── Inputs and Labels ── */
        .bb-field-group {
          margin-bottom: 20px;
          position: relative;
        }
        .bb-field-label {
          display: block;
          font-size: 13px;
          color: #757575;
          margin-bottom: 8px;
        }
        .bb-field-label span {
          color: ${ORANGE};
        }
        .bb-input-field {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid ${BORDER};
          border-radius: 2px;
          font-size: 14px;
          color: ${DARK};
          outline: none;
          background: #fff;
          transition: border-color 0.2s;
        }
        .bb-input-field:focus {
          border-color: ${ORANGE};
        }

        /* ── Input inline buttons (Send Code) ── */
        .bb-inline-input-wrapper {
          display: flex;
          gap: 10px;
        }
        .bb-inline-action-btn {
          height: 40px;
          padding: 0 16px;
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 2px;
          font-size: 13px;
          font-weight: 500;
          color: #757575;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .bb-inline-action-btn:hover:not(:disabled) {
          border-color: ${ORANGE};
          color: ${ORANGE};
        }

        /* ── Links ── */
        .bb-blue-link {
          color: ${LINK_BLUE};
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .bb-blue-link:hover {
          text-decoration: underline;
        }

        /* ── Primary Orange CTA Button ── */
        .bb-cta-btn {
          width: 100%;
          height: 44px;
          background: ${ORANGE};
          color: #ffffff;
          border: none;
          border-radius: 2px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 10px;
          text-transform: uppercase;
        }
        .bb-cta-btn:hover:not(:disabled) {
          background: ${ORANGE_HOVER};
        }
        .bb-cta-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }

        /* ── Info/Right column ── */
        .bb-auth-col-right {
          background: #fafafa;
          border-left: 1px solid #f0f0f0;
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .bb-right-switch-text {
          font-size: 13px;
          color: #757575;
          margin-bottom: 24px;
        }
        .bb-right-social-title {
          font-size: 13px;
          color: #757575;
          margin-bottom: 12px;
        }

        /* ── Social login buttons ── */
        .bb-social-login-btn {
          width: 100%;
          height: 40px;
          border-radius: 2px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          margin-bottom: 12px;
          border: none;
          transition: all 0.2s;
        }
        .bb-social-facebook {
          background: #3b5998;
          color: #ffffff;
        }
        .bb-social-facebook:hover {
          background: #2d4373;
        }
        .bb-social-google {
          background: #ffffff;
          color: #555555;
          border: 1px solid ${BORDER};
        }
        .bb-social-google:hover {
          background: #f5f5f5;
        }

        /* ── Multi select birthday inputs ── */
        .bb-birthday-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 8px;
        }

        /* ── Alert boxes ── */
        .bb-alert {
          width: 100%;
          max-width: 850px;
          padding: 12px 16px;
          border-radius: 2px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bb-alert-danger {
          background: #fff5f5;
          border: 1px solid #ffcccb;
          color: #c53030;
        }
        .bb-alert-success {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
          color: #22543d;
        }
      `}</style>

      <div className="bb-login-page-wrapper">
        
        {/* ═══ SIMPLE HEADER ═══ */}
        <div className="bb-simple-header">
          <a href="/" className="bb-logo-link">
            <div className="bb-logo-icon">🧣</div>
            <span className="bb-logo-text">Balochi<span>Bazzar</span></span>
          </a>
          <div style={{ fontSize: '13px', color: '#757575' }}>
            New member? <button className="bb-blue-link" onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}>Register</button> here.
          </div>
        </div>

        {/* ═══ PAGE BACKDROP ═══ */}
        <div className="bb-page-body">

          {/* ── Alerts ── */}
          {error && (
            <div className="bb-alert bb-alert-danger">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="bb-alert bb-alert-success">
              ✓ {success}
            </div>
          )}

          {/* ── Auth Box ── */}
          <div className="bb-auth-box">

            {/* ════ LEFT COLUMN: Forms ════ */}
            <div className="bb-auth-col-left">

              {/* Title Header */}
              <div className="bb-form-title">
                <span>
                  {mode === 'LOGIN' 
                    ? 'Welcome to Balochi Bazzar! Please login.' 
                    : 'Create your Balochi Bazzar Account'}
                </span>
                {mode === 'LOGIN' && (
                  <button 
                    className="bb-blue-link" 
                    style={{ fontSize: '13px' }} 
                    onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}
                  >
                    Register
                  </button>
                )}
              </div>

              {/* ─── LOGIN VIEW ─── */}
              {mode === 'LOGIN' && (
                <>
                  {loginMethod === 'PASSWORD' ? (
                    /* PASSWORD FORM */
                    <form onSubmit={handlePasswordLoginSubmit}>
                      <div className="bb-field-group">
                        <label className="bb-field-label">Phone Number or Email<span>*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="Please enter your Phone Number or Email"
                          className="bb-input-field"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                        />
                      </div>

                      <div className="bb-field-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label className="bb-field-label" style={{ margin: 0 }}>Password<span>*</span></label>
                          <button
                            type="button"
                            className="bb-blue-link"
                            onClick={() => alert('Password reset is handled by Balochi Bazzar Admin. Contact Customer Care.')}
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showLoginPwd ? 'text' : 'password'}
                            required
                            placeholder="Please enter your password"
                            className="bb-input-field"
                            style={{ paddingRight: '44px' }}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPwd(!showLoginPwd)}
                            style={{
                              position: 'absolute', right: '12px', top: '50%',
                              transform: 'translateY(-50%)', background: 'none',
                              border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888',
                            }}
                          >
                            {showLoginPwd ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                        <button
                          type="button"
                          className="bb-blue-link"
                          onClick={() => { setLoginMethod('SMS_OTP'); setError(''); setSuccess(''); }}
                        >
                          Login with SMS Code
                        </button>
                      </div>

                      <button type="submit" disabled={loading} className="bb-cta-btn">
                        {loading ? 'Logging in…' : 'LOGIN'}
                      </button>
                    </form>
                  ) : (
                    /* SMS OTP FORM */
                    <form onSubmit={handleSmsLoginSubmit}>
                      <div className="bb-field-group">
                        <label className="bb-field-label">Phone Number<span>*</span></label>
                        <input
                          type="tel"
                          required
                          placeholder="Please enter your Phone Number (e.g. 03327579515)"
                          className="bb-input-field"
                          value={smsPhone}
                          onChange={(e) => setSmsPhone(e.target.value)}
                        />
                      </div>

                      <div className="bb-field-group">
                        <label className="bb-field-label">Verification Code<span>*</span></label>
                        <div className="bb-inline-input-wrapper">
                          <input
                            type="text"
                            required
                            placeholder="Please enter the verification code"
                            className="bb-input-field"
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value)}
                          />
                          <button
                            type="button"
                            className="bb-inline-action-btn"
                            disabled={smsOtpLoading}
                            onClick={handleSendLoginOtp}
                          >
                            {smsOtpLoading ? 'Sending…' : smsOtpSent ? 'Resend' : 'Send'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                        <button
                          type="button"
                          className="bb-blue-link"
                          onClick={() => { setLoginMethod('PASSWORD'); setError(''); setSuccess(''); }}
                        >
                          Login with Password
                        </button>
                      </div>

                      <button type="submit" disabled={loading} className="bb-cta-btn">
                        {loading ? 'Logging in…' : 'LOGIN'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* ─── SIGNUP VIEW ─── */}
              {mode === 'SIGNUP' && (
                <form onSubmit={handleRegisterSubmit}>
                  
                  {/* Phone number */}
                  <div className="bb-field-group">
                    <label className="bb-field-label">Phone Number<span>*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="Please enter your Phone Number"
                      className="bb-input-field"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>

                  {/* SMS Verification code */}
                  <div className="bb-field-group">
                    <label className="bb-field-label">Verification Code<span>*</span></label>
                    <div className="bb-inline-input-wrapper">
                      <input
                        type="text"
                        required
                        placeholder="Please enter the verification code"
                        className="bb-input-field"
                        value={regCode}
                        onChange={(e) => setRegCode(e.target.value)}
                      />
                      <button
                        type="button"
                        className="bb-inline-action-btn"
                        disabled={regCodeLoading}
                        onClick={handleSendRegisterOtp}
                      >
                        {regCodeLoading ? 'Sending…' : regCodeSent ? 'Resend' : 'Send'}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="bb-field-group">
                    <label className="bb-field-label">Password<span>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters with letters & numbers"
                        className="bb-input-field"
                        style={{ paddingRight: '44px' }}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPwd(!showRegPwd)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%',
                          transform: 'translateY(-50%)', background: 'none',
                          border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888',
                        }}
                      >
                        {showRegPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Birthday (Daraz Style selectors) */}
                  <div className="bb-field-group">
                    <label className="bb-field-label">Birthday</label>
                    <div className="bb-birthday-grid">
                      <select 
                        className="bb-input-field" 
                        value={regBirthMonth} 
                        onChange={(e) => setRegBirthMonth(e.target.value)}
                      >
                        <option disabled>Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select 
                        className="bb-input-field" 
                        value={regBirthDay} 
                        onChange={(e) => setRegBirthDay(e.target.value)}
                      >
                        <option disabled>Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        className="bb-input-field" 
                        value={regBirthYear} 
                        onChange={(e) => setRegBirthYear(e.target.value)}
                      >
                        <option disabled>Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="bb-field-group">
                    <label className="bb-field-label">Gender</label>
                    <select 
                      className="bb-input-field" 
                      value={regGender} 
                      onChange={(e) => setRegGender(e.target.value)}
                    >
                      <option disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div className="bb-field-group">
                    <label className="bb-field-label">Full Name<span>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your first and last name"
                      className="bb-input-field"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>

                  {/* Gwadar Sector Address Setup (Delivery Profile setup built in) */}
                  <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                    <div className="bb-field-group">
                      <label className="bb-field-label">Gwadar Sector Address (Required for Delivery)</label>
                      <select
                        className="bb-input-field"
                        value={regSector}
                        onChange={(e) => setRegSector(e.target.value)}
                      >
                        {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="bb-field-group">
                      <label className="bb-field-label">Street / House Address</label>
                      <input
                        type="text"
                        placeholder="e.g. House #45, Lane 3"
                        className="bb-input-field"
                        value={regStreet}
                        onChange={(e) => setRegStreet(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="bb-cta-btn">
                    {loading ? 'Registering…' : 'SIGN UP'}
                  </button>
                </form>
              )}

            </div>

            {/* ════ RIGHT COLUMN: Navigation / Switch & Socials ════ */}
            <div className="bb-auth-col-right">
              
              {/* Login / Register Toggle switch */}
              <div className="bb-right-switch-text">
                {mode === 'LOGIN' ? (
                  <>
                    New member? <button className="bb-blue-link" onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}>Register</button> here.
                  </>
                ) : (
                  <>
                    Already a member? <button className="bb-blue-link" onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}>Login</button> here.
                  </>
                )}
              </div>

              {/* Social authentication header */}
              <div className="bb-right-social-title">
                {mode === 'LOGIN' ? 'Or, login with' : 'Or register with'}
              </div>

              {/* Social actions */}
              <button 
                type="button" 
                className="bb-social-login-btn bb-social-facebook"
                onClick={() => alert('Facebook social authentication is a visual mock.')}
              >
                <span>📘</span> Facebook
              </button>

              <button 
                type="button" 
                className="bb-social-login-btn bb-social-google"
                onClick={() => alert('Google social authentication is a visual mock.')}
              >
                <span>🔴</span> Google
              </button>

            </div>

          </div>{/* /bb-auth-box */}

        </div>{/* /bb-page-body */}

      </div>{/* /bb-login-page-wrapper */}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Default export: wraps LoginContent in Suspense boundary
   Required by Next.js for useSearchParams() in static pages
───────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f5f5f5',
          flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ fontSize: '36px' }}>🧣</div>
          <div style={{ fontSize: '15px', color: '#888', fontWeight: 600 }}>
            Loading Balochi Bazzar…
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
