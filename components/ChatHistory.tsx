import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface Conversation {
  id: string;
  question: string;
  timestamp: string;
  text: string;
  videoLinks?: any;
  related_products?: any[];
}

interface ChatHistoryProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  conversations: Conversation[];
  onConversationSelect: (id: string) => void;
  currentConversationId?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  setIsOpen,
  conversations,
  onConversationSelect,
  currentConversationId
}) => {
  // Add loading state for API calls
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle conversation selection with database update
  const handleConversationSelect = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Call the parent's onConversationSelect
      onConversationSelect(id);
      
      // Close the sidebar on mobile
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setError('Failed to select conversation');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40",
          "w-64 bg-white border-r",
          "transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-4 h-full overflow-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle size={20} />
            Chat History
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm">No chat history yet</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationSelect(conv.id)}
                  disabled={isLoading}
                  className={cn(
                    "w-full text-left p-3 rounded-lg",
                    "hover:bg-gray-100 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    currentConversationId === conv.id && "bg-gray-100",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {conv.question}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(conv.timestamp), 'MMM d, h:mm a')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHistory;