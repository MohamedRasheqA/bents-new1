"use client";

import dynamic from 'next/dynamic';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Section1 from "@/components/Section1";
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import AmplitudeAnalytics from '@/components/AmplitudeAnalytics';
import { useSession } from '@/lib/hooks/useSession';
import { useAuth, useUser } from '@clerk/nextjs';

const AmplitudeDebug = dynamic(
  () => process.env.NODE_ENV === 'development'
    ? import('@/components/AmplitudeDebug')
    : Promise.resolve(() => null),
  { ssr: false }
);

export default function Home() {
  const { userId = null } = useAuth();
  const { user } = useUser();
  const username = user?.username || user?.firstName || 'Guest';
  const { handleStartChatting, isSignedIn } = useAuthRedirect();
  const {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading: sessionsLoading,
    error: sessionsError
  } = useSession();

  // Handle new conversation creation
  const handleNewConversation = () => {
    const newSession = { id: crypto.randomUUID(), conversations: [] };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <>
      <div className="mobile-visible">
        <Header 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewConversation={handleNewConversation}
          userId={userId}
          username={username}
        />
        <Section1 onStartChatting={handleStartChatting} isSignedIn={isSignedIn} />
        <Footer />
        <AmplitudeAnalytics />
      </div>
    </>
  );
}