import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Balochi Bazzar - Balochi Doch & Rentals in Gwadar',
  description: 'Premium e-commerce and renting of Balochi cultural suits, Sareeg, Chaddar, and customized hand embroidery in Gwadar city.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div style={{ height: '70px', backgroundColor: '#131a22' }} />}>
          <Header />
        </Suspense>

        {/* Child Pages */}
        <main style={{ minHeight: 'calc(100vh - 400px)' }}>
          {children}
        </main>

        {/* Dark Footer */}
        <footer className="footer-dark">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
              <div className="footer-col">
                <h4>Customer Care</h4>
                <ul>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">How to Buy</a></li>
                  <li><a href="#">Returns & Refunds</a></li>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Purchase & Rent Policy</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Balochi Bazzar Gwadar</h4>
                <ul>
                  <li><a href="#">About Balochi Bazzar</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Terms & Conditions</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Sectors Fulfillments</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Payment Channels</h4>
                <div className="footer-payment-logos">
                  <span className="payment-badge">COD</span>
                  <span className="payment-badge">HBL BANK</span>
                  <span className="payment-badge">EASYPAISA</span>
                  <span className="payment-badge">JAZZCASH</span>
                </div>
              </div>
              <div className="footer-col">
                <h4>Mobile App</h4>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>Test our mobile app on Google Play Store via Expo Go.</p>
                <div style={{ display: 'inline-block', backgroundColor: '#000', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #444' }}>
                  🤖 PLAY STORE PREVIEW
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '2rem', textAlign: 'center', fontSize: '12px', color: '#777799' }}>
              <p>&copy; {new Date().getFullYear()} Balochi Bazzar Pakistan. All rights reserved. Locally managed in Gwadar City.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
