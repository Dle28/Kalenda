import React from 'react';
import '../profile.css';
import PageTransition from '@/components/PageTransition';

export default function CreatorProfileLayout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
