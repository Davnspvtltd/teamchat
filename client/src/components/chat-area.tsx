import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/websocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneCall, Video, Info, Paperclip, Smile, Send } from "lucide-react";
import { User, Message, Conversation } from "@shared/schema";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface ChatAreaProps {
  conversationId: number;
  onUserClick: (user: User) => void;
  typingUsers: Set<number>;
}

export default function ChatArea({ 
  conversationId, 
  onUserClick,
  typingUsers
}: ChatAreaProps) {
  const { user: currentUser } = useAuth();
  const { sendMessage } = useWebSocket();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversation details
  const { data: conversationData } = useQuery<{
    conversation: Conversation;
    members: User[];
  }>({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
  });

  // Fetch messages for the conversation
  const { data: messages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        conversationId,
        content,
        attachments: []
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get conversation name and profile picture for header
  const getConversationDisplayInfo = () => {
    if (!conversationData) return { name: "", image: "", status: "" };

    const { conversation, members } = conversationData;
    
    if (conversation.isGroup) {
      return {
        name: conversation.name || "Unnamed Group",
        image: conversation.icon,
        members: members.length,
        status: `${members.length} members`,
        isGroup: true
      };
    } else {
      // Find the other user in a DM conversation
      const otherUser = members.find(m => m.id !== currentUser?.id);
      return {
        name: otherUser?.name || otherUser?.username || "Unknown User",
        image: otherUser?.profilePicture,
        status: otherUser?.availability || "offline",
        otherUser,
        isGroup: false
      };
    }
  };

  const conversationInfo = getConversationDisplayInfo();

  // Format timestamps for messages
  const formatMessageTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  // Group messages by date
  const getMessageGroups = () => {
    if (!messages) return [];

    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    let currentGroup: Message[] = [];

    messages.forEach(message => {
      const messageDate = new Date(message.sentAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: [...currentGroup]
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }

    return groups;
  };

  // Get user name from ID
  const getUserName = (userId: number) => {
    if (!conversationData) return "Unknown User";
    
    const user = conversationData.members.find(m => m.id === userId);
    return user?.name || user?.username || "Unknown User";
  };

  // Get user initials for avatar fallback
  const getUserInitials = (userId: number) => {
    const name = getUserName(userId);
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get user profile picture
  const getUserProfilePicture = (userId: number) => {
    if (!conversationData) return null;
    
    const user = conversationData.members.find(m => m.id === userId);
    return user?.profilePicture;
  };

  // Format date separator
  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  // Handle typing indicators
  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.textContent || "";
    setMessageText(content);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendMessage("typing", {
        conversationId,
        isTyping: true
      });
    }
    
    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendMessage("typing", {
        conversationId,
        isTyping: false
      });
    }, 2000);
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText);
    
    // Use WebSocket to send message for real-time updates
    sendMessage("message", {
      conversationId,
      content: messageText,
      attachments: []
    });
    
    // Clear input
    setMessageText("");
    if (messageInputRef.current) {
      messageInputRef.current.textContent = "";
      messageInputRef.current.focus();
    }
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendMessage("typing", {
        conversationId,
        isTyping: false
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get all users who are currently typing
  const getTypingUsers = () => {
    if (!conversationData || typingUsers.size === 0) return null;
    
    const typingUsersList = Array.from(typingUsers)
      .filter(id => id !== currentUser?.id)
      .map(id => {
        const user = conversationData.members.find(m => m.id === id);
        return user?.name || user?.username || "Someone";
      });
    
    if (typingUsersList.length === 0) return null;
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0]} is typing...`;
    } else if (typingUsersList.length === 2) {
      return `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`;
    } else {
      return `${typingUsersList[0]} and ${typingUsersList.length - 1} others are typing...`;
    }
  };

  return (
    <div className="hidden md:flex flex-col flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center cursor-pointer" onClick={() => {
          if (!conversationInfo.isGroup && conversationInfo.otherUser) {
            onUserClick(conversationInfo.otherUser);
          }
        }}>
          <div className="relative mr-3">
            {conversationInfo.isGroup ? (
              <div className={cn(
                "w-10 h-10 rounded-full overflow-hidden flex items-center justify-center",
                conversationInfo.image ? "" : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 font-semibold"
              )}>
                {conversationInfo.image ? (
                  <img src={conversationInfo.image} alt={conversationInfo.name} className="w-full h-full object-cover" />
                ) : (
                  conversationInfo.name.substring(0, 2).toUpperCase()
                )}
              </div>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversationInfo.image} />
                <AvatarFallback>
                  {conversationInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
            {!conversationInfo.isGroup && (
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full",
                conversationInfo.status === "online" ? "bg-green-500" :
                conversationInfo.status === "busy" ? "bg-red-500" :
                conversationInfo.status === "away" ? "bg-yellow-500" :
                conversationInfo.status === "dnd" ? "bg-red-500" :
                "bg-gray-400"
              )}></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{conversationInfo.name}</h2>
            {!conversationInfo.isGroup && conversationInfo.status === "online" && (
              <div className="flex items-center text-xs text-green-500">
                <span>Online</span>
              </div>
            )}
            {!conversationInfo.isGroup && conversationInfo.status !== "online" && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {conversationInfo.status === "busy" ? "Busy" :
                   conversationInfo.status === "away" ? "Away" :
                   conversationInfo.status === "dnd" ? "Do Not Disturb" :
                   "Offline"}
                </span>
              </div>
            )}
            {conversationInfo.isGroup && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{conversationInfo.status}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-300">
            <PhoneCall className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-300">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-300">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {getMessageGroups().map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Separator */}
            <div className="flex justify-center mb-6">
              <div className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                {formatDateSeparator(group.date)}
              </div>
            </div>

            {/* Messages */}
            {group.messages.map((message, messageIndex) => (
              <div key={message.id} className={message.senderId === currentUser?.id ? "flex justify-end mb-4" : "flex mb-4"}>
                {message.senderId !== currentUser?.id && (
                  <Avatar 
                    className="w-8 h-8 mr-2 mt-1 flex-shrink-0 cursor-pointer"
                    onClick={() => {
                      const messageUser = conversationData?.members.find(m => m.id === message.senderId);
                      if (messageUser) {
                        onUserClick(messageUser);
                      }
                    }}
                  >
                    <AvatarImage src={getUserProfilePicture(message.senderId) || ""} />
                    <AvatarFallback>{getUserInitials(message.senderId)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[75%]",
                  message.senderId === currentUser?.id ? "" : ""
                )}>
                  <div className={cn(
                    "p-3 rounded-lg shadow-sm",
                    message.senderId === currentUser?.id 
                      ? "bg-primary-600 text-white" 
                      : "bg-white dark:bg-gray-800"
                  )}>
                    <p className={cn(
                      message.senderId === currentUser?.id 
                        ? "text-white" 
                        : "text-gray-800 dark:text-gray-200"
                    )}>
                      {message.content}
                    </p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <path d="M16 13H8"></path>
                          <path d="M16 17H8"></path>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {message.attachments[0].name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(message.attachments[0].size / 1024)} KB
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    "text-xs text-gray-500 mt-1",
                    message.senderId === currentUser?.id ? "flex justify-end mr-1" : "ml-1"
                  )}>
                    <span>{formatMessageTime(new Date(message.sentAt))}</span>
                    {message.senderId === currentUser?.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {getTypingUsers() && (
          <div className="flex mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-2 mt-1 flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className="max-w-[75%]">
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-1">
                {getTypingUsers()}
              </div>
            </div>
          </div>
        )}

        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400">
            <Smile className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div
              ref={messageInputRef}
              className="px-4 py-2 min-h-[40px] max-h-32 overflow-y-auto focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 dark:empty:before:text-gray-400"
              contentEditable
              data-placeholder="Type a message..."
              onInput={handleInputChange}
              onKeyDown={handleKeyDown}
            ></div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:bg-primary-600 disabled:active:scale-100"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
