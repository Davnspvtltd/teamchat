import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderClosed,
  File,
  ImageIcon,
  FileText,
  FileSpreadsheet,
  FilePdf,
  FileArchive,
  FileVideo,
  FileAudio,
  FileCode,
  MoreVertical,
  Download,
  Trash,
  Edit,
  Share,
  Search,
  Upload,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

export default function FilesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  // In a real app, this would be fetched from the backend
  const files = [
    {
      id: 1,
      name: "Project Proposal.pdf",
      type: "pdf",
      size: 2.5, // in MB
      uploadedAt: new Date(2023, 3, 15),
      owner: "Me",
    },
    {
      id: 2,
      name: "Meeting Notes.docx",
      type: "document",
      size: 0.8,
      uploadedAt: new Date(2023, 3, 20),
      owner: "Me",
    },
    {
      id: 3,
      name: "Budget.xlsx",
      type: "spreadsheet",
      size: 1.2,
      uploadedAt: new Date(2023, 3, 22),
      owner: "John Smith",
    },
    {
      id: 4,
      name: "Team Photo.jpg",
      type: "image",
      size: 3.5,
      uploadedAt: new Date(2023, 3, 25),
      owner: "Me",
    },
    {
      id: 5,
      name: "Presentation.pptx",
      type: "presentation",
      size: 5.8,
      uploadedAt: new Date(2023, 3, 28),
      owner: "Sarah Jones",
    },
    {
      id: 6,
      name: "Source Code.zip",
      type: "archive",
      size: 12.4,
      uploadedAt: new Date(2023, 4, 2),
      owner: "Me",
    },
  ];

  const getIconForFileType = (type: string) => {
    switch (type) {
      case "pdf":
        return <FilePdf className="h-6 w-6 text-red-500" />;
      case "document":
        return <FileText className="h-6 w-6 text-blue-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case "image":
        return <ImageIcon className="h-6 w-6 text-purple-500" />;
      case "presentation":
        return <FileText className="h-6 w-6 text-orange-500" />;
      case "archive":
        return <FileArchive className="h-6 w-6 text-yellow-500" />;
      case "video":
        return <FileVideo className="h-6 w-6 text-pink-500" />;
      case "audio":
        return <FileAudio className="h-6 w-6 text-teal-500" />;
      case "code":
        return <FileCode className="h-6 w-6 text-gray-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1000)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "size") {
      return a.size - b.size;
    } else if (sortBy === "owner") {
      return a.owner.localeCompare(b.owner);
    } else {
      // Default to date
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    }
  });

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Files Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Files</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and share your files</p>
        </div>
        <div className="flex flex-col w-full md:flex-row md:w-auto gap-3">
          <div className="relative w-full md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search files..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Upload className="w-4 h-4 mr-2" /> 
            Upload
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" /> 
            New Folder
          </Button>
        </div>
      </div>

      {/* Files Content */}
      <div className="p-6 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="font-medium text-lg">All Files</div>
            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (newest first)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="size">Size (smallest first)</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  className="rounded-none p-2 h-10"
                  onClick={() => setView("grid")}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </Button>
                <Button
                  variant={view === "list" ? "default" : "ghost"}
                  className="rounded-none p-2 h-10"
                  onClick={() => setView("list")}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {view === "grid" ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedFiles.map((file) => (
                <Card key={file.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-700">
                        {getIconForFileType(file.type)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Share className="h-4 w-4 mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-500">
                            <Trash className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <CardTitle className="text-base font-medium truncate">
                      {file.name}
                    </CardTitle>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(file.size)}
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-gray-500 dark:text-gray-400 pt-0 flex justify-between items-center">
                    <div>{format(file.uploadedAt, "MMM d, yyyy")}</div>
                    <div>{file.owner}</div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiles.map((file) => (
                    <TableRow key={file.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="flex items-center gap-2">
                        {getIconForFileType(file.type)}
                        <span className="font-medium">{file.name}</span>
                      </TableCell>
                      <TableCell>{file.owner}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{format(file.uploadedAt, "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Download className="h-4 w-4 mr-2" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Share className="h-4 w-4 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-red-500">
                              <Trash className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}