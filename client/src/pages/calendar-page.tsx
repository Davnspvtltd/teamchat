import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function CalendarPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");

  // Mock data for events (in a real app, this would come from the API)
  const events = [
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(new Date().setHours(10, 0, 0, 0)),
      duration: 60,
      type: "meeting",
    },
    {
      id: 2,
      title: "Project Review",
      date: new Date(new Date().setHours(14, 0, 0, 0)),
      duration: 90,
      type: "meeting",
    },
    {
      id: 3,
      title: "Client Call",
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      duration: 45,
      type: "call",
    },
  ];

  const upcomingEvents = events
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const formatEventTime = (date: Date, duration: number) => {
    const endTime = new Date(date.getTime() + duration * 60000);
    return `${format(date, "h:mm a")} - ${format(endTime, "h:mm a")}`;
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your schedule and events</p>
        </div>
        <div className="flex gap-3">
          <Select value={view} onValueChange={(value) => setView(value as "day" | "week" | "month")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> 
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="mb-6">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Upcoming Events</h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(event.date, "EEEE, MMMM d")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 pt-0">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{formatEventTime(event.date, event.duration)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                <p>No upcoming events</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">My Calendars</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Personal</span>
                </div>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Work</span>
                </div>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span>Team</span>
                </div>
                <Switch checked={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full p-4">
            <div className="text-center text-lg text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
              <div>
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Calendar functionality coming soon</p>
                <p className="text-sm">The full calendar view will be implemented in the next update</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}