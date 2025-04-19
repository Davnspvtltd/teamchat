import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Mail, Phone, Building, MessageSquare } from "lucide-react";
import { User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user
}: UserProfileModalProps) {
  const { user: currentUser } = useAuth();

  // Start direct message mutation
  const startDirectMessageMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/conversations/direct", { userId });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      onClose();
      // Here you would typically select the conversation
      // This would be handled by the parent component
    }
  });

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string) => {
    if (!name) return (user?.username?.substring(0, 2) || "").toUpperCase();
    return name.split(" ").map(n => n?.[0] || "").join("").toUpperCase();
  };

  // Get availability status indicator color
  const getStatusColor = (status?: string) => {
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

  // Get readable availability status
  const getStatusText = (status?: string) => {
    if (!status) return "Offline";
    
    switch (status) {
      case "online":
        return "Online";
      case "busy":
        return "Busy";
      case "away":
        return "Away";
      case "dnd":
        return "Do Not Disturb";
      default:
        return "Offline";
    }
  };

  // Handle message button click
  const handleMessageClick = () => {
    if (user && user.id !== currentUser?.id) {
      startDirectMessageMutation.mutate(user.id);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-md overflow-hidden">
        <div className="relative">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-black bg-opacity-20 text-white hover:bg-opacity-30 transition"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Profile picture */}
          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: "32px" }}>
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white dark:border-gray-800 rounded-full ${getStatusColor(user.availability)}`}></div>
            </div>
          </div>
        </div>
        
        {/* Profile info */}
        <div className="mt-16 px-6 pb-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || user.username}</h3>
            <p className="text-gray-600 dark:text-gray-400">{user.designation || "Team Member"}</p>
            <div className="flex items-center justify-center mt-2">
              <span className={`flex items-center text-sm font-medium ${
                user.availability === "online" ? "text-green-500" :
                user.availability === "busy" ? "text-red-500" :
                user.availability === "away" ? "text-yellow-500" :
                user.availability === "dnd" ? "text-red-500" :
                "text-gray-500"
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColor(user.availability)}`}></span>
                {getStatusText(user.availability)}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Bio */}
            {user.bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</h4>
                <p className="text-gray-900 dark:text-gray-100">{user.bio}</p>
              </div>
            )}
            
            {/* Status message */}
            {user.status && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-gray-100 italic">"{user.status}"</p>
                </div>
              </div>
            )}
            
            {/* Contact info */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact</h4>
              <div className="space-y-2">
                {user.email && (
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phoneNumber && (
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.department}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            {user.id !== currentUser?.id && (
              <div className="flex space-x-2 pt-2">
                <Button 
                  className="flex-1 py-2"
                  onClick={handleMessageClick}
                  disabled={startDirectMessageMutation.isPending}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Message
                </Button>
                <Button variant="outline" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
