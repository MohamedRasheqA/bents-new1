'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

// Types
export interface Conversation {
  id: string;
  question: string;
  text: string;
  initial_answer?: string;
  videoLinks?: {
    [key: string]: {
      urls: string[];
      timestamp: string;
      video_title: string;
      description: string;
    };
  };
  related_products?: Array<{
    id: string;
    title: string;
    link: string;
    tags: string[];
    description?: string;
    price?: string;
    category?: string;
    image_data?: string;
  }>;
  timestamp: string;
}

export interface Session {
  id: string;
  conversations: Conversation[];
}

interface UseSessionReturn {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  error: string | null;
}

export function useSession(): UseSessionReturn {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/get-session', {
          headers: {
            'x-user-id': userId
          }
        });
        const savedSessions = response.data;

        if (Array.isArray(savedSessions) && savedSessions.length > 0) {
          setSessions(savedSessions);
          // Don't set currentSessionId here - let the page create a new one
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        setError('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [userId]);

  const updateSessions = useCallback(async (newSessions: Session[]) => {
    if (!userId || !Array.isArray(newSessions)) return;

    const validSessions = newSessions.filter(session => 
      session && session.id && Array.isArray(session.conversations)
    );

    if (validSessions.length > 0) {
      setSessions(validSessions);
      try {
        await axios.post('/api/set-session', 
          { sessions: validSessions },
          { headers: { 'x-user-id': userId } }
        );
      } catch (error) {
        console.error('Failed to update sessions:', error);
        setError('Failed to save chat history');
      }
    }
  }, [userId]);

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading,
    error
  };
} 
