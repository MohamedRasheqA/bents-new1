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
  updateSessionConversations: (sessionId: string, conversation: Conversation) => Promise<Conversation[] | null>;
  createNewSession: () => Promise<string>;
}

export function useSession(): UseSessionReturn {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sessions from database
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
          // Sort sessions by most recent conversation
          const sortedSessions = savedSessions.sort((a, b) => {
            const aTime = a.conversations[0]?.timestamp || '0';
            const bTime = b.conversations[0]?.timestamp || '0';
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          });
          
          setSessions(sortedSessions);
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

  const updateSessionConversations = useCallback(async (
    sessionId: string,
    newConversation: Conversation
  ): Promise<Conversation[] | null> => {
    if (!userId) return null;

    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          conversations: [...session.conversations, newConversation]
        };
      }
      return session;
    });

    try {
      await axios.post('/api/set-session', 
        { sessions: updatedSessions },
        { headers: { 'x-user-id': userId } }
      );
      
      setSessions(updatedSessions);
      const currentSession = updatedSessions.find(s => s.id === sessionId);
      return currentSession?.conversations || null;
    } catch (error) {
      console.error('Failed to update sessions:', error);
      setError('Failed to save chat history');
      return null;
    }
  }, [userId, sessions]);

  // Add new function to handle creating new conversations
  const createNewSession = useCallback(async () => {
    const newSession = { 
      id: crypto.randomUUID(), 
      conversations: [] 
    };
    
    // Add new session to the beginning of the array
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);

    try {
      await axios.post('/api/set-session',
        { sessions: updatedSessions },
        { headers: { 'x-user-id': userId } }
      );
    } catch (error) {
      console.error('Failed to create new session:', error);
      setError('Failed to create new chat');
    }

    return newSession.id;
  }, [userId, sessions]);

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading,
    error,
    updateSessionConversations,
    createNewSession
  };
} 
