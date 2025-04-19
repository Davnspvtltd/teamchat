import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Search, Upload, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, insertConversationSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: number) => void;
}

// Extended conversation schema for form
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  isGroup: z.literal(true),
  isPrivate: z.boolean().default(false),
  members: z.array(z.number()).min(1, "Add at least one member")
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated
}: CreateGroupModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupIcon, setGroupIcon] = useState<string | null>(null);

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isGroup: true,
      isPrivate: false,
      members: []
    }
  });

  // Fetch all users for member selection
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        description: "",
        isGroup: true,
        isPrivate: false,
        members: []
      });
      setSelectedMembers([]);
      setSearchQuery("");
      setGroupIcon(null);
    }
  }, [isOpen, form]);

  // Filter users based on search query
  const filteredUsers = allUsers?.filter(user => 
    user.id !== currentUser?.id && 
    !selectedMembers.some(member => member.id === user.id) &&
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupFormValues) => {
      const { isPrivate, ...conversationData } = data;
      const res = await apiRequest("POST", "/api/conversations", {
        ...conversationData,
        icon: groupIcon
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Group created",
        description: "Your group has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      onGroupCreated(data.conversation.id);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle adding a member
  const handleAddMember = (user: User) => {
    setSelectedMembers(prev => [...prev, user]);
    form.setValue("members", [...form.getValues("members"), user.id]);
    setSearchQuery("");
  };

  // Handle removing a member
  const handleRemoveMember = (userId: number) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
    form.setValue("members", form.getValues("members").filter(id => id !== userId));
  };

  // Handle form submission
  const onSubmit = (data: CreateGroupFormValues) => {
    createGroupMutation.mutate(data);
  };

  // Handle icon upload
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGroupIcon(event.target?.result as string);
      };
      reader.readAsDataURL(file);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Group</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Group Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  groupIcon 
                    ? "" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}>
                  {groupIcon ? (
                    <img 
                      src={groupIcon} 
                      alt="Group icon" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <label htmlFor="icon-upload" className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center border-2 border-white dark:border-gray-800 cursor-pointer">
                  <Pencil className="h-3 w-3" />
                  <input 
                    id="icon-upload" 
                    type="file" 
                    accept="image/*" 
                    className="sr-only" 
                    onChange={handleIconUpload}
                  />
                </label>
              </div>
            </div>
            
            {/* Group Name */}
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input 
                id="group-name"
                placeholder="Enter group name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            {/* Group Description */}
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Textarea 
                id="group-description"
                placeholder="What's this group about?"
                rows={3}
                {...form.register("description")}
              />
            </div>
            
            {/* Privacy Settings */}
            <div>
              <Label>Privacy</Label>
              <RadioGroup 
                defaultValue="public"
                className="mt-2"
                onValueChange={(value) => form.setValue("isPrivate", value === "private")}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="public" id="privacy-public" />
                  <Label htmlFor="privacy-public" className="font-normal cursor-pointer">
                    Open (anyone in the organization can join)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="privacy-private" />
                  <Label htmlFor="privacy-private" className="font-normal cursor-pointer">
                    Invite only (members must be invited)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Add Members */}
            <div>
              <Label>Add Members</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search people"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* User search results */}
              {searchQuery && filteredUsers.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className="p-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleAddMember(user)}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback>{getUserInitials(user.name || user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{user.name || user.username}</div>
                        {user.designation && (
                          <div className="text-xs text-gray-500">{user.designation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && filteredUsers.length === 0 && (
                <div className="mt-2 p-2 text-sm text-gray-500 text-center border border-gray-200 dark:border-gray-700 rounded-md">
                  No users found
                </div>
              )}
              
              {/* Selected Members */}
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMembers.map(member => (
                  <Badge 
                    key={member.id}
                    variant="secondary"
                    className="flex items-center gap-1 pl-1 pr-2 py-1"
                  >
                    <Avatar className="h-5 w-5 mr-1">
                      <AvatarImage src={member.profilePicture} />
                      <AvatarFallback>{getUserInitials(member.name || member.username)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{(member.name || member.username).split(' ')[0]}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              {form.formState.errors.members && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.members.message}</p>
              )}
            </div>
            
            {/* Create Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Create Group
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
