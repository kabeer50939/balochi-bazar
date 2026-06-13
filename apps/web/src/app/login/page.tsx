'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { getApiUrl } from '../../lib/api';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from "firebase/auth";

/* ─────────────────────────────────────────────────────────
   Inner component that uses useSearchParams()
   Must be wrapped in <Suspense> by the default export.
 ───────────────────────────────────────────────────────── */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── Mode: 'LOGIN' or 'SIGNUP' ── */
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  /* ── Login Method: 'PASSWORD' or 'SMS_OTP' ── */
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'SMS_OTP'>('PASSWORD');

  /* ── Password Login Inputs ── */
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword]     = useState('');
  const [showLoginPwd, setShowLoginPwd]       = useState(false);

  /* ── Email OTP Login Inputs ── */
  const [emailOtpEmail, setEmailOtpEmail]     = useState('');
  const [emailOtpCode, setEmailOtpCode]       = useState('');
  const [emailOtpSent, setEmailOtpSent]       = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  /* ── Register (Signup) Inputs ── */
  const [regEmail, setRegEmail]           = useState('');
  const [regPhone, setRegPhone]           = useState('');
  const [regCode, setRegCode]             = useState('');
  const [regCodeSent, setRegCodeSent]     = useState(false);
  const [regCodeLoading, setRegCodeLoading] = useState(false);
  const [regPassword, setRegPassword]     = useState('');
  const [showRegPwd, setShowRegPwd]       = useState(false);
  const [regBirthMonth, setRegBirthMonth] = useState('Month');
  const [regBirthDay, setRegBirthDay]     = useState('Day');
  const [regBirthYear, setRegBirthYear]   = useState('Year');
  const [regGender, setRegGender]         = useState('');
  const [regName, setRegName]             = useState('');
  const [regSector, setRegSector]         = useState('Mulla Band');
  const [regStreet, setRegStreet]         = useState('');
  const [regLandmark, setRegLandmark]     = useState('');

  /* ── Social Sign-in profile completion state ── */
  const [needsCompleteProfile, setNeedsCompleteProfile] = useState(false);
  const [socialEmail, setSocialEmail]       = useState('');
  const [socialName, setSocialName]         = useState('');
  const [socialPhone, setSocialPhone]       = useState('');
  const [socialSector, setSocialSector]     = useState('Mulla Band');
  const [socialStreet, setSocialStreet]     = useState('');
  const [socialLandmark, setSocialLandmark] = useState('');

  /* ── UI States ── */
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const redirectPath = searchParams.get('redirect') || '/orders';

  useEffect(() => {
    const token = localStorage.getItem('bazar_token');
    if (token) router.push(redirectPath);
  }, [router, redirectPath]);

  /* ── Phone formatters ── */
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setRegPhone(cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}` : cleaned);
  };
  const handleSocialPhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setSocialPhone(cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}` : cleaned);
  };

  /* ─── Google Login ─── */
  const handleGoogleLogin = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.email) throw new Error('Could not retrieve email from Google Account.');
      const res = await fetch(getApiUrl('/api/auth/social-login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.displayName || '' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Social authentication failed');
      if (data.needsPhoneNumber) {
        setSocialEmail(data.email); setSocialName(data.name || '');
        setNeedsCompleteProfile(true); setLoading(false);
        setSuccess('Google verified! Please complete your delivery profile.');
      } else {
        localStorage.setItem('bazar_token', data.token);
        localStorage.setItem('bazar_user', JSON.stringify(data.user));
        setSuccess('Google Login successful! Redirecting…');
        setTimeout(() => { window.location.href = redirectPath; }, 900);
      }
    } catch (err: any) { setError(err.message || 'Google Sign-in failed.'); setLoading(false); }
  };

  /* ─── Facebook Login ─── */
  const handleFacebookLogin = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const emailVal = user.email || `${user.uid}@facebook.com`;
      const res = await fetch(getApiUrl('/api/auth/social-login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, name: user.displayName || '' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Social authentication failed');
      if (data.needsPhoneNumber) {
        setSocialEmail(data.email); setSocialName(data.name || '');
        setNeedsCompleteProfile(true); setLoading(false);
        setSuccess('Facebook verified! Please complete your delivery profile.');
      } else {
        localStorage.setItem('bazar_token', data.token);
        localStorage.setItem('bazar_user', JSON.stringify(data.user));
        setSuccess('Facebook Login successful! Redirecting…');
        setTimeout(() => { window.location.href = redirectPath; }, 900);
      }
    } catch (err: any) { setError(err.message || 'Facebook Sign-in failed.'); setLoading(false); }
  };

  /* ─── Social Register (Profile Completion) ─── */
  const handleSocialRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialEmail || !socialName || !socialPhone) { setError('Please fill in all required fields marked with *'); return; }
    const phoneRegex = /^\d{4}-\d{7}$/;
    if (!phoneRegex.test(socialPhone)) { setError('Please enter a valid phone number in XXXX-XXXXXXX format (e.g. 0332-7579515).'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/auth/social-register'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: socialEmail, name: socialName, phoneNumber: socialPhone, sectorName: socialSector, streetAddress: socialStreet || undefined, landmark: socialLandmark || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile completion failed');
      if (socialStreet) {
        await fetch(getApiUrl('/api/auth/address'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
          body: JSON.stringify({ sectorName: socialSector, streetAddress: socialStreet, landmark: socialLandmark || undefined, isDefault: true }),
        });
      }
      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Account created successfully! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) { setError(err.message || 'Error completing registration. Please try again.'); setLoading(false); }
  };

  /* ─── Submit Password Login ─── */
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Login successful! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) { setError(err.message || 'Login failed. Please check your credentials.'); setLoading(false); }
  };

  /* ─── Submit Email OTP Login ─── */
  const handleEmailOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailOtpEmail)) { setError('Please enter a valid email address (e.g. user@example.com).'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/email-otp-login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOtpEmail, otpCode: emailOtpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Login successful! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) { setError(err.message || 'OTP Login failed.'); setLoading(false); }
  };

  /* ─── Send Login OTP ─── */
  const handleSendLoginOtp = async () => {
    if (!emailOtpEmail) { setError('Please enter your email address first.'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailOtpEmail)) { setError('Please enter a valid email address (e.g. user@example.com).'); return; }
    setEmailOtpLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOtpEmail, type: 'LOGIN' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');
      setEmailOtpSent(true); setEmailOtpLoading(false);
      setSuccess(data.message || 'Verification code sent to your email.');
    } catch (err: any) { setError(err.message || 'Failed to send verification code.'); setEmailOtpLoading(false); }
  };

  /* ─── Send Register OTP ─── */
  const handleSendRegisterOtp = async () => {
    if (!regEmail) { setError('Please enter your email address first.'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(regEmail)) { setError('Please enter a valid email address (e.g. user@example.com).'); return; }
    setRegCodeLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, type: 'REGISTER' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');
      setRegCodeSent(true); setRegCodeLoading(false);
      setSuccess(data.message || 'Verification code sent to your email.');
    } catch (err: any) { setError(err.message || 'Failed to send verification code.'); setRegCodeLoading(false); }
  };

  /* ─── Submit Registration ─── */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPhone || !regCode || !regPassword || !regName) { setError('Please fill in all required fields marked with *'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(regEmail)) { setError('Please enter a valid email address (e.g. customer@example.com).'); return; }
    const phoneRegex = /^\d{4}-\d{7}$/;
    if (!phoneRegex.test(regPhone)) { setError('Please enter a valid Gwadar phone number in XXXX-XXXXXXX format (e.g. 0332-7579515).'); return; }
    if (regPassword.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, phoneNumber: regPhone, password: regPassword, name: regName, sectorName: regSector, streetAddress: regStreet || undefined, landmark: regLandmark || undefined, otpCode: regCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      if (regStreet) {
        await fetch(getApiUrl('/api/auth/address'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
          body: JSON.stringify({ sectorName: regSector, streetAddress: regStreet, landmark: regLandmark || undefined, isDefault: true }),
        });
      }
      localStorage.setItem('bazar_token', data.token);
      localStorage.setItem('bazar_user', JSON.stringify(data.user));
      setSuccess('Account created successfully! Redirecting…');
      setTimeout(() => { window.location.href = redirectPath; }, 900);
    } catch (err: any) { setError(err.message || 'Registration error. Please try again.'); setLoading(false); }
  };

  /* ── Static data ── */
  const gwadarSectors = ['Mulla Band','Sabiya','Shahi Chaman','Pishukan','Old Town','New Town Phase 1','New Town Phase 2','Singhar','Kohan'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years  = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - 12 - i));

  const OR = '#F85606';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bb-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ═══════════ HEADER ═══════════ */
        .bb-hdr {
          background: #fff;
          border-bottom: 1px solid #e8e8e8;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .bb-hdr-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .bb-hdr-logo-box {
          width: 34px;
          height: 34px;
          background: #F85606;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .bb-hdr-logo-name {
          font-size: 19px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.3px;
        }
        .bb-hdr-logo-name span { color: #F85606; }
        .bb-hdr-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .bb-hdr-link {
          font-size: 13px;
          color: #333;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-family: inherit;
          font-weight: 500;
          transition: background 0.15s;
          text-decoration: none;
          display: inline-block;
        }
        .bb-hdr-link:hover { background: #f5f5f5; }
        .bb-hdr-link.active {
          color: #F85606;
          background: #fff5f0;
        }
        .bb-hdr-divider {
          color: #ddd;
          font-size: 16px;
          user-select: none;
        }

        /* ═══════════ BODY ═══════════ */
        .bb-body {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 16px 60px;
        }

        /* ═══════════ CARD ═══════════ */
        .bb-card {
          width: 100%;
          max-width: 840px;
          background: #fff;
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          display: grid;
          grid-template-columns: 1fr 340px;
          min-height: 480px;
          overflow: hidden;
        }
        @media (max-width: 740px) {
          .bb-card { grid-template-columns: 1fr; }
          .bb-card-right { display: none !important; }
        }

        /* ═══════════ LEFT COLUMN ═══════════ */
        .bb-card-left {
          padding: 32px 36px 36px;
          border-right: 1px solid #f0f0f0;
        }

        /* Tabs */
        .bb-tabs {
          display: flex;
          border-bottom: 2px solid #f0f0f0;
          margin-bottom: 24px;
          gap: 0;
        }
        .bb-tab {
          background: none;
          border: none;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          color: #999;
          padding: 0 0 12px 0;
          margin-right: 28px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: color 0.15s, border-color 0.15s;
          letter-spacing: -0.1px;
        }
        .bb-tab.active {
          color: #F85606;
          border-bottom-color: #F85606;
        }

        /* Alert messages */
        .bb-alert {
          padding: 10px 14px;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.45;
        }
        .bb-alert-err { background: #fff2f0; border: 1px solid #ffccc7; color: #cf1322; }
        .bb-alert-ok  { background: #f6ffed; border: 1px solid #b7eb8f; color: #389e0d; }

        /* Field */
        .bb-field { margin-bottom: 16px; }
        .bb-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #555;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .bb-label span { color: #F85606; margin-left: 2px; }
        .bb-input {
          width: 100%;
          height: 40px;
          border: 1px solid #d9d9d9;
          border-radius: 2px;
          padding: 0 12px;
          font-size: 13.5px;
          font-family: inherit;
          color: #1a1a1a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #fff;
        }
        .bb-input:focus {
          border-color: #F85606;
          box-shadow: 0 0 0 2px rgba(248,86,6,0.1);
        }
        .bb-input::placeholder { color: #bfbfbf; font-size: 13px; }

        /* Inline input + button row */
        .bb-inline {
          display: flex;
          gap: 8px;
        }
        .bb-inline .bb-input { flex: 1; }
        .bb-send-btn {
          height: 40px;
          padding: 0 14px;
          background: #fff;
          border: 1px solid #d9d9d9;
          border-radius: 2px;
          font-size: 13px;
          font-weight: 600;
          color: #F85606;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .bb-send-btn:hover { background: #fff5f0; border-color: #F85606; }
        .bb-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Password wrapper */
        .bb-pwd-wrap { position: relative; }
        .bb-pwd-wrap .bb-input { padding-right: 44px; }
        .bb-pwd-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          font-size: 15px;
          padding: 0;
          display: flex;
          align-items: center;
        }

        /* Forgot password link */
        .bb-forgot {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
          margin-top: -10px;
        }
        .bb-link {
          background: none;
          border: none;
          font-family: inherit;
          font-size: 12.5px;
          color: #1890ff;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
        }
        .bb-link:hover { text-decoration: underline; color: #096dd9; }

        /* Login method switcher */
        .bb-method-switch {
          text-align: center;
          margin: 12px 0 18px;
          font-size: 12.5px;
          color: #888;
        }

        /* Birthday selects row */
        .bb-birthday { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .bb-select {
          width: 100%;
          height: 40px;
          border: 1px solid #d9d9d9;
          border-radius: 2px;
          padding: 0 10px;
          font-size: 13px;
          font-family: inherit;
          color: #1a1a1a;
          outline: none;
          cursor: pointer;
          background: #fff;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
          transition: border-color 0.15s;
        }
        .bb-select:focus { border-color: #F85606; box-shadow: 0 0 0 2px rgba(248,86,6,0.1); }

        /* Gender radio */
        .bb-gender { display: flex; gap: 20px; margin-top: 4px; }
        .bb-gender label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13.5px;
          color: #333;
          cursor: pointer;
          font-weight: 400;
        }
        .bb-gender input[type="radio"] {
          accent-color: #F85606;
          width: 15px;
          height: 15px;
          cursor: pointer;
        }

        /* Delivery section divider */
        .bb-section-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0 16px;
          color: #aaa;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .bb-section-divider::before,
        .bb-section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f0f0f0;
        }

        /* CTA button */
        .bb-cta {
          width: 100%;
          height: 42px;
          background: #F85606;
          color: #fff;
          border: none;
          border-radius: 2px;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: 0.5px;
          margin-top: 8px;
          transition: background 0.15s, transform 0.1s;
        }
        .bb-cta:hover { background: #d94e00; }
        .bb-cta:active { transform: scale(0.99); }
        .bb-cta:disabled { background: #ffab83; cursor: not-allowed; transform: none; }

        /* Terms */
        .bb-terms {
          font-size: 11.5px;
          color: #999;
          text-align: center;
          margin-top: 14px;
          line-height: 1.6;
        }
        .bb-terms a { color: #1890ff; text-decoration: none; }
        .bb-terms a:hover { text-decoration: underline; }

        /* Profile completion card */
        .bb-profile-notice {
          background: #e6f7ff;
          border: 1px solid #91d5ff;
          border-radius: 3px;
          padding: 10px 14px;
          font-size: 13px;
          color: #0050b3;
          margin-bottom: 18px;
          line-height: 1.5;
        }
        .bb-profile-notice strong { font-weight: 600; }

        /* ═══════════ RIGHT COLUMN ═══════════ */
        .bb-card-right {
          background: linear-gradient(160deg, #F85606 0%, #ff7a30 50%, #ff9a5e 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 28px;
          color: #fff;
          text-align: center;
        }
        .bb-right-icon {
          font-size: 52px;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
        }
        .bb-right-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
          line-height: 1.3;
        }
        .bb-right-sub {
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .bb-right-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          margin-bottom: 16px;
          opacity: 0.7;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .bb-right-divider::before,
        .bb-right-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.5);
        }

        /* Social buttons */
        .bb-social-btn {
          width: 100%;
          height: 42px;
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          margin-bottom: 10px;
          transition: all 0.18s;
          letter-spacing: 0.1px;
        }
        .bb-social-facebook {
          background: #1877f2;
          color: #fff;
          border-color: #1877f2;
        }
        .bb-social-facebook:hover { background: #1558b0; border-color: #1558b0; }
        .bb-social-google {
          background: #fff;
          color: #3c4043;
          border-color: rgba(255,255,255,0.8);
        }
        .bb-social-google:hover { background: #f5f5f5; }

        /* Already member text */
        .bb-right-switch {
          margin-top: 20px;
          font-size: 12.5px;
          opacity: 0.8;
          line-height: 1.6;
        }
        .bb-right-switch button {
          background: none;
          border: none;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          font-size: 12.5px;
          text-decoration: underline;
          opacity: 1;
          padding: 0;
        }

        /* ═══════════ FOOTER ═══════════ */
        .bb-footer {
          text-align: center;
          padding: 18px 0 30px;
          font-size: 12px;
          color: #bbb;
        }
      `}</style>

      <div className="bb-page">

        {/* ─── HEADER ─── */}
        <header className="bb-hdr">
          <a href="/" className="bb-hdr-logo">
            <div className="bb-hdr-logo-box">🧣</div>
            <span className="bb-hdr-logo-name">Balochi <span>Bazzar</span></span>
          </a>
          <div className="bb-hdr-links">
            <button
              className={`bb-hdr-link${mode === 'LOGIN' ? ' active' : ''}`}
              onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); setNeedsCompleteProfile(false); }}
            >
              Login
            </button>
            <span className="bb-hdr-divider">|</span>
            <button
              className={`bb-hdr-link${mode === 'SIGNUP' ? ' active' : ''}`}
              onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); setNeedsCompleteProfile(false); }}
            >
              Sign Up
            </button>
          </div>
        </header>

        {/* ─── BODY ─── */}
        <main className="bb-body">
          <div className="bb-card">

            {/* ══════════════ LEFT COLUMN ══════════════ */}
            <div className="bb-card-left">

              {/* Tabs */}
              {!needsCompleteProfile && (
                <div className="bb-tabs">
                  <button
                    className={`bb-tab${mode === 'LOGIN' ? ' active' : ''}`}
                    onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}
                  >
                    Login
                  </button>
                  <button
                    className={`bb-tab${mode === 'SIGNUP' ? ' active' : ''}`}
                    onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Alerts */}
              {error && (
                <div className="bb-alert bb-alert-err">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bb-alert bb-alert-ok">
                  <span>✓</span>
                  <span>{success}</span>
                </div>
              )}

              {/* ── PROFILE COMPLETION (Social new user) ── */}
              {needsCompleteProfile ? (
                <>
                  <div className="bb-profile-notice">
                    <strong>Almost there!</strong> Your identity was verified as <strong>{socialEmail}</strong> ({socialName}).
                    Please enter your Gwadar phone number and delivery address to complete your Balochi Bazzar account.
                  </div>
                  <form onSubmit={handleSocialRegisterSubmit}>
                    <div className="bb-field">
                      <label className="bb-label">Phone Number <span>*</span></label>
                      <input
                        className="bb-input"
                        type="tel"
                        placeholder="e.g. 0332-7579515 (format: XXXX-XXXXXXX)"
                        value={socialPhone}
                        onChange={(e) => handleSocialPhoneChange(e.target.value)}
                        required
                      />
                    </div>
                    <div className="bb-field">
                      <label className="bb-label">Gwadar Sector (Required for Delivery)</label>
                      <select className="bb-select" value={socialSector} onChange={(e) => setSocialSector(e.target.value)}>
                        {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="bb-field">
                      <label className="bb-label">Street / House Address</label>
                      <input className="bb-input" type="text" placeholder="e.g. House #45, Lane 3" value={socialStreet} onChange={(e) => setSocialStreet(e.target.value)} />
                    </div>
                    <div className="bb-field">
                      <label className="bb-label">Landmark</label>
                      <input className="bb-input" type="text" placeholder="e.g. Near Gwadar Port" value={socialLandmark} onChange={(e) => setSocialLandmark(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button type="button" className="bb-cta" style={{ background: '#fff', color: '#555', border: '1px solid #d9d9d9' }} onClick={() => setNeedsCompleteProfile(false)}>
                        Cancel
                      </button>
                      <button type="submit" disabled={loading} className="bb-cta" style={{ flex: 2 }}>
                        {loading ? 'Saving…' : 'Complete Setup →'}
                      </button>
                    </div>
                  </form>
                </>

              ) : mode === 'LOGIN' ? (

                /* ════════════ LOGIN FORM ════════════ */
                <>
                  {loginMethod === 'PASSWORD' ? (
                    <form onSubmit={handlePasswordLoginSubmit}>
                      <div className="bb-field">
                        <label className="bb-label">Phone Number or Email <span>*</span></label>
                        <input
                          className="bb-input"
                          type="text"
                          placeholder="Please enter your Phone Number or Email"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          required
                        />
                      </div>
                      <div className="bb-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="bb-label" style={{ margin: 0 }}>Password <span style={{ color: '#F85606' }}>*</span></label>
                          <button type="button" className="bb-link" onClick={() => alert('Password reset is handled by Balochi Bazzar Admin. Contact Customer Care.')}>
                            Forgot Password?
                          </button>
                        </div>
                        <div className="bb-pwd-wrap">
                          <input
                            className="bb-input"
                            type={showLoginPwd ? 'text' : 'password'}
                            placeholder="Please enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                          <button type="button" className="bb-pwd-eye" onClick={() => setShowLoginPwd(!showLoginPwd)}>
                            {showLoginPwd ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="bb-cta">
                        {loading ? 'Logging in…' : 'LOGIN'}
                      </button>
                      <div className="bb-method-switch">
                        or{' '}
                        <button type="button" className="bb-link" onClick={() => { setLoginMethod('SMS_OTP'); setError(''); setSuccess(''); }}>
                          Login with Email OTP instead
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailOtpLoginSubmit}>
                      <div className="bb-field">
                        <label className="bb-label">Email Address <span>*</span></label>
                        <div className="bb-inline">
                          <input
                            className="bb-input"
                            type="email"
                            placeholder="Please enter your Email Address"
                            value={emailOtpEmail}
                            onChange={(e) => setEmailOtpEmail(e.target.value)}
                            required
                          />
                          <button type="button" className="bb-send-btn" disabled={emailOtpLoading} onClick={handleSendLoginOtp}>
                            {emailOtpLoading ? 'Sending…' : emailOtpSent ? 'Resend' : 'Send Code'}
                          </button>
                        </div>
                      </div>
                      <div className="bb-field">
                        <label className="bb-label">Verification Code <span>*</span></label>
                        <input
                          className="bb-input"
                          type="text"
                          placeholder="Please enter the verification code"
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" disabled={loading} className="bb-cta">
                        {loading ? 'Logging in…' : 'LOGIN'}
                      </button>
                      <div className="bb-method-switch">
                        or{' '}
                        <button type="button" className="bb-link" onClick={() => { setLoginMethod('PASSWORD'); setError(''); setSuccess(''); }}>
                          Login with Password instead
                        </button>
                      </div>
                    </form>
                  )}
                </>

              ) : (

                /* ════════════ REGISTER FORM ════════════ */
                <form onSubmit={handleRegisterSubmit}>

                  {/* Email + OTP */}
                  <div className="bb-field">
                    <label className="bb-label">Email Address <span>*</span></label>
                    <div className="bb-inline">
                      <input
                        className="bb-input"
                        type="email"
                        placeholder="Please enter your Email Address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                      <button type="button" className="bb-send-btn" disabled={regCodeLoading} onClick={handleSendRegisterOtp}>
                        {regCodeLoading ? 'Sending…' : regCodeSent ? 'Resend' : 'Send Code'}
                      </button>
                    </div>
                  </div>

                  <div className="bb-field">
                    <label className="bb-label">Verification Code <span>*</span></label>
                    <input
                      className="bb-input"
                      type="text"
                      placeholder="Please enter the verification code"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="bb-field">
                    <label className="bb-label">Phone Number <span>*</span></label>
                    <input
                      className="bb-input"
                      type="tel"
                      placeholder="e.g. 0332-7579515 (format: XXXX-XXXXXXX)"
                      value={regPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="bb-field">
                    <label className="bb-label">Password <span>*</span></label>
                    <div className="bb-pwd-wrap">
                      <input
                        className="bb-input"
                        type={showRegPwd ? 'text' : 'password'}
                        placeholder="Minimum 4 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                      <button type="button" className="bb-pwd-eye" onClick={() => setShowRegPwd(!showRegPwd)}>
                        {showRegPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="bb-field">
                    <label className="bb-label">Full Name <span>*</span></label>
                    <input
                      className="bb-input"
                      type="text"
                      placeholder="Enter your first and last name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Birthday */}
                  <div className="bb-field">
                    <label className="bb-label">Birthday</label>
                    <div className="bb-birthday">
                      <select className="bb-select" value={regBirthMonth} onChange={(e) => setRegBirthMonth(e.target.value)}>
                        <option>Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select className="bb-select" value={regBirthDay} onChange={(e) => setRegBirthDay(e.target.value)}>
                        <option>Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select className="bb-select" value={regBirthYear} onChange={(e) => setRegBirthYear(e.target.value)}>
                        <option>Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="bb-field">
                    <label className="bb-label">Gender</label>
                    <div className="bb-gender">
                      <label>
                        <input type="radio" name="gender" value="Male" checked={regGender === 'Male'} onChange={() => setRegGender('Male')} />
                        Male
                      </label>
                      <label>
                        <input type="radio" name="gender" value="Female" checked={regGender === 'Female'} onChange={() => setRegGender('Female')} />
                        Female
                      </label>
                      <label>
                        <input type="radio" name="gender" value="Other" checked={regGender === 'Other'} onChange={() => setRegGender('Other')} />
                        Other
                      </label>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bb-section-divider">Delivery Address</div>

                  <div className="bb-field">
                    <label className="bb-label">Gwadar Sector <span>*</span></label>
                    <select className="bb-select" value={regSector} onChange={(e) => setRegSector(e.target.value)}>
                      {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="bb-field">
                    <label className="bb-label">Street / House Address</label>
                    <input
                      className="bb-input"
                      type="text"
                      placeholder="e.g. House #45, Lane 3"
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="bb-cta">
                    {loading ? 'Creating Account…' : 'SIGN UP'}
                  </button>

                  <p className="bb-terms">
                    By creating an account, you agree to Balochi Bazzar's{' '}
                    <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                  </p>
                </form>
              )}

            </div>

            {/* ══════════════ RIGHT COLUMN ══════════════ */}
            <div className="bb-card-right">
              <div className="bb-right-icon">🧣</div>
              <div className="bb-right-title">
                {mode === 'LOGIN' ? 'Welcome Back!' : 'Join Balochi Bazzar'}
              </div>
              <div className="bb-right-sub">
                {mode === 'LOGIN'
                  ? 'Log in to browse authentic Balochi dresses, track your orders, and manage your delivery profile.'
                  : 'Discover handcrafted Balochi fashion from Gwadar artisans — delivered straight to your door.'
                }
              </div>

              <div className="bb-right-divider">
                {mode === 'LOGIN' ? 'Or login with' : 'Or register with'}
              </div>

              {/* Facebook */}
              <button
                type="button"
                className="bb-social-btn bb-social-facebook"
                onClick={handleFacebookLogin}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>

              {/* Google */}
              <button
                type="button"
                className="bb-social-btn bb-social-google"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.55 0 9s.347 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.32 0 2.507.454 3.44 1.347l2.58-2.58C13.463.892 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961l3.007 2.332c.708-2.127 2.692-3.713 5.036-3.713z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="bb-right-switch">
                {mode === 'LOGIN' ? (
                  <>New to Balochi Bazzar?{' '}
                    <button onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}>Sign Up</button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}>Login</button>
                  </>
                )}
              </div>
            </div>

          </div>
        </main>

        <footer className="bb-footer">
          © {new Date().getFullYear()} Balochi Bazzar — Handcrafted fashion from Gwadar, Pakistan
        </footer>

      </div>
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
