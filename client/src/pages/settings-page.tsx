import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import {
  Bell,
  Lock,
  User,
  LayoutGrid,
  Globe,
  Smartphone,
  GripVertical,
  Check,
} from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }),
  designation: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  enableAnimations: z.boolean().default(true),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  messageNotifications: z.boolean().default(true),
  mentionNotifications: z.boolean().default(true),
  systemNotifications: z.boolean().default(true),
  soundNotifications: z.boolean().default(true),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export default function SettingsPage() {
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      bio: user?.bio || "",
      designation: user?.designation || "",
    },
  });

  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
      fontSize: "medium",
      enableAnimations: true,
    },
  });

  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      messageNotifications: true,
      mentionNotifications: true,
      systemNotifications: true,
      soundNotifications: true,
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate({
      name: data.name,
      username: data.username,
      bio: data.bio,
      designation: data.designation,
    }, {
      onSuccess: () => {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const onAppearanceSubmit = (data: AppearanceFormValues) => {
    setTheme(data.theme);
    toast({
      title: "Appearance updated",
      description: "Your appearance preferences have been updated.",
    });
  };

  const onNotificationsSubmit = (data: NotificationsFormValues) => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been updated.",
    });
  };

  const getInitials = (name?: string): string => {
    if (!name) return user?.username?.substring(0, 2).toUpperCase() || "TC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Settings Header */}
      <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 overflow-y-auto hidden md:block">
          <div className="space-y-1">
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant={activeTab === "appearance" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("appearance")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Appearance
            </Button>
            <Button
              variant={activeTab === "notifications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button
              variant={activeTab === "privacy" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("privacy")}
            >
              <Lock className="h-4 w-4 mr-2" />
              Privacy & Security
            </Button>
          </div>
        </div>

        {/* Tabs for mobile */}
        <div className="md:hidden p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 w-full">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="profile" className="flex flex-col items-center space-y-1 py-2">
                <User className="h-4 w-4" />
                <span className="text-xs">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex flex-col items-center space-y-1 py-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="text-xs">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex flex-col items-center space-y-1 py-2">
                <Bell className="h-4 w-4" />
                <span className="text-xs">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex flex-col items-center space-y-1 py-2">
                <Lock className="h-4 w-4" />
                <span className="text-xs">Privacy</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      <div className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={user?.profilePicture || ""} />
                          <AvatarFallback className="text-xl">
                            {getInitials(user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                        {user?.availability && (
                          <div className="mt-4">
                            <Badge variant={
                              user.availability === "online" ? "default" : 
                              user.availability === "busy" ? "destructive" : 
                              user.availability === "away" ? "warning" : 
                              "outline"
                            }>
                              {user.availability.charAt(0).toUpperCase() + user.availability.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4 flex-1">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Your username" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public username.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="designation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Designation</FormLabel>
                              <FormControl>
                                <Input placeholder="Your job title or role" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your position or role in the organization.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Input placeholder="Tell us a little bit about yourself" {...field} />
                              </FormControl>
                              <FormDescription>
                                Brief description about yourself. This will be displayed on your profile.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending && (
                        <GripVertical className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update profile
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appearanceForm}>
                  <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-8">
                    <FormField
                      control={appearanceForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className={`flex flex-col items-center gap-2 rounded-md border p-4 cursor-pointer ${field.value === 'light' ? 'bg-primary/10 border-primary' : ''}`} onClick={() => field.onChange('light')}>
                              <div className="h-20 w-32 rounded-md border bg-white"></div>
                              <span>Light</span>
                              {field.value === 'light' && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <div className={`flex flex-col items-center gap-2 rounded-md border p-4 cursor-pointer ${field.value === 'dark' ? 'bg-primary/10 border-primary' : ''}`} onClick={() => field.onChange('dark')}>
                              <div className="h-20 w-32 rounded-md border bg-gray-900"></div>
                              <span>Dark</span>
                              {field.value === 'dark' && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <div className={`flex flex-col items-center gap-2 rounded-md border p-4 cursor-pointer ${field.value === 'system' ? 'bg-primary/10 border-primary' : ''}`} onClick={() => field.onChange('system')}>
                              <div className="h-20 w-32 rounded-md border bg-gradient-to-r from-white to-gray-900"></div>
                              <span>System</span>
                              {field.value === 'system' && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                          <FormDescription>
                            Select the theme for the application. System will follow your device settings.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={appearanceForm.control}
                      name="fontSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Size</FormLabel>
                          <div className="flex gap-4">
                            <div 
                              className={`py-2 px-4 border rounded-md cursor-pointer ${field.value === 'small' ? 'bg-primary/10 border-primary' : ''}`}
                              onClick={() => field.onChange('small')}
                            >
                              <span className="text-sm">Small</span>
                            </div>
                            <div 
                              className={`py-2 px-4 border rounded-md cursor-pointer ${field.value === 'medium' ? 'bg-primary/10 border-primary' : ''}`}
                              onClick={() => field.onChange('medium')}
                            >
                              <span className="text-base">Medium</span>
                            </div>
                            <div 
                              className={`py-2 px-4 border rounded-md cursor-pointer ${field.value === 'large' ? 'bg-primary/10 border-primary' : ''}`}
                              onClick={() => field.onChange('large')}
                            >
                              <span className="text-lg">Large</span>
                            </div>
                          </div>
                          <FormDescription>
                            Select the font size for the application.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={appearanceForm.control}
                      name="enableAnimations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Animations
                            </FormLabel>
                            <FormDescription>
                              Enable animations for a smoother experience.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit">
                      Save preferences
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                    <div className="space-y-4">
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive emails for important updates and activities.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Push Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive push notifications on your device.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="messageNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Message Notifications
                              </FormLabel>
                              <FormDescription>
                                Notify when you receive new messages.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="mentionNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Mention Notifications
                              </FormLabel>
                              <FormDescription>
                                Notify when someone mentions you in a message.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="systemNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                System Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications about system updates.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="soundNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Sound Notifications
                              </FormLabel>
                              <FormDescription>
                                Play sound when receiving notifications.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit">
                      Save preferences
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Configure your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Account Security</h3>
                    <div className="mt-3 space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Two-Factor Authentication
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                        <Button variant="outline">Set up</Button>
                      </div>
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Change Password
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Update your password for better security.
                          </p>
                        </div>
                        <Button variant="outline">Change</Button>
                      </div>
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Account Activity
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            View a log of your account logins and sessions.
                          </p>
                        </div>
                        <Button variant="outline">View log</Button>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium">Privacy Settings</h3>
                    <div className="mt-3 space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Online Status Visibility
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Control who can see when you're online.
                          </p>
                        </div>
                        <Select defaultValue="everyone">
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Everyone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="everyone">Everyone</SelectItem>
                            <SelectItem value="contacts">Contacts only</SelectItem>
                            <SelectItem value="nobody">Nobody</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Profile Visibility
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Control who can see your profile information.
                          </p>
                        </div>
                        <Select defaultValue="everyone">
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Everyone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="everyone">Everyone</SelectItem>
                            <SelectItem value="contacts">Contacts only</SelectItem>
                            <SelectItem value="nobody">Nobody</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Read Receipts
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Let others know when you've read their messages.
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium text-red-500">Danger Zone</h3>
                    <div className="mt-3 space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border border-red-200 dark:border-red-900 p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Delete Account
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Permanently delete your account and all associated data.
                          </p>
                        </div>
                        <Button variant="destructive">Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}