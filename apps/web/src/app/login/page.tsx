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

  /* ── Mode ── */
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  /* ── Login inputs ── */
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword]     = useState('');
  const [showLoginPwd, setShowLoginPwd]       = useState(false);

  /* ── Register inputs ── */
  const [regName,     setRegName]     = useState('');
  const [regPhone,    setRegPhone]    = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPwd,  setShowRegPwd]  = useState(false);
  const [regSector,   setRegSector]   = useState('Mulla Band');
  const [regStreet,   setRegStreet]   = useState('');
  const [regLandmark, setRegLandmark] = useState('');

  /* ── OTP modal ── */
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput,     setOtpInput]     = useState(['', '', '', '']);
  const [otpError,     setOtpError]     = useState('');

  /* ── UI ── */
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [activeTab, setActiveTab] = useState<'PASSWORD' | 'SMS_OTP'>('PASSWORD');

  /* ── SMS OTP Login inputs ── */
  const [smsPhone, setSmsPhone]           = useState('');
  const [smsCode, setSmsCode]             = useState('');
  const [smsOtpSent, setSmsOtpSent]       = useState(false);
  const [smsOtpLoading, setSmsOtpLoading] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/orders';

  useEffect(() => {
    const token = localStorage.getItem('bazar_token');
    if (token) router.push(redirectPath);
  }, [router, redirectPath]);

  /* ─── Login Submit ─── */
  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  /* ─── SMS Login Submit ─── */
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

  /* ─── Send SMS OTP ─── */
  const handleSendSmsOtp = () => {
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
    }, 800);
  };

  /* ─── Start Registration → show OTP modal ─── */
  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword) {
      setError('Full Name, Mobile Number and Password are required.');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    setError('');
    setOtpInput(['', '', '', '']);
    setOtpError('');
    setShowOtpModal(true);
  };

  /* ─── OTP digit change ─── */
  const handleOtpDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpInput];
    next[idx] = val;
    setOtpInput(next);
    if (val && idx < 3) {
      const el = document.getElementById(`otp-digit-${idx + 1}`);
      if (el) (el as HTMLInputElement).focus();
    }
  };

  /* ─── Verify OTP + complete registration ─── */
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpInput.join('');
    if (code !== '8899') {
      setOtpError('Incorrect code. For testing, enter: 8899');
      return;
    }

    setLoading(true);
    setShowOtpModal(false);
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: regPhone,
          password:    regPassword,
          name:        regName,
          email:       regEmail || undefined,
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
      setSuccess('Account created! Redirecting…');
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

  /* ─────────────────────────────────────────────────────────
     Styles (Daraz-exact — F85606 orange)
  ───────────────────────────────────────────────────────── */
  const ORANGE  = '#F85606';
  const ORANGE2 = '#e04d00';
  const DARK    = '#1D1D1D';
  const GRAY    = '#f5f5f5';
  const BORDER  = '#e0e0e0';

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    height:       '44px',
    padding:      '0 14px',
    border:       `1px solid ${BORDER}`,
    borderRadius: '4px',
    fontSize:     '14px',
    outline:      'none',
    color:        DARK,
    background:   '#fff',
    transition:   'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display:      'block',
    fontSize:     '13px',
    fontWeight:   600,
    color:        '#333',
    marginBottom: '6px',
  };

  const btnOrange: React.CSSProperties = {
    width:           '100%',
    height:          '44px',
    background:      ORANGE,
    color:           '#fff',
    border:          'none',
    borderRadius:    '4px',
    fontSize:        '14px',
    fontWeight:      700,
    letterSpacing:   '0.5px',
    cursor:          'pointer',
    transition:      'background 0.2s',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             '8px',
  };

  return (
    <>
      {/* ══════════════════════════════════════════
          Page-level inline CSS (Daraz-exact)
      ══════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .bb-login-page * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

        /* ── Header bar ── */
        .bb-auth-header {
          background: #fff;
          border-bottom: 1px solid #e8e8e8;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .bb-auth-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .bb-auth-logo-icon {
          width: 40px; height: 40px;
          background: ${ORANGE};
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .bb-auth-logo-text { font-size: 22px; font-weight: 800; color: ${DARK}; }
        .bb-auth-logo-text span { color: ${ORANGE}; }
        .bb-auth-header-help { font-size: 13px; color: #888; }
        .bb-auth-header-help a { color: ${ORANGE}; text-decoration: none; font-weight: 600; }

        /* ── Page body ── */
        .bb-login-page {
          min-height: calc(100vh - 64px);
          background: ${GRAY};
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 16px 60px;
        }

        /* ── Card ── */
        .bb-auth-card {
          width: 100%;
          max-width: 800px;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 640px) {
          .bb-auth-card { grid-template-columns: 1fr; }
          .bb-auth-right { display: none !important; }
        }

        /* ── Left / Form panel ── */
        .bb-auth-left { padding: 32px 28px; }

        /* ── Tabs ── */
        .bb-tabs {
          display: flex;
          border-bottom: 1px solid ${BORDER};
          margin-bottom: 22px;
        }
        .bb-tab {
          flex: 1; padding: 11px 0;
          background: none; border: none;
          font-size: 13px; font-weight: 600;
          color: #888; cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s;
        }
        .bb-tab.active { color: ${ORANGE}; border-bottom-color: ${ORANGE}; }

        /* ── Input group ── */
        .bb-form-group { margin-bottom: 16px; position: relative; }
        .bb-form-group input:focus { border-color: ${ORANGE}; box-shadow: 0 0 0 2px rgba(248,86,6,0.12); }

        /* ── Divider ── */
        .bb-or-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 18px 0;
          font-size: 12px; color: #aaa;
        }
        .bb-or-divider::before, .bb-or-divider::after {
          content: ''; flex: 1; height: 1px; background: ${BORDER};
        }

        /* ── Social btn ── */
        .bb-social-btn {
          width: 100%; height: 40px;
          border: 1px solid ${BORDER}; border-radius: 4px;
          background: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, border-color 0.2s;
          margin-bottom: 10px;
        }
        .bb-social-btn:hover { background: #f9f9f9; border-color: #ccc; }

        /* ── Right info panel ── */
        .bb-auth-right {
          background: linear-gradient(145deg, #fff5f0 0%, #fff 60%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 36px 28px;
          border-left: 1px solid #fce8dc;
        }
        .bb-promo-badge {
          background: ${ORANGE}; color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 3px 9px; border-radius: 20px;
          letter-spacing: 1px; margin-bottom: 16px;
        }
        .bb-promo-title {
          font-size: 22px; font-weight: 800;
          color: ${DARK}; text-align: center;
          line-height: 1.35; margin-bottom: 12px;
        }
        .bb-promo-title span { color: ${ORANGE}; }
        .bb-promo-sub {
          font-size: 12.5px; color: #666;
          text-align: center; line-height: 1.6;
          margin-bottom: 24px;
        }
        .bb-perks { list-style: none; padding: 0; width: 100%; }
        .bb-perks li {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #444;
          padding: 7px 0; border-bottom: 1px solid #f0e8e2;
        }
        .bb-perks li:last-child { border-bottom: none; }
        .bb-perks-icon {
          width: 28px; height: 28px;
          background: rgba(248,86,6,0.10);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .bb-switch-link {
          display: block; margin-top: 20px;
          padding: 9px 20px;
          border: 1.5px solid ${ORANGE};
          border-radius: 4px;
          color: ${ORANGE}; font-size: 13px; font-weight: 700;
          text-align: center; cursor: pointer;
          background: #fff; transition: all 0.2s;
        }
        .bb-switch-link:hover { background: ${ORANGE}; color: #fff; }

        /* ── Trust bar ── */
        .bb-trust-bar {
          display: flex; gap: 24px; margin-top: 24px;
          flex-wrap: wrap; justify-content: center;
        }
        .bb-trust-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; color: #777;
        }

        /* ── OTP Modal ── */
        .bb-otp-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.52);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
        }
        .bb-otp-modal {
          background: #fff; border-radius: 8px;
          padding: 32px 28px; max-width: 380px; width: 92%;
          text-align: center;
          box-shadow: 0 16px 48px rgba(0,0,0,0.18);
        }
        .bb-otp-icon { font-size: 42px; margin-bottom: 12px; }
        .bb-otp-title { font-size: 17px; font-weight: 700; color: ${DARK}; margin-bottom: 6px; }
        .bb-otp-sub {
          font-size: 12.5px; color: #666; line-height: 1.6; margin-bottom: 20px;
        }
        .bb-otp-boxes {
          display: flex; gap: 10px; justify-content: center; margin-bottom: 16px;
        }
        .bb-otp-digit {
          width: 52px; height: 52px;
          border: 2px solid ${BORDER}; border-radius: 6px;
          text-align: center; font-size: 22px; font-weight: 700;
          color: ${DARK}; outline: none;
          transition: border-color 0.2s;
        }
        .bb-otp-digit:focus { border-color: ${ORANGE}; box-shadow: 0 0 0 2px rgba(248,86,6,0.15); }
        .bb-otp-error { font-size: 12px; color: #d32f2f; margin-bottom: 12px; font-weight: 600; }
        .bb-otp-actions { display: flex; gap: 10px; }

        /* ── Alert banners ── */
        .bb-alert-success {
          background: #f0fff4; border: 1px solid #38a169;
          color: #276749; padding: 11px 14px;
          border-radius: 4px; font-size: 13px; font-weight: 600;
          margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
        }
        .bb-alert-error {
          background: #fff5f5; border: 1px solid #e53e3e;
          color: #c53030; padding: 11px 14px;
          border-radius: 4px; font-size: 13px; font-weight: 600;
          margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
        }

        /* ── Testing hint box ── */
        .bb-hint-box {
          background: #fff8f0; border: 1px dashed ${ORANGE};
          border-radius: 4px; padding: 11px 14px;
          font-size: 12px; color: #666;
          margin-top: 14px; text-align: left;
        }
        .bb-hint-box code {
          background: rgba(248,86,6,0.10);
          color: ${ORANGE}; padding: 1px 6px;
          border-radius: 3px; font-weight: 700;
        }
      `}</style>

      {/* ═══ AUTH HEADER ═══ */}
      <div className="bb-auth-header">
        <a href="/" className="bb-auth-logo" style={{ textDecoration: 'none' }}>
          <div className="bb-auth-logo-icon">🧣</div>
          <span className="bb-auth-logo-text">
            Balochi<span>Bazzar</span>
          </span>
        </a>
        <div className="bb-auth-header-help">
          Need help? <a href="#">Customer Care</a>
        </div>
      </div>

      {/* ═══ PAGE BODY ═══ */}
      <div className="bb-login-page">

        {/* ─── Alert messages ─── */}
        {error && (
          <div className="bb-alert-error" style={{ width: '100%', maxWidth: '800px', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bb-alert-success" style={{ width: '100%', maxWidth: '800px', marginBottom: '16px' }}>
            ✓ {success}
          </div>
        )}

        {/* ─── Main card ─── */}
        <div className="bb-auth-card">

          {/* ════ LEFT: Forms ════ */}
          <div className="bb-auth-left">

            {/* Section title */}
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: DARK, marginBottom: '4px' }}>
                {mode === 'LOGIN' ? 'Login to Balochi Bazzar' : 'Create your Account'}
              </h1>
              <p style={{ fontSize: '12.5px', color: '#888' }}>
                {mode === 'LOGIN'
                  ? 'Access your orders, profile and exclusive deals.'
                  : 'Join thousands of shoppers from Gwadar and beyond.'}
              </p>
            </div>

            {/* ── LOGIN MODE ── */}
            {mode === 'LOGIN' && (
              <>
                {/* Input toggle tabs */}
                <div className="bb-tabs">
                  <button
                    className={`bb-tab ${activeTab === 'PASSWORD' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('PASSWORD'); setError(''); setSuccess(''); }}
                    type="button"
                  >
                    🔑 Password Login
                  </button>
                  <button
                    className={`bb-tab ${activeTab === 'SMS_OTP' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('SMS_OTP'); setError(''); setSuccess(''); }}
                    type="button"
                  >
                    📱 SMS Code Login
                  </button>
                </div>

                {activeTab === 'PASSWORD' ? (
                  <form onSubmit={handleLoginSubmit}>
                    <div className="bb-form-group">
                      <label style={labelStyle}>Phone Number or Email</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your phone number or email"
                        style={inputStyle}
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                        onBlur={(e) => (e.target.style.borderColor = BORDER)}
                      />
                    </div>

                    <div className="bb-form-group">
                      <label style={labelStyle}>Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showLoginPwd ? 'text' : 'password'}
                          required
                          placeholder="Enter your password"
                          style={{ ...inputStyle, paddingRight: '44px' }}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                          onBlur={(e) => (e.target.style.borderColor = BORDER)}
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
                      <div style={{ textAlign: 'right', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => alert('Password reset is handled by admin. Contact Customer Care.')}
                          style={{ background: 'none', border: 'none', color: ORANGE, fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        ...btnOrange,
                        opacity: loading ? 0.75 : 1,
                        background: loading ? '#ccc' : ORANGE,
                      }}
                      onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = ORANGE2; }}
                      onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = ORANGE; }}
                    >
                      {loading ? '⏳ Logging in…' : 'LOG IN'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSmsLoginSubmit}>
                    <div className="bb-form-group">
                      <label style={labelStyle}>Mobile Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter your phone number (e.g. 03327579515)"
                        style={inputStyle}
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                        onBlur={(e) => (e.target.style.borderColor = BORDER)}
                      />
                    </div>

                    <div className="bb-form-group">
                      <label style={labelStyle}>SMS Verification Code</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Enter 4-digit code"
                          style={{ ...inputStyle, flex: 1 }}
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                          onBlur={(e) => (e.target.style.borderColor = BORDER)}
                        />
                        <button
                          type="button"
                          onClick={handleSendSmsOtp}
                          disabled={smsOtpLoading}
                          style={{
                            padding: '0 16px',
                            background: '#fff',
                            border: `1.5px solid ${ORANGE}`,
                            borderRadius: '4px',
                            color: ORANGE,
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = ORANGE; }}
                        >
                          {smsOtpLoading ? 'Sending…' : smsOtpSent ? 'Resend' : 'Send Code'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        ...btnOrange,
                        opacity: loading ? 0.75 : 1,
                        background: loading ? '#ccc' : ORANGE,
                      }}
                      onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = ORANGE2; }}
                      onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = ORANGE; }}
                    >
                      {loading ? '⏳ Logging in…' : 'LOG IN'}
                    </button>
                  </form>
                )}

                {/* OR divider + social */}
                <div className="bb-or-divider">OR</div>
                <button className="bb-social-btn" type="button" onClick={() => alert('Social login is a display mock.')}>
                  <span style={{ fontSize: '16px' }}>📘</span> Continue with Facebook
                </button>
                <button className="bb-social-btn" type="button" onClick={() => alert('Social login is a display mock.')}>
                  <span style={{ fontSize: '16px' }}>🔴</span> Continue with Google
                </button>
              </>
            )}

            {/* ── SIGNUP MODE ── */}
            {mode === 'SIGNUP' && (
              <form onSubmit={handleRegisterClick}>
                {/* Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="bb-form-group">
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      type="text" required
                      placeholder="e.g. Sana Baluch"
                      style={inputStyle} value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                      onBlur={(e) => (e.target.style.borderColor = BORDER)}
                    />
                  </div>
                  <div className="bb-form-group">
                    <label style={labelStyle}>Mobile Number *</label>
                    <input
                      type="tel" required
                      placeholder="e.g. 03321234567"
                      style={inputStyle} value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                      onBlur={(e) => (e.target.style.borderColor = BORDER)}
                    />
                  </div>
                </div>

                {/* Email + Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="bb-form-group">
                    <label style={labelStyle}>Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. sana@email.com"
                      style={inputStyle} value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                      onBlur={(e) => (e.target.style.borderColor = BORDER)}
                    />
                  </div>
                  <div className="bb-form-group">
                    <label style={labelStyle}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showRegPwd ? 'text' : 'password'} required
                        placeholder="Min. 4 characters"
                        style={{ ...inputStyle, paddingRight: '44px' }}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                        onBlur={(e) => (e.target.style.borderColor = BORDER)}
                      />
                      <button
                        type="button" onClick={() => setShowRegPwd(!showRegPwd)}
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
                </div>

                {/* Sector + Street */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                  <div className="bb-form-group">
                    <label style={labelStyle}>Area / Sector *</label>
                    <select
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '28px', background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E") no-repeat right 12px center` }}
                      value={regSector} onChange={(e) => setRegSector(e.target.value)}
                    >
                      {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="bb-form-group">
                    <label style={labelStyle}>Street / House # (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. House #45, Street 3"
                      style={inputStyle} value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                      onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                      onBlur={(e) => (e.target.style.borderColor = BORDER)}
                    />
                  </div>
                </div>

                {/* Landmark */}
                <div className="bb-form-group">
                  <label style={labelStyle}>Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near West Bay School"
                    style={inputStyle} value={regLandmark}
                    onChange={(e) => setRegLandmark(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = ORANGE)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)}
                  />
                </div>

                {/* Terms */}
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '14px', lineHeight: 1.6 }}>
                  By clicking "Sign Up", you agree to Balochi Bazzar's{' '}
                  <a href="#" style={{ color: ORANGE }}>Terms of Use</a> and{' '}
                  <a href="#" style={{ color: ORANGE }}>Privacy Policy</a>.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...btnOrange,
                    opacity: loading ? 0.75 : 1,
                    background: loading ? '#ccc' : ORANGE,
                  }}
                  onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = ORANGE2; }}
                  onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = ORANGE; }}
                >
                  {loading ? '⏳ Creating Account…' : 'SIGN UP →'}
                </button>
              </form>
            )}

            {/* Mode toggle link (bottom) */}
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
              {mode === 'LOGIN' ? (
                <>Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('SIGNUP'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                  >
                    Sign Up Free
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('LOGIN'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                  >
                    Login here
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ════ RIGHT: Promo panel ════ */}
          <div className="bb-auth-right">
            <div className="bb-promo-badge">✦ EXCLUSIVE BENEFITS</div>
            <p className="bb-promo-title">
              Shop Authentic<br />
              <span>Balochi Craftsmanship</span><br />
              Online
            </p>
            <p className="bb-promo-sub">
              Gwadar's #1 destination for handcrafted Balochi garments.
              Join thousands of happy shoppers and get exclusive offers.
            </p>

            <ul className="bb-perks">
              <li>
                <div className="bb-perks-icon">🎁</div>
                <span>Exclusive member-only discounts & early sales</span>
              </li>
              <li>
                <div className="bb-perks-icon">📦</div>
                <span>Real-time order tracking to your doorstep</span>
              </li>
              <li>
                <div className="bb-perks-icon">🧣</div>
                <span>Authentic handcrafted Balochi attire guaranteed</span>
              </li>
              <li>
                <div className="bb-perks-icon">🔒</div>
                <span>Secure payments with buyer protection</span>
              </li>
              <li>
                <div className="bb-perks-icon">↩️</div>
                <span>Easy returns within 7 days</span>
              </li>
            </ul>

            <button
              className="bb-switch-link"
              type="button"
              onClick={() => { setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setError(''); }}
            >
              {mode === 'LOGIN' ? '→ Create a Free Account' : '← Back to Login'}
            </button>
          </div>

        </div>{/* /bb-auth-card */}

        {/* ─── Trust bar ─── */}
        <div className="bb-trust-bar">
          <div className="bb-trust-item">🔒 Secure Login</div>
          <div className="bb-trust-item">🇵🇰 100% Pakistani</div>
          <div className="bb-trust-item">📞 24/7 Support</div>
          <div className="bb-trust-item">✔️ Verified Sellers</div>
        </div>

      </div>{/* /bb-login-page */}

      {/* ═══ OTP MODAL ═══ */}
      {showOtpModal && (
        <div className="bb-otp-overlay">
          <div className="bb-otp-modal">
            <div className="bb-otp-icon">📱</div>
            <h2 className="bb-otp-title">Verify Your Number</h2>
            <p className="bb-otp-sub">
              A 4-digit OTP has been sent to <strong>{regPhone}</strong> via SMS.
              <br />
              <span style={{ color: ORANGE, fontWeight: 700 }}>For testing, enter: 8899</span>
            </p>

            {otpError && <div className="bb-otp-error">⚠️ {otpError}</div>}

            <form onSubmit={handleOtpVerify}>
              <div className="bb-otp-boxes">
                {otpInput.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="bb-otp-digit"
                    value={digit}
                    onChange={(e) => handleOtpDigit(idx, e.target.value)}
                  />
                ))}
              </div>

              <div className="bb-otp-actions">
                <button
                  type="submit"
                  style={{
                    ...btnOrange, flex: 2,
                  }}
                >
                  Verify & Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  style={{
                    flex: 1, height: '44px', border: `1px solid ${BORDER}`,
                    borderRadius: '4px', background: '#fff',
                    color: '#444', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>

            <p style={{ marginTop: '14px', fontSize: '12px', color: '#888' }}>
              Didn't receive?{' '}
              <button
                type="button"
                onClick={() => alert('OTP resend is a mock feature.')}
                style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
              >
                Resend OTP
              </button>
            </p>
          </div>
        </div>
      )}
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
