import { useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Route,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Star,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const myPaths = [
  {
    id: 1,
    name: "Casa - Ufficio",
    from: "Via Verdi, 10",
    to: "Via Dante, 25",
    distance: 6.8,
    duration: "25 min",
    status: "optimal",
    isPublic: true,
    createdAt: "15 Nov 2024",
    usedCount: 45,
  },
  {
    id: 2,
    name: "Giro del Parco",
    from: "Ingresso Nord",
    to: "Ingresso Nord",
    distance: 4.2,
    duration: "18 min",
    status: "good",
    isPublic: true,
    createdAt: "10 Nov 2024",
    usedCount: 28,
  },
  {
    id: 3,
    name: "Workout Loop",
    from: "Home",
    to: "Stadium",
    distance: 12.5,
    duration: "45 min",
    status: "sufficient",
    isPublic: false,
    createdAt: "5 Nov 2024",
    usedCount: 12,
  },
];

const savedPaths = [
  {
    id: 4,
    name: "Milano - Pavia Ciclabile",
    from: "Milano Porta Genova",
    to: "Pavia Centro",
    distance: 35.2,
    duration: "2h 10min",
    status: "optimal",
    author: "Marco B.",
    score: 94,
    savedAt: "20 Nov 2024",
  },
  {
    id: 5,
    name: "Lago di Como Tour",
    from: "Lecco",
    to: "Bellagio",
    distance: 28.6,
    duration: "1h 45min",
    status: "good",
    author: "Laura M.",
    score: 88,
    savedAt: "18 Nov 2024",
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "optimal":
      return {
        label: "Ottimale",
        color: "bg-green-500/10 text-green-600 border-green-500/20",
        icon: CheckCircle,
      };
    case "good":
      return {
        label: "Buono",
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        icon: CheckCircle,
      };
    case "sufficient":
      return {
        label: "Sufficiente",
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        icon: AlertTriangle,
      };
    default:
      return {
        label: "Sconosciuto",
        color: "bg-muted text-muted-foreground",
        icon: AlertTriangle,
      };
  }
};

const MyPaths = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            My Paths
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your created and saved paths
          </p>
        </div>
        <Button className="w-fit">
          <Plus className="w-4 h-4 mr-2" />
          New Path
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search in your paths..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="created" className="space-y-6">
        <TabsList>
          <TabsTrigger value="created" className="gap-2">
            <MapPin className="w-4 h-4" />
            Created by Me ({myPaths.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Star className="w-4 h-4" />
            Saved ({savedPaths.length})
          </TabsTrigger>
        </TabsList>

        {/* Created Paths */}
        <TabsContent value="created" className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myPaths.map((path) => {
              const statusConfig = getStatusConfig(path.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={path.id}
                  className="border-border/50 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-display">
                          {path.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {path.from} → {path.to}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {path.isPublic ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Make Public
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Route className="w-4 h-4" />
                        {path.distance} km
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {path.duration}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge variant={path.isPublic ? "default" : "secondary"}>
                        {path.isPublic ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {path.createdAt}
                      </span>
                      <span>{path.usedCount} uses</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add New Card */}
            <Card className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">Add New Path</p>
                <p className="text-sm text-center mt-1">
                  Create a new path manually
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Saved Paths */}
        <TabsContent value="saved" className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {savedPaths.map((path) => {
              const statusConfig = getStatusConfig(path.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={path.id}
                  className="border-border/50 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-display">
                          {path.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {path.from} → {path.to}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <Star className="w-4 h-4 fill-primary" />
                        {path.score}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Route className="w-4 h-4" />
                        {path.distance} km
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {path.duration}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        of {path.author}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        Saved on {path.savedAt}
                      </span>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyPaths;
