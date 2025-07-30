import { Metadata } from 'next';
import FollowingPageClient from './following-page-client';

export const metadata: Metadata = {
  title: 'Following - Spotify MVP',
  description: 'Manage your followed artists and discover new music from them',
  openGraph: {
    title: 'Following - Spotify MVP',
    description: 'Manage your followed artists and discover new music from them',
    type: 'website',
  },
};

export default function FollowingPage() {
  return <FollowingPageClient />;
}