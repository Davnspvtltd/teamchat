import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link,
  Clock,
  Calendar,
  UserPlus,
  MessageSquare,
  FileText,
  Image,
  Users,
  Settings,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // In a real app, this would be fetched from the backend
  const userActivity = [
    {
      id: 1,
      type: "message",
      content: "Sent a message to Team Project Discussion",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: 2,
      type: "file",
      content: "Uploaded Project Proposal.pdf",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 3,
      type: "image",
      content: "Shared an image in Design Team chat",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
    {
      id: 4,
      type: "user",
      content: "Added Sarah Jones to Marketing Project",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];

  const userTeams = [
    {
      id: 1,
      name: "Design Team",
      members: 6,
      role: "Member",
    },
    {
      id: 2,
      name: "Marketing Project",
      members: 4,
      role: "Admin",
    },
    {
      id: 3,
      name: "Product Development",
      members: 8,
      role: "Member",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "file":
        return <FileText className="h-4 w-4 text-orange-500" />;
      case "image":
        return <Image className="h-4 w-4 text-purple-500" />;
      case "user":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
  };

  const getInitials = (name?: string): string => {
    if (!name) return user?.username?.substring(0, 2).toUpperCase() || "TC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getAvailabilityColor = (status?: string) => {
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
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary-600 to-primary-400"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row sm:items-end sm:space-x-5">
            <div className="relative h-32 w-32 overflow-hidden rounded-full ring-4 ring-white dark:ring-gray-800">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.profilePicture || ""} />
                <AvatarFallback className="text-4xl">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div 
                className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 ${getAvailabilityColor(user?.availability)}`}
              ></div>
            </div>
            <div className="mt-6 sm:mt-0 flex-1">
              <div className="flex flex-col-reverse sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.name || user?.username}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.designation || "Member"}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs 
            defaultValue="overview" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start border-b-0 rounded-none bg-transparent p-0">
              <TabsTrigger 
                value="overview"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="teams"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3"
              >
                Teams
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user?.website && (
                  <div className="flex items-center gap-3">
                    <Link className="h-4 w-4 text-gray-500" />
                    <a href={user.website} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                      {user.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Joined {format(new Date(2023, 0, 15), "MMMM yyyy")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Communication</Badge>
                  <Badge variant="secondary">Project Management</Badge>
                  <Badge variant="secondary">Leadership</Badge>
                  <Badge variant="secondary">Problem Solving</Badge>
                  <Badge variant="secondary">Teamwork</Badge>
                  <Badge variant="secondary">Strategic Planning</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Teams you're a part of</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary-100 dark:bg-primary-900">
                        <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-gray-500">{team.members} members</p>
                      </div>
                    </div>
                    <Badge variant="outline">{team.role}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Main Content) */}
          <div className="md:col-span-2 space-y-6">
            {activeTab === "overview" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{user?.bio || "No bio provided."}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {userActivity.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
                              {getActivityIcon(activity.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p>{activity.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 text-center">
                      <Button variant="link" onClick={() => setActiveTab("activity")}>
                        View all activity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "teams" && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Teams</CardTitle>
                  <CardDescription>
                    Teams and projects you're currently part of
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userTeams.map((team) => (
                      <Card key={team.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{team.name}</CardTitle>
                            <Badge variant="outline">{team.role}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Users className="h-4 w-4" />
                              <span>{team.members} members</span>
                            </div>
                            <Button variant="ghost" size="sm">View</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "activity" && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Recent actions and activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {userActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p>{activity.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your profile settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Settings Management</h3>
                      <p className="text-gray-500 mb-4">Manage your profile settings through the settings page</p>
                      <Button onClick={() => setActiveTab("settings")}>
                        Go to Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}