'use client';

import { useEffect } from 'react';

export default function AdminLinkPage() {
  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    window.location.href = `http://${host}:5173`;
  }, []);

  const getAdminUrl = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:5173`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
      <h2>Redirecting to local admin dashboard...</h2>
      <p style={{ marginTop: '0.5rem' }}>If you are not redirected, click <a href={getAdminUrl()} style={{ color: 'var(--text-gold)' }}>here</a>.</p>
    </div>
  );
}
