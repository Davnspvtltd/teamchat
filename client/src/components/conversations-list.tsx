import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Conversation, User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ConversationsListProps {
  conversations: { conversation: Conversation; members: User[] }[];
  selectedConversationId: number | null;
  onConversationSelect: (id: number) => void;
  onCreateGroup: () => void;
  onUserClick: (user: User) => void;
  onlineUsers: Set<number>;
}

export default function ConversationsList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onCreateGroup,
  onUserClick,
  onlineUsers,
}: ConversationsListProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  // Fetch all users for the company directory
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((convo) => {
      // Apply search filter if query exists
      if (searchQuery) {
        if (convo.conversation.isGroup && convo.conversation.name) {
          return convo.conversation.name.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          // For DMs, search the other user's name
          const otherUser = convo.members.find(m => m.id !== user?.id);
          return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
        }
      }

      // Apply tab filter
      switch (filter) {
        case "unread":
          return false; // No unread implementation yet
        case "groups":
          return convo.conversation.isGroup;
        case "direct":
          return !convo.conversation.isGroup;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by most recent message (placeholder - we'd actually want to sort by most recent message)
      return new Date(b.conversation.createdAt).getTime() - new Date(a.conversation.createdAt).getTime();
    });

  // Get conversation name and profile picture
  const getConversationDisplayInfo = (convo: { conversation: Conversation; members: User[] }) => {
    if (convo.conversation.isGroup) {
      return {
        name: convo.conversation.name || "Unnamed Group",
        image: convo.conversation.icon,
        isGroup: true,
        membersCount: convo.members.length,
        status: null, // Groups don't have status
      };
    } else {
      // Find the other user in a DM conversation
      const otherUser = convo.members.find(m => m.id !== user?.id);
      return {
        name: otherUser?.name || otherUser?.username || "Unknown User",
        image: otherUser?.profilePicture,
        isGroup: false,
        membersCount: null,
        status: otherUser ? otherUser.availability : null,
        userId: otherUser?.id,
      };
    }
  };

  // Get appropriate status indicator color
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

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, "h:mm a");
    } else if (messageDate.getFullYear() === now.getFullYear()) {
      return format(messageDate, "MMM d");
    } else {
      return format(messageDate, "MM/dd/yy");
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={cn(
      "flex flex-col w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
      !showSidebar && "hidden md:flex"
    )}>
      {/* Header with search */}
      <div className="flex flex-col px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">TeamChat</h1>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCreateGroup}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Search conversations"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter tabs */}
      <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 overflow-y-auto p-0 m-0">
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((convo) => {
              const { name, image, isGroup, membersCount, status, userId } = getConversationDisplayInfo(convo);
              const isActive = selectedConversationId === convo.conversation.id;
              const isOnline = userId && onlineUsers.has(userId);
              const statusIndicator = isGroup ? null : (isOnline || status === "online" ? "online" : status);
              
              return (
                <div
                  key={convo.conversation.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition duration-150",
                    isActive && "bg-gray-50 dark:bg-gray-750"
                  )}
                  onClick={() => onConversationSelect(convo.conversation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex">
                      <div className="relative mr-3">
                        {isGroup ? (
                          <div className={cn(
                            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center",
                            image ? "" : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 font-semibold text-lg"
                          )}>
                            {image ? (
                              <img src={image} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                        ) : (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={image} />
                            <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
                          </Avatar>
                        )}
                        {statusIndicator && (
                          <div className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-800 rounded-full",
                            getStatusColor(statusIndicator)
                          )}></div>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h3>
                        </div>
                        {isGroup && membersCount && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {membersCount} members
                          </span>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {/* Placeholder for last message */}
                          {isGroup ? "Group conversation" : "Direct message"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(new Date(convo.conversation.createdAt))}
                      </span>
                      {/* Placeholder for unread count */}
                      {false && (
                        <Badge variant="default" className="mt-1 px-2 py-0.5 rounded-full bg-primary-500">
                          2
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="unread" className="flex-1 overflow-y-auto p-0 m-0">
          <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            No unread messages
          </div>
        </TabsContent>
        
        <TabsContent value="groups" className="flex-1 overflow-y-auto p-0 m-0">
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => {
                const { name, image, membersCount } = getConversationDisplayInfo(convo);
                const isActive = selectedConversationId === convo.conversation.id;
                
                return (
                  <div
                    key={convo.conversation.id}
                    className={cn(
                      "px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition duration-150",
                      isActive && "bg-gray-50 dark:bg-gray-750"
                    )}
                    onClick={() => onConversationSelect(convo.conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <div className="relative mr-3">
                          <div className={cn(
                            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center",
                            image ? "" : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 font-semibold text-lg"
                          )}>
                            {image ? (
                              <img src={image} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
                            {membersCount && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {membersCount} members
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {/* Placeholder for last message */}
                            Group conversation
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(new Date(convo.conversation.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                No group conversations
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="direct" className="flex-1 overflow-y-auto p-0 m-0">
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => {
                const { name, image, status, userId } = getConversationDisplayInfo(convo);
                const isActive = selectedConversationId === convo.conversation.id;
                const isOnline = userId && onlineUsers.has(userId);
                const statusIndicator = isOnline || status === "online" ? "online" : status;
                
                return (
                  <div
                    key={convo.conversation.id}
                    className={cn(
                      "px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition duration-150",
                      isActive && "bg-gray-50 dark:bg-gray-750"
                    )}
                    onClick={() => onConversationSelect(convo.conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <div className="relative mr-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={image} />
                            <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-800 rounded-full",
                            getStatusColor(statusIndicator)
                          )}></div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {/* Placeholder for last message */}
                            Direct message
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(new Date(convo.conversation.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                No direct messages
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
