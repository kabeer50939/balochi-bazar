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

  /* ── Step: 1 (Identifier/Email or Phone), 2 (Password/OTP input) ── */
  const [loginStep, setLoginStep] = useState<1 | 2>(1);

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

  /* ── Step 1 Validation ── */
  const handleContinueToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError('Enter your email or mobile phone number');
      return;
    }
    setError('');
    setLoginStep(2);
    // Auto-populate the Email OTP email if they entered an email address
    if (loginIdentifier.includes('@')) {
      setEmailOtpEmail(loginIdentifier);
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
          font-family: "Amazon Ember", Arial, sans-serif;
          color: #111111;
          padding: 14px 18px 40px;
        }

        /* ═══════════ LOGO ═══════════ */
        .a-logo-container {
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
          border: 1px solid #dddddd;
          border-radius: 4px;
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
        }

        .a-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #111111;
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
          color: #111111;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 0 rgba(0, 0, 0, 0.07) inset;
          transition: border-color 0.1s, box-shadow 0.1s;
        }

        .a-input:focus {
          border-color: #e77600;
          box-shadow: 0 0 3px 2px rgba(228, 121, 17, 0.5);
        }

        /* ═══════════ BUTTONS ═══════════ */
        .a-button-primary {
          display: block;
          width: 100%;
          height: 31px;
          border: 1px solid;
          border-color: #a88734 #9c7e31 #846a29;
          border-radius: 3px;
          background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset;
          color: #111111;
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
          background: linear-gradient(to bottom, #f5d78e, #eeb933);
          border-color: #a28230 #96792f #7c6326;
        }

        .a-button-primary:active {
          background: #f0c14b;
          border-color: #846a29;
          box-shadow: 0 1px 3px rgba(0,0,0,.2) inset;
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
          border-radius: 3px;
          background: linear-gradient(to bottom, #f7f8fa, #e7e9ec);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
          color: #111111;
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
          color: #111111;
          margin-top: 14px;
          margin-bottom: 14px;
        }

        /* ═══════════ SECTION DIVIDERS ═══════════ */
        .a-divider {
          text-align: center;
          position: relative;
          margin-top: 26px;
          margin-bottom: 14px;
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
          color: #111111;
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
          color: #111111;
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
          color: #111111;
          cursor: pointer;
          font-weight: 400;
        }

        .a-gender-row input[type="radio"] {
          accent-color: #e77600;
          cursor: pointer;
        }

        /* ═══════════ SOCIAL BUTTONS ═══════════ */
        .a-social-buttons {
          margin-top: 14px;
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
          border-radius: 3px;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          font-weight: 400;
          outline: none;
          transition: all 0.1s;
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
          color: #111111;
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
          color: #111111;
          line-height: 1.4;
          cursor: pointer;
        }
      `}</style>

      <div className="a-page">
        {/* Centered logo container */}
        <div className="a-logo-container" onClick={() => { setMode('LOGIN'); setLoginStep(1); setError(''); setSuccess(''); setNeedsCompleteProfile(false); }}>
          <svg viewBox="0 0 170 45" width="150" height="40" xmlns="http://www.w3.org/2000/svg">
            <text x="10" y="28" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="21" fill="#111" letterSpacing="-0.8">
              balochi<tspan fontWeight="normal">bazzar</tspan>
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
              <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '14px', color: '#111' }}>
                Almost there! You have verified your identity as <strong>{socialEmail}</strong> ({socialName}).
                Please provide your phone number and delivery address to finish your Balochi Bazzar account.
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
                /* LOGIN STEP 1: Enter Identifier */
                <form onSubmit={handleContinueToStep2}>
                  <h1 className="a-heading">Sign in</h1>
                  <div className="a-input-row">
                    <label className="a-label">Email or mobile phone number</label>
                    <input
                      className="a-input"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="a-button-primary">
                    Continue
                  </button>

                  <p className="a-disclaimer">
                    By continuing, you agree to Balochi Bazzar's{' '}
                    <a href="#" className="a-link">Conditions of Use</a> and{' '}
                    <a href="#" className="a-link">Privacy Notice</a>.
                  </p>

                  <div className="a-help-container">
                    <button type="button" className="a-help-trigger" onClick={() => setShowHelp(!showHelp)}>
                      <span className={`a-help-arrow ${showHelp ? 'expanded' : ''}`}>▶</span> Need help?
                    </button>
                    {showHelp && (
                      <div className="a-help-content">
                        <button type="button" className="a-link" onClick={() => alert('Password reset is handled by Balochi Bazzar Admin. Contact Customer Care.')}>
                          Forgot Password
                        </button>
                        <a href="#" className="a-link" onClick={(e) => { e.preventDefault(); alert('Please contact support@balochibazzar.com for assistance.'); }}>
                          Other issues with Sign-In
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="a-card-divider" />

                  <div className="a-label" style={{ fontWeight: 400, marginBottom: '6px' }}>
                    Or sign in using social networks:
                  </div>

                  <div className="a-social-buttons">
                    {/* Google Button */}
                    <button
                      type="button"
                      className="a-button-social a-button-google"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                    >
                      <svg width="15" height="15" viewBox="0 0 18 18">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.55 0 9s.347 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.32 0 2.507.454 3.44 1.347l2.58-2.58C13.463.892 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961l3.007 2.332c.708-2.127 2.692-3.713 5.036-3.713z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>

                    {/* Facebook Button */}
                    <button
                      type="button"
                      className="a-button-social a-button-facebook"
                      onClick={handleFacebookLogin}
                      disabled={loading}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                  </div>
                </form>
              ) : (
                /* LOGIN STEP 2: Enter Password or OTP */
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
                          <button type="button" className="a-link" style={{ fontSize: '12px' }} onClick={() => alert('Password reset is handled by Balochi Bazzar Admin. Contact Customer Care.')}>
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
              <h1 className="a-heading">Create account</h1>
              <form onSubmit={handleRegisterSubmit}>
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
                  <label className="a-label">Email address</label>
                  <div className="a-inline-row">
                    <input
                      className="a-input"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                    <button type="button" className="a-button-secondary" disabled={regCodeLoading} onClick={handleSendRegisterOtp}>
                      {regCodeLoading ? 'Sending…' : regCodeSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                <div className="a-input-row">
                  <label className="a-label">Verification OTP Code</label>
                  <input
                    className="a-input"
                    type="text"
                    placeholder="Enter the code sent to your email"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    required
                  />
                </div>

                <div className="a-input-row">
                  <label className="a-label">Mobile phone number</label>
                  <input
                    className="a-input"
                    type="tel"
                    placeholder="e.g. 0332-7579515"
                    value={regPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                  />
                  <div className="a-label-desc">Format: XXXX-XXXXXXX</div>
                </div>

                <div className="a-input-row">
                  <label className="a-label">Password</label>
                  <input
                    className="a-input"
                    type={showRegPwd ? 'text' : 'password'}
                    placeholder="At least 4 characters"
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

                {/* Additional profile completion requirements */}
                <div className="a-input-row">
                  <label className="a-label">Gwadar Sector</label>
                  <select className="a-select" value={regSector} onChange={(e) => setRegSector(e.target.value)}>
                    {gwadarSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="a-input-row">
                  <label className="a-label">Street / House Address</label>
                  <input
                    className="a-input"
                    type="text"
                    placeholder="e.g. House #45, Lane 3"
                    value={regStreet}
                    onChange={(e) => setRegStreet(e.target.value)}
                  />
                </div>

                {/* Birthday & Gender - Optional details to make it rich */}
                <div className="a-input-row">
                  <label className="a-label">Birthday (Optional)</label>
                  <div className="a-birthday-row">
                    <select className="a-select" value={regBirthMonth} onChange={(e) => setRegBirthMonth(e.target.value)}>
                      <option>Month</option>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="a-select" value={regBirthDay} onChange={(e) => setRegBirthDay(e.target.value)}>
                      <option>Day</option>
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="a-select" value={regBirthYear} onChange={(e) => setRegBirthYear(e.target.value)}>
                      <option>Year</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="a-input-row">
                  <label className="a-label">Gender (Optional)</label>
                  <div className="a-gender-row">
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

                <button type="submit" disabled={loading} className="a-button-primary" style={{ marginTop: '10px' }}>
                  {loading ? 'Creating account…' : 'Create your Balochi Bazzar account'}
                </button>

                <p className="a-disclaimer">
                  By creating an account, you agree to Balochi Bazzar's{' '}
                  <a href="#" className="a-link">Conditions of Use</a> and{' '}
                  <a href="#" className="a-link">Privacy Notice</a>.
                </p>

                <div className="a-card-divider" />

                <div style={{ fontSize: '13px' }}>
                  Already have an account?{' '}
                  <button type="button" className="a-link" onClick={() => { setMode('LOGIN'); setLoginStep(1); setError(''); setSuccess(''); }}>
                    Sign in ▶
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Create Account Separator - Only shown in Step 1 of Login */}
        {!needsCompleteProfile && mode === 'LOGIN' && loginStep === 1 && (
          <>
            <div className="a-divider">
              <h5>New to Balochi Bazzar?</h5>
            </div>
            <button
              className="a-button-secondary"
              style={{ width: '350px' }}
              onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}
            >
              Create your Balochi Bazzar account
            </button>
          </>
        )}

        {/* Footer */}
        <footer className="a-footer">
          <div className="a-footer-links">
            <a href="#">Conditions of Use</a>
            <a href="#">Privacy Notice</a>
            <a href="#">Help</a>
          </div>
          <div className="a-footer-copyright">
            © 2005-{new Date().getFullYear()}, Balochi Bazzar or its affiliates
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
            <text x="10" y="28" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="21" fill="#111" letterSpacing="-0.8">
              balochi<tspan fontWeight="normal">bazzar</tspan>
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
