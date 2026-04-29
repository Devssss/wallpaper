import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'VibeWall | AI Wallpaper Generator',
  description: 'Generate unique 9:16 phone wallpapers based on your vibe.',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://picsum.photos/seed/vibewall-embed/1200/630',
      button: {
        title: 'Launch VibeWall',
        action: {
          type: 'launch_miniapp',
          name: 'VibeWall',
          url: 'https://ais-dev-bxjgrvfnm6lhxkt4nxf3bl-615601803900.asia-southeast1.run.app',
          splashImageUrl: 'https://picsum.photos/seed/vibewall-splash/1024/1024',
          splashBackgroundColor: '#050505',
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body suppressHydrationWarning className="bg-[#050505] text-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
