import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Balochi Bazzar',
    short_name: 'Bazzar',
    description: 'Premium Balochi cultural suits and dress rentals in Gwadar',
    start_url: '/',
    display: 'standalone',
    background_color: '#131a22',
    theme_color: '#ff9900',
    icons: [
      {
        src: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=192&q=80',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=512&q=80',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  };
}
