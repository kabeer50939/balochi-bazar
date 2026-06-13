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

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#131a22',
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
              width: '80px',
              height: '80px',
              backgroundColor: '#ff9900',
              color: 'white',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '46px',
              fontStyle: 'italic',
              boxShadow: '0 10px 30px rgba(255, 153, 0, 0.3)',
            }}>
              B
            </div>
            <span style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '1px'
            }}>
              BALOCHI <span style={{ color: '#ff9900', fontWeight: '400', fontStyle: 'italic' }}>BAZZAR</span>
            </span>
            <div style={{
              width: '40px',
              height: '3px',
              backgroundColor: '#ff9900',
              borderRadius: '2px',
              marginTop: '0.5rem',
            }}></div>
            <span style={{
              fontSize: '11px',
              color: '#a2a6a6',
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
    </>
  );
}
