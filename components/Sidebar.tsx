import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  conversations: {
    id: string;
    question: string;
    timestamp: string;
  }[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transition-transform transform">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="overflow-y-auto h-full pb-20">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
              session.id === currentSessionId ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSessionSelect(session.id)}
          >
            {session.conversations.length > 0 ? (
              <>
                <p className="font-medium truncate">
                  {session.conversations[0].question}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(session.conversations[0].timestamp), { addSuffix: true })}
                </p>
                <p className="text-sm text-gray-500">
                  {session.conversations.length} messages
                </p>
              </>
            ) : (
              <p className="text-gray-500">New Conversation</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 