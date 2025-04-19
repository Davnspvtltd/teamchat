import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import ConversationsList from "@/components/conversations-list";
import ChatArea from "@/components/chat-area";
import UserProfileModal from "@/components/user-profile-modal";
import CreateGroupModal from "@/components/create-group-modal";
import { useWebSocket } from "@/lib/websocket";
import { Conversation, User, Message } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  
  // Fetch conversations
  const { data: conversations, refetch: refetchConversations } = useQuery<
    { conversation: Conversation, members: any[] }[]
  >({
    queryKey: ["/api/conversations"],
  });

  // Process WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'new_message':
        // Refetch conversations to update last message
        refetchConversations();
        break;
      case 'user_status':
        if (lastMessage.payload.status === 'online') {
          setOnlineUsers(prev => new Set([...prev, lastMessage.payload.userId]));
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(lastMessage.payload.userId);
            return newSet;
          });
        }
        break;
      case 'typing':
        const { conversationId, userId, isTyping } = lastMessage.payload;
        
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          
          if (!newMap.has(conversationId)) {
            newMap.set(conversationId, new Set());
          }
          
          const typingUsersInConversation = newMap.get(conversationId)!;
          
          if (isTyping) {
            typingUsersInConversation.add(userId);
          } else {
            typingUsersInConversation.delete(userId);
          }
          
          return newMap;
        });
        break;
    }
  }, [lastMessage, refetchConversations]);

  // Handle showing user profile modal
  const handleUserClick = (clickedUser: User) => {
    setSelectedUser(clickedUser);
    setShowUserProfile(true);
  };

  // Handle user clicking on conversation in the list
  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversation(conversationId);
  };

  // Handle creating a new group
  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with navigation icons */}
      <Sidebar />

      {/* Conversations list */}
      <ConversationsList 
        conversations={conversations || []}
        selectedConversationId={selectedConversation}
        onConversationSelect={handleConversationSelect}
        onCreateGroup={handleCreateGroup}
        onUserClick={handleUserClick}
        onlineUsers={onlineUsers}
      />

      {/* Chat area or empty state */}
      {selectedConversation ? (
        <ChatArea 
          conversationId={selectedConversation}
          onUserClick={handleUserClick} 
          typingUsers={typingUsers.get(selectedConversation) || new Set()}
        />
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No conversation selected</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Select a chat from the list or start a new conversation</p>
          <button 
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-150 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>New Message</span>
          </button>
        </div>
      )}

      {/* User profile modal */}
      <UserProfileModal 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
        user={selectedUser}
      />

      {/* Create group modal */}
      <CreateGroupModal 
        isOpen={showCreateGroup} 
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(groupId) => {
          setSelectedConversation(groupId);
          refetchConversations();
        }}
      />
    </div>
  );
}
