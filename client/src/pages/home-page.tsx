import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import ConversationsList from "@/components/conversations-list";
import ChatArea from "@/components/chat-area";
import UserProfileModal from "@/components/user-profile-modal";
import CreateGroupModal from "@/components/create-group-modal";
import CalendarPage from "@/pages/calendar-page";
import FilesPage from "@/pages/files-page";
import SettingsPage from "@/pages/settings-page";
import ProfilePage from "@/pages/profile-page";
import { useWebSocket } from "@/lib/websocket";
import { Conversation, User, Message } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquare, Users, Mail, Phone, Video, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  // Active section from sidebar
  const [activeSection, setActiveSection] = useState<string>("messages");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  
  // Fetch conversations
  const { data: conversations, refetch: refetchConversations } = useQuery<
    { conversation: Conversation, members: any[] }[]
  >({
    queryKey: ["/api/conversations"],
  });

  // Fetch all users for contacts
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
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
    setActiveSection("messages");
  };

  // Handle creating a new group
  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  // Handle navigation menu clicks from sidebar
  const handleSidebarNav = (section: string) => {
    setActiveSection(section);
    // If switching to messages and no conversation is selected, keep the UI empty
    // Otherwise, keep the current conversation if in messages section
    if (section !== "messages") {
      // Reset conversation selection when moving to another section
      setSelectedConversation(null);
    }
  };

  // Filter users based on search query
  const filteredUsers = allUsers?.filter(userItem => {
    if (!userSearchQuery) return true;
    
    const searchLower = userSearchQuery.toLowerCase();
    return (
      userItem.name?.toLowerCase().includes(searchLower) ||
      userItem.username.toLowerCase().includes(searchLower) ||
      userItem.email?.toLowerCase().includes(searchLower) ||
      userItem.designation?.toLowerCase().includes(searchLower)
    );
  });

  // Get user initials for avatar
  const getUserInitials = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get status color based on user availability
  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-400";
    
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-red-500";
      case "away":
        return "bg-yellow-500";
      case "dnd":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with navigation icons */}
      <Sidebar onNavigate={handleSidebarNav} activeItem={activeSection} />

      {/* Content based on active section */}
      {activeSection === "messages" ? (
        <>
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
                <MessageSquare className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No conversation selected</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Select a chat from the list or start a new conversation</p>
              <button 
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition duration-150 flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>New Message</span>
              </button>
            </div>
          )}
        </>
      ) : activeSection === "contacts" ? (
        // Contacts / Company Directory Section
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h1 className="text-xl font-semibold mb-4">Company Directory</h1>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search users by name, username, or designation..."
                className="pl-10"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* User List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredUsers && filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredUsers.map(userItem => (
                  <div 
                    key={userItem.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(userItem)}
                  >
                    <div className="relative mb-3">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={userItem.profilePicture || undefined} />
                        <AvatarFallback className="text-xl">
                          {getUserInitials(userItem.name || userItem.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-white dark:border-gray-800 ${getStatusColor(userItem.availability)}`}></div>
                    </div>
                    <h3 className="font-semibold text-lg truncate max-w-full">
                      {userItem.name || userItem.username}
                    </h3>
                    {userItem.designation && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{userItem.designation}</p>
                    )}
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // This would initiate a direct message - we'll handle separately
                          // For now, just open the profile
                          handleUserClick(userItem);
                        }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                {userSearchQuery ? (
                  <>
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>No users found matching "{userSearchQuery}"</p>
                    <Button 
                      variant="link" 
                      onClick={() => setUserSearchQuery("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>No users available in the directory</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : activeSection === "files" ? (
        <FilesPage />
      ) : activeSection === "calendar" ? (
        <CalendarPage />
      ) : activeSection === "settings" ? (
        <SettingsPage />
      ) : activeSection === "profile" ? (
        <ProfilePage />
      ) : (
        // Placeholder for any other sections
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
            <p className="text-gray-500 dark:text-gray-400">This feature is under development</p>
          </div>
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
