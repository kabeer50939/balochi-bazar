'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({
  children,
  header,
  footer
}: {
  children: any;
  header: any;
  footer: any;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasShown = sessionStorage.getItem('bazar_splash_shown');
    if (hasShown) {
      setShowSplash(false);
      return;
    }

    const fadeTimeout = setTimeout(() => {
      setFadeSplash(true);
    }, 1000);

    const removeTimeout = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('bazar_splash_shown', 'true');
    }, 1400);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner on mobile/tablet viewports
      if (window.innerWidth <= 768) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      const dismissed = sessionStorage.getItem('bazar_ios_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowIosPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, #ff6b2b 0%, #f85606 100%)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeSplash ? 0 : 1,
          transition: 'opacity 0.4s ease-in-out',
          pointerEvents: 'none'
        }}>
          {/* Logo animation */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            animation: 'pulse 1.8s infinite ease-in-out'
          }}>
            <div style={{
              width: '85px',
              height: '85px',
              backgroundColor: '#ffffff',
              color: '#f85606',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '48px',
              fontStyle: 'italic',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)',
            }}>
              B
            </div>
            <span style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '1px'
            }}>
              BALOCHI <span style={{ color: '#ffe5d9', fontWeight: '400', fontStyle: 'italic' }}>BAZAR</span>
            </span>
            <div style={{
              width: '40px',
              height: '3px',
              backgroundColor: '#ffffff',
              borderRadius: '2px',
              marginTop: '0.5rem',
            }}></div>
            <span style={{
              fontSize: '11px',
              color: '#ffe5d9',
              letterSpacing: '0.5px',
              marginTop: '4px'
            }}>
              Gwadar Premium Atelier
            </span>
          </div>
          
          <style>{`
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.03); opacity: 1; }
              100% { transform: scale(0.95); opacity: 0.8; }
            }
          `}</style>
        </div>
      )}
      {header}
      <main style={{ minHeight: 'calc(100vh - 400px)' }}>
        {children}
      </main>
      {footer}

      {/* Chrome/Android PWA Install Banner */}
      {showInstallBanner && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '12px',
          right: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
          padding: '12px 16px',
          zIndex: 9998,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '22px'
            }}>B</div>
            <div>
              <strong style={{ fontSize: '12px', color: 'var(--text-dark)', display: 'block' }}>Install Balochi Bazzar App</strong>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Fast checkout & tracking on mobile</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleInstallClick} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}>
              Install
            </button>
            <button onClick={() => setShowInstallBanner(false)} style={{ border: 'none', background: 'none', fontSize: '18px', color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}>
              &times;
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari PWA Install Banner */}
      {showIosPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '12px',
          right: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
          padding: '12px 16px',
          zIndex: 9998,
          animation: 'slideUp 0.3s ease-out',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <strong style={{ fontSize: '12px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✨ Add Balochi Bazzar to Home Screen
            </strong>
            <button onClick={() => { setShowIosPrompt(false); sessionStorage.setItem('bazar_ios_prompt_dismissed', 'true'); }} style={{ border: 'none', background: 'none', fontSize: '18px', color: 'var(--text-muted)', padding: '0 4px', cursor: 'pointer' }}>
              &times;
            </button>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
            Tap the share button <span style={{ fontSize: '12px' }}>📤</span> in the Safari browser toolbar, scroll down, and select <strong>Add to Home Screen</strong> <span style={{ fontSize: '12px' }}>➕</span>.
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
