import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ezzy Bites | Premium Fast Food Cafe',
    short_name: 'EzzyBites',
    description: 'Experience premium fast food redefined. Quality, speed, and taste unified in one perfect bite.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ef4444',
    icons: [
      {
        src: 'https://placehold.co/192x192/ef4444/ffffff?text=EB',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://placehold.co/512x512/ef4444/ffffff?text=EB',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
