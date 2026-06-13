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

  /* ── Step: 1 (Identifier/Email or Phone), 2 (Password/OTP), 'NEW_USER' (Intermediate screen) ── */
  const [loginStep, setLoginStep] = useState<1 | 2 | 'NEW_USER'>(1);

  /* ── Signup Step: 1 (Form), 2 (OTP + Delivery Profile) ── */
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

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
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
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

  /* ── Accordion State ── */
  const [showHelp, setShowHelp] = useState(false);

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, type: 'REGISTER' })
      });
      const data = await res.json();
      setRegCodeLoading(false);
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');
      setRegCodeSent(true);
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

  /* ── Step 1: Check if user exists on backend ── */
  const handleContinueToStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setError('Enter your email or mobile phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/check-user'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) throw new Error(data.error || 'Checking user status failed.');

      if (data.exists) {
        // User exists -> show password screen
        setLoginStep(2);
        if (identifier.includes('@')) {
          setEmailOtpEmail(identifier);
        }
      } else {
        // User does not exist -> show intermediate screen
        setLoginStep('NEW_USER');
      }
    } catch (err: any) {
      setError(err.message || 'Checking user status failed.');
      setLoading(false);
    }
  };

  /* ── Signup Step 1 Submit: Validate and Send OTP ── */
  const handleSignupStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!regEmail || !regName || !regPassword || !regConfirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(regEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setRegCodeLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, type: 'REGISTER' })
      });
      const data = await res.json();
      setRegCodeLoading(false);
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');
      setRegCodeSent(true);
      setSuccess(data.message || 'Verification code sent to your email.');
      setSignupStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
      setRegCodeLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .a-page {
          background-color: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f1111;
          padding: 18px 18px 40px;
        }

        /* ═══════════ LOGO ═══════════ */
        .a-logo-container {
          margin-top: 14px;
          margin-bottom: 18px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }

        /* ═══════════ CARD CONTAINER ═══════════ */
        .a-box {
          width: 350px;
          background-color: #ffffff;
          border: 1px solid #d5d9d9;
          border-radius: 8px;
          padding: 20px 26px;
          margin-bottom: 22px;
          box-sizing: border-box;
        }

        @media (max-width: 400px) {
          .a-box {
            border: none;
            width: 100%;
            padding: 20px 10px;
          }
          .a-page {
            padding: 10px 10px 30px;
          }
        }

        /* ═══════════ TYPOGRAPHY ═══════════ */
        .a-heading {
          font-size: 28px;
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 14px;
          color: #0f1111;
          letter-spacing: -0.3px;
        }

        .a-subtitle {
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 14px;
          color: #0f1111;
        }

        .a-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #0f1111;
          margin-bottom: 4px;
          padding-left: 2px;
        }

        .a-label-desc {
          font-size: 11px;
          color: #555555;
          font-weight: 400;
          margin-top: -2px;
          margin-bottom: 6px;
        }

        /* ═══════════ INPUTS ═══════════ */
        .a-input-row {
          margin-bottom: 14px;
          position: relative;
        }

        .a-input {
          width: 100%;
          height: 31px;
          padding: 3px 7px;
          font-size: 13px;
          line-height: 19px;
          border: 1px solid #a6a6a6;
          border-top-color: #949494;
          border-radius: 3px;
          outline: none;
          background-color: #ffffff;
          color: #0f1111;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 0 rgba(0, 0, 0, 0.07) inset;
          transition: border-color 0.1s, box-shadow 0.1s;
        }

        .a-input:focus {
          border-color: #e77600;
          box-shadow: 0 0 3px 2px rgba(228, 121, 17, 0.5);
        }

        /* Info Message box under inputs */
        .a-info-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #111111;
          margin-top: 6px;
          margin-bottom: 12px;
        }

        .a-info-icon-svg {
          fill: #0066c0;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        /* ═══════════ BUTTONS ═══════════ */
        .a-button-primary {
          display: block;
          width: 100%;
          height: 31px;
          border: 1px solid #FCD200;
          border-radius: 100px;
          background: #FFD814;
          box-shadow: 0 2px 5px 0 rgba(213,217,217,.5);
          color: #0f1111;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          font-weight: 400;
          transition: all 0.1s;
          text-align: center;
          line-height: 29px;
          outline: none;
        }

        .a-button-primary:hover {
          background: #F7CA00;
          border-color: #e2ba00;
        }

        .a-button-primary:active {
          background: #f0c14b;
          border-color: #a88734;
        }

        .a-button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .a-button-secondary {
          display: block;
          width: 100%;
          text-align: center;
          height: 31px;
          line-height: 29px;
          border: 1px solid #adb1b8;
          border-radius: 100px;
          background: linear-gradient(to bottom, #f7f8fa, #e7e9ec);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
          color: #0f1111;
          font-size: 13px;
          font-family: inherit;
          font-weight: 400;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.1s;
          outline: none;
        }

        .a-button-secondary:hover {
          background: linear-gradient(to bottom, #f2f3f6, #dddfe2);
          border-color: #a2a6ac;
        }

        .a-button-secondary:active {
          background: #e2e5e9;
          border-color: #8d9096;
          box-shadow: 0 1px 3px rgba(0,0,0,.2) inset;
        }

        .a-button-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ═══════════ INLINE INPUT ROW ═══════════ */
        .a-inline-row {
          display: flex;
          gap: 6px;
        }
        .a-inline-row .a-input {
          flex: 1;
        }
        .a-inline-row .a-button-secondary {
          width: auto;
          padding: 0 12px;
          height: 31px;
          line-height: 29px;
        }

        /* ═══════════ ACCORDION & LINKS ═══════════ */
        .a-link {
          color: #0066c0;
          text-decoration: none;
          font-size: 13px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        .a-link:hover {
          color: #c45500;
          text-decoration: underline;
        }

        .a-help-container {
          margin-top: 16px;
          font-size: 13px;
        }

        .a-help-trigger {
          background: none;
          border: none;
          font-family: inherit;
          font-size: 13px;
          color: #0066c0;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          outline: none;
        }

        .a-help-trigger:hover {
          color: #c45500;
          text-decoration: underline;
        }

        .a-help-arrow {
          font-size: 9px;
          transition: transform 0.1s;
          display: inline-block;
          color: #555;
        }

        .a-help-arrow.expanded {
          transform: rotate(90deg);
        }

        .a-help-content {
          margin-top: 8px;
          padding-left: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* ═══════════ LEGAL & DISCLAIMER ═══════════ */
        .a-disclaimer {
          font-size: 12px;
          line-height: 1.5;
          color: #0f1111;
          margin-top: 14px;
          margin-bottom: 14px;
        }

        /* ═══════════ SECTION DIVIDERS ═══════════ */
        .a-divider {
          text-align: center;
          position: relative;
          margin-top: 22px;
          margin-bottom: 12px;
          width: 350px;
        }

        @media (max-width: 400px) {
          .a-divider {
            width: 100%;
          }
        }

        .a-divider::after {
          content: "";
          width: 100%;
          height: 1px;
          background-color: #e7e7e7;
          position: absolute;
          top: 50%;
          left: 0;
          z-index: 1;
        }

        .a-divider h5 {
          background-color: #ffffff;
          padding: 0 8px;
          display: inline-block;
          position: relative;
          z-index: 2;
          color: #767676;
          font-size: 12px;
          font-weight: 400;
        }

        .a-card-divider {
          border-top: 1px solid #e7e7e7;
          margin: 18px 0;
        }

        /* ═══════════ ALERTS ═══════════ */
        .a-box-alert {
          border: 1px solid;
          border-radius: 4px;
          background-color: #ffffff;
          padding: 14px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 350px;
          box-sizing: border-box;
        }

        @media (max-width: 400px) {
          .a-box-alert {
            width: 100%;
          }
        }

        .a-box-error {
          border-color: #c40000;
          box-shadow: 0 0 0 4px #fcf4f4 inset;
        }

        .a-box-success {
          border-color: #007600;
          box-shadow: 0 0 0 4px #f4fcf4 inset;
        }

        .a-alert-icon {
          font-size: 20px;
          line-height: 1;
        }

        .a-box-error .a-alert-icon {
          color: #c40000;
        }

        .a-box-success .a-alert-icon {
          color: #007600;
        }

        .a-alert-content h4 {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .a-box-error .a-alert-content h4 {
          color: #c40000;
        }

        .a-box-success .a-alert-content h4 {
          color: #007600;
        }

        .a-alert-content p {
          font-size: 12px;
          line-height: 1.5;
          color: #0f1111;
        }

        /* ═══════════ FOOTER ═══════════ */
        .a-footer {
          margin-top: auto;
          padding-top: 26px;
          padding-bottom: 30px;
          width: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.03), transparent);
          border-top: 1px solid #e7e7e7;
          text-align: center;
          font-size: 11px;
        }

        .a-footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 10px;
        }

        .a-footer-links a, .a-footer-links button {
          color: #0066c0;
          text-decoration: none;
          background: none;
          border: none;
          font-size: 11px;
          font-family: inherit;
          cursor: pointer;
        }

        .a-footer-links a:hover, .a-footer-links button:hover {
          color: #c45500;
          text-decoration: underline;
        }

        .a-footer-copyright {
          color: #555555;
        }

        /* ═══════════ REGISTRATION/SIGNUP FIELDS ═══════════ */
        .a-birthday-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 6px;
        }

        .a-select {
          width: 100%;
          height: 31px;
          border: 1px solid #a6a6a6;
          border-radius: 3px;
          padding: 0 6px;
          font-size: 12px;
          font-family: inherit;
          color: #0f1111;
          outline: none;
          background-color: #f7f8fa;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
        }

        .a-select:focus {
          border-color: #e77600;
          box-shadow: 0 0 3px 2px rgba(228, 121, 17, 0.5);
        }

        .a-gender-row {
          display: flex;
          gap: 16px;
          margin-top: 4px;
        }

        .a-gender-row label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #0f1111;
          cursor: pointer;
          font-weight: 400;
        }

        .a-gender-row input[type="radio"] {
          accent-color: #e77600;
          cursor: pointer;
        }

        /* ═══════════ SOCIAL BUTTONS ═══════════ */
        .a-social-buttons {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .a-button-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 31px;
          border: 1px solid #adb1b8;
          border-radius: 100px;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          font-weight: 400;
          outline: none;
          transition: all 0.1s;
          line-height: 29px;
        }

        .a-button-google {
          background: #ffffff;
          color: #3c4043;
          border-color: #adb1b8;
        }

        .a-button-google:hover {
          background: #f7f8fa;
          border-color: #a2a6ac;
        }

        .a-button-facebook {
          background: #1877f2;
          color: #ffffff;
          border-color: #1877f2;
        }

        .a-button-facebook:hover {
          background: #166fe5;
          border-color: #166fe5;
        }

        /* ═══════════ TWO STEP INFO BAR ═══════════ */
        .a-info-bar {
          display: flex;
          align-items: center;
          font-size: 13px;
          margin-bottom: 14px;
          color: #0f1111;
        }
        .a-info-bar-text {
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 240px;
        }
        .a-info-bar-change {
          margin-left: 8px;
          font-size: 12px;
        }

        /* Checkbox custom */
        .a-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 12px;
          margin-bottom: 12px;
        }
        .a-checkbox-row input[type="checkbox"] {
          accent-color: #e77600;
          margin-top: 3px;
          cursor: pointer;
        }
        .a-checkbox-label {
          font-size: 12px;
          color: #0f1111;
          line-height: 1.4;
          cursor: pointer;
        }
      `}</style>

      <div className="a-page">
        {/* Centered logo container */}
        <div className="a-logo-container" onClick={() => { setMode('LOGIN'); setLoginStep(1); setError(''); setSuccess(''); setNeedsCompleteProfile(false); }}>
          <svg viewBox="0 0 170 45" width="150" height="40" xmlns="http://www.w3.org/2000/svg">
            <text x="10" y="28" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="19" fill="#111" letterSpacing="-0.5">
              BALOCHI BAZZAR
            </text>
            {/* Curved smile arrow */}
            <path d="M 15 33 Q 75 44 140 33" fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" />
            {/* Arrowhead */}
            <path d="M 134 32 L 141 33 L 138 39" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="a-box-alert a-box-error">
            <span className="a-alert-icon">⚠️</span>
            <div className="a-alert-content">
              <h4>There was a problem</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="a-box-alert a-box-success">
            <span className="a-alert-icon">✓</span>
            <div className="a-alert-content">
              <h4>Success</h4>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Main Box */}
        <div className="a-box">
          {needsCompleteProfile ? (
            /* ══════════════ PROFILE COMPLETION (Social Sign-in) ══════════════ */
            <>
              <h1 className="a-heading">Complete Profile</h1>
              <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '14px', color: '#0f1111' }}>
                Almost there! You have verified your identity as <strong>{socialEmail}</strong> ({socialName}).
                Please provide your phone number and delivery address to finish your BALOCHI BAZZAR account.
              </p>
              <form onSubmit={handleSocialRegisterSubmit}>
                <div className="a-input-row">
                  <label className="a-label">Mobile Number</label>
                  <input
                    className="a-input"
                    type="tel"
                    placeholder="e.g. 0332-7579515"
                    value={socialPhone}
                    onChange={(e) => handleSocialPhoneChange(e.target.value)}
                    required
                  />
                  <div className="a-label-desc">Format: XXXX-XXXXXXX</div>
                </div>

                <div className="a-input-row">
                  <label className="a-label">Gwadar Sector</label>
                  <select className="a-select" value={socialSector} onChange={(e) => setSocialSector(e.target.value)}>
                    {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="a-input-row">
                  <label className="a-label">Street / House Address</label>
                  <input
                    className="a-input"
                    type="text"
                    placeholder="e.g. House #45, Lane 3"
                    value={socialStreet}
                    onChange={(e) => setSocialStreet(e.target.value)}
                  />
                </div>

                <div className="a-input-row">
                  <label className="a-label">Landmark</label>
                  <input
                    className="a-input"
                    type="text"
                    placeholder="e.g. Near Gwadar Port"
                    value={socialLandmark}
                    onChange={(e) => setSocialLandmark(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="a-button-primary" style={{ marginTop: '6px' }}>
                  {loading ? 'Saving…' : 'Complete Registration'}
                </button>

                <button
                  type="button"
                  className="a-button-secondary"
                  style={{ marginTop: '8px' }}
                  onClick={() => setNeedsCompleteProfile(false)}
                >
                  Cancel
                </button>
              </form>
            </>
          ) : mode === 'LOGIN' ? (
            /* ══════════════ LOGIN FLOW ══════════════ */
            <>
              {loginStep === 1 ? (
                /* LOGIN STEP 1: Enter Identifier (Image 1) */
                <form onSubmit={handleContinueToStep2}>
                  <h1 className="a-heading">Sign in or create account</h1>
                  <div className="a-input-row">
                    <label className="a-label">Enter mobile number or email</label>
                    <input
                      className="a-input"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="a-button-primary" disabled={loading}>
                    {loading ? 'Continuing…' : 'Continue'}
                  </button>

                  <p className="a-disclaimer">
                    By continuing, you agree to BALOCHI BAZZAR's{' '}
                    <a href="#" className="a-link">Conditions of Use</a> and{' '}
                    <a href="#" className="a-link">Privacy Notice</a>.
                  </p>

                  <div className="a-help-container">
                    <button type="button" className="a-help-trigger" onClick={() => setShowHelp(!showHelp)}>
                      <span className={`a-help-arrow ${showHelp ? 'expanded' : ''}`}>▶</span> Need help?
                    </button>
                    {showHelp && (
                      <div className="a-help-content">
                        <button type="button" className="a-link" onClick={() => alert('Password reset is handled by BALOCHI BAZZAR Admin. Contact Customer Care.')}>
                          Forgot Password
                        </button>
                        <a href="#" className="a-link" onClick={(e) => { e.preventDefault(); alert('Please contact support@balochibazzar.com for assistance.'); }}>
                          Other issues with Sign-In
                        </a>
                        
                        <div className="a-card-divider" style={{ margin: '8px 0' }} />
                        
                        {/* Hidden Google & Facebook providers inside Need Help accordion to preserve 100% card aesthetic */}
                        <div className="a-label" style={{ fontWeight: 400, fontSize: '11px', color: '#555', marginBottom: '6px' }}>
                          Or sign in with:
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="a-button-social a-button-google"
                            style={{ flex: 1, height: '28px', lineHeight: '26px', fontSize: '11px' }}
                            onClick={handleGoogleLogin}
                            disabled={loading}
                          >
                            Google
                          </button>
                          <button
                            type="button"
                            className="a-button-social a-button-facebook"
                            style={{ flex: 1, height: '28px', lineHeight: '26px', fontSize: '11px' }}
                            onClick={handleFacebookLogin}
                            disabled={loading}
                          >
                            Facebook
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="a-card-divider" />

                  <div className="a-label" style={{ fontWeight: 400, fontSize: '13px', color: '#111' }}>
                    Buying for work?
                  </div>
                  <a href="#" className="a-link" onClick={(e) => { e.preventDefault(); alert('Wholesale and Business accounts are coming soon!'); }}>
                    Create a free business account
                  </a>
                </form>
              ) : loginStep === 'NEW_USER' ? (
                /* INTERMEDIATE SCREEN: New User Prompt (Image 2) */
                <>
                  <h1 className="a-heading" style={{ fontSize: '24px' }}>Looks like you're new to BALOCHI BAZZAR</h1>
                  
                  {/* Identifier summary */}
                  <div className="a-info-bar">
                    <span className="a-info-bar-text" style={{ fontSize: '15px' }}>{loginIdentifier}</span>
                    <button type="button" className="a-link a-info-bar-change" onClick={() => { setLoginStep(1); setError(''); setSuccess(''); }}>
                      Change
                    </button>
                  </div>

                  <p className="a-subtitle">Let's create an account using your email</p>

                  <button
                    type="button"
                    className="a-button-primary"
                    onClick={() => {
                      setMode('SIGNUP');
                      setSignupStep(1);
                      setRegEmail(loginIdentifier);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Proceed to create an account
                  </button>

                  <div className="a-card-divider" />

                  <div className="a-label" style={{ fontWeight: 700, fontSize: '13px' }}>Already a customer?</div>
                  <button
                    type="button"
                    className="a-link"
                    style={{ fontSize: '13px', marginTop: '8px' }}
                    onClick={() => { setLoginStep(1); setError(''); setSuccess(''); }}
                  >
                    Sign in with another email or mobile
                  </button>
                </>
              ) : (
                /* LOGIN STEP 2: Password or OTP */
                <>
                  <h1 className="a-heading">Sign in</h1>

                  {/* Info Bar with current identifier */}
                  <div className="a-info-bar">
                    <span className="a-info-bar-text">{loginIdentifier}</span>
                    <button type="button" className="a-link a-info-bar-change" onClick={() => { setLoginStep(1); setError(''); setSuccess(''); }}>
                      Change
                    </button>
                  </div>

                  {loginMethod === 'PASSWORD' ? (
                    <form onSubmit={handlePasswordLoginSubmit}>
                      <div className="a-input-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <label className="a-label" style={{ margin: 0 }}>Password</label>
                          <button type="button" className="a-link" style={{ fontSize: '12px' }} onClick={() => alert('Password reset is handled by BALOCHI BAZZAR Admin. Contact Customer Care.')}>
                            Forgot Password?
                          </button>
                        </div>
                        <input
                          className="a-input"
                          type={showLoginPwd ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          className="a-link"
                          style={{ position: 'absolute', right: '10px', top: '24px', fontSize: '11px' }}
                          onClick={() => setShowLoginPwd(!showLoginPwd)}
                        >
                          {showLoginPwd ? 'Hide' : 'Show'}
                        </button>
                      </div>

                      <button type="submit" disabled={loading} className="a-button-primary">
                        {loading ? 'Signing in…' : 'Sign in'}
                      </button>

                      <div className="a-checkbox-row">
                        <input type="checkbox" id="keep-signed-in" defaultChecked />
                        <label htmlFor="keep-signed-in" className="a-checkbox-label">
                          Keep me signed in. <a href="#" className="a-link" style={{ fontSize: '12px' }} onClick={(e) => { e.preventDefault(); alert('Keep me signed in keeps you signed into your device. Choose this only on your personal devices.'); }}>Details</a>
                        </label>
                      </div>

                      <div className="a-card-divider" />

                      <div style={{ textAlign: 'center', fontSize: '12px' }}>
                        <button type="button" className="a-link" onClick={() => { setLoginMethod('SMS_OTP'); setError(''); setSuccess(''); }}>
                          Login with Email OTP instead
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* EMAIL OTP FORM */
                    <form onSubmit={handleEmailOtpLoginSubmit}>
                      <div className="a-input-row">
                        <label className="a-label">Email Address</label>
                        <div className="a-inline-row">
                          <input
                            className="a-input"
                            type="email"
                            value={emailOtpEmail}
                            onChange={(e) => setEmailOtpEmail(e.target.value)}
                            required
                          />
                          <button type="button" className="a-button-secondary" disabled={emailOtpLoading} onClick={handleSendLoginOtp}>
                            {emailOtpLoading ? 'Sending…' : emailOtpSent ? 'Resend' : 'Send OTP'}
                          </button>
                        </div>
                      </div>

                      <div className="a-input-row">
                        <label className="a-label">Enter OTP Verification Code</label>
                        <input
                          className="a-input"
                          type="text"
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value)}
                          required
                        />
                      </div>

                      <button type="submit" disabled={loading} className="a-button-primary">
                        {loading ? 'Verifying OTP…' : 'Sign in'}
                      </button>

                      <div className="a-card-divider" />

                      <div style={{ textAlign: 'center', fontSize: '12px' }}>
                        <button type="button" className="a-link" onClick={() => { setLoginMethod('PASSWORD'); setError(''); setSuccess(''); }}>
                          Login with password instead
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </>
          ) : (
            /* ══════════════ SIGNUP/REGISTER FLOW ══════════════ */
            <>
              {signupStep === 1 ? (
                /* SIGNUP STEP 1: Matches Image 3 */
                <form onSubmit={handleSignupStep1Submit}>
                  <h1 className="a-heading">Create account</h1>
                  
                  <div className="a-input-row">
                    <label className="a-label">Enter mobile number or email</label>
                    <input
                      className="a-input"
                      type="text"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="a-input-row">
                    <label className="a-label">Your name</label>
                    <input
                      className="a-input"
                      type="text"
                      placeholder="First and last name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="a-input-row">
                    <label className="a-label">Password (at least 6 characters)</label>
                    <input
                      className="a-input"
                      type={showRegPwd ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="a-link"
                      style={{ position: 'absolute', right: '10px', top: '24px', fontSize: '11px' }}
                      onClick={() => setShowRegPwd(!showRegPwd)}
                    >
                      {showRegPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="a-info-message">
                    <svg className="a-info-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                    <span style={{ fontSize: '12px', color: '#111' }}>Passwords must be at least 6 characters.</span>
                  </div>

                  <div className="a-input-row">
                    <label className="a-label">Re-enter password</label>
                    <input
                      className="a-input"
                      type={showRegPwd ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" disabled={regCodeLoading} className="a-button-primary" style={{ marginTop: '14px' }}>
                    {regCodeLoading ? 'Sending OTP…' : 'Verify email'}
                  </button>

                  <div className="a-card-divider" />

                  <div className="a-label" style={{ fontWeight: 700, fontSize: '13px' }}>Already a customer?</div>
                  <button
                    type="button"
                    className="a-link"
                    style={{ fontSize: '13px', marginTop: '4px' }}
                    onClick={() => { setMode('LOGIN'); setLoginStep(1); setError(''); setSuccess(''); }}
                  >
                    Sign in instead
                  </button>

                  <p className="a-disclaimer" style={{ marginTop: '18px', marginBottom: 0 }}>
                    By creating an account, you agree to BALOCHI BAZZAR's{' '}
                    <a href="#" className="a-link">Conditions of Use</a> and{' '}
                    <a href="#" className="a-link">Privacy Notice</a>.
                  </p>
                </form>
              ) : (
                /* SIGNUP STEP 2: Verify OTP + Collect Phone & Sector */
                <form onSubmit={handleRegisterSubmit}>
                  <h1 className="a-heading">Verify email</h1>
                  
                  {/* Pre-populated email display */}
                  <div className="a-info-bar">
                    <span className="a-info-bar-text" style={{ fontWeight: 'bold' }}>{regEmail}</span>
                    <button type="button" className="a-link a-info-bar-change" onClick={() => { setSignupStep(1); setError(''); setSuccess(''); }}>
                      Change
                    </button>
                  </div>

                  <p className="a-subtitle" style={{ fontSize: '12.5px', color: '#555', marginBottom: '16px' }}>
                    To verify your email, we've sent a One-Time Password (OTP) code to your address above.
                  </p>

                  <div className="a-input-row">
                    <label className="a-label">Enter OTP Code <span>*</span></label>
                    <input
                      className="a-input"
                      type="text"
                      placeholder="6-digit verification code"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="a-input-row">
                    <label className="a-label">Mobile phone number <span>*</span></label>
                    <input
                      className="a-input"
                      type="tel"
                      placeholder="e.g. 0332-7579515"
                      value={regPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                    />
                    <div className="a-label-desc">Format: XXXX-XXXXXXX (Gwadar Delivery Contact)</div>
                  </div>

                  <div className="a-input-row">
                    <label className="a-label">Gwadar Sector <span>*</span></label>
                    <select className="a-select" value={regSector} onChange={(e) => setRegSector(e.target.value)}>
                      {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="a-input-row">
                    <label className="a-label">Street / House Address (Optional)</label>
                    <input
                      className="a-input"
                      type="text"
                      placeholder="e.g. House #45, Lane 3"
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="a-button-primary" style={{ marginTop: '14px' }}>
                    {loading ? 'Creating account…' : 'CREATE YOUR BALOCHI BAZZAR ACCOUNT'}
                  </button>

                  <p className="a-disclaimer" style={{ marginTop: '18px', marginBottom: 0 }}>
                    By creating an account, you agree to BALOCHI BAZZAR's{' '}
                    <a href="#" className="a-link">Conditions of Use</a> and{' '}
                    <a href="#" className="a-link">Privacy Notice</a>.
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="a-footer">
          <div className="a-footer-links">
            <a href="#">Conditions of Use</a>
            <a href="#">Privacy Notice</a>
            <a href="#">Help</a>
          </div>
          <div className="a-footer-copyright">
            © 2005-{new Date().getFullYear()}, BALOCHI BAZZAR or its affiliates
          </div>
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
          justifyContent: 'center', backgroundColor: '#ffffff',
          flexDirection: 'column', gap: '14px',
        }}>
          <svg viewBox="0 0 170 45" width="150" height="40" xmlns="http://www.w3.org/2000/svg">
            <text x="10" y="28" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="19" fill="#111" letterSpacing="-0.5">
              BALOCHI BAZZAR
            </text>
            <path d="M 15 33 Q 75 44 140 33" fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 134 32 L 141 33 L 138 39" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: '13px', color: '#555', fontFamily: 'Arial, sans-serif' }}>
            Loading...
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
