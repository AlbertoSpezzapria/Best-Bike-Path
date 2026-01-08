import { useState } from "react";
import {
  Search,
  MapPin,
  Navigation,
  Star,
  Route,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const samplePaths = [
  {
    id: 1,
    name: "Milano Centro - Navigli",
    from: "Piazza Duomo",
    to: "Darsena",
    distance: 4.2,
    duration: "15 min",
    score: 92,
    status: "optimal",
    confirmedBy: 48,
    issues: 0,
    updatedAt: "2 hours ago",
  },
  {
    id: 2,
    name: "Parco Sempione Loop",
    from: "Arco della Pace",
    to: "Arco della Pace",
    distance: 5.8,
    duration: "22 min",
    score: 88,
    status: "good",
    confirmedBy: 32,
    issues: 1,
    updatedAt: "5 hours ago",
  },
  {
    id: 3,
    name: "Naviglio Grande - Corsico",
    from: "Naviglio Grande",
    to: "Corsico Centro",
    distance: 8.4,
    duration: "32 min",
    score: 75,
    status: "sufficient",
    confirmedBy: 15,
    issues: 3,
    updatedAt: "1 day ago",
  },
  {
    id: 4,
    name: "Città Studi - Lambrate",
    from: "Politecnico",
    to: "Stazione Lambrate",
    distance: 3.1,
    duration: "12 min",
    score: 45,
    status: "maintenance",
    confirmedBy: 8,
    issues: 5,
    updatedAt: "3 days ago",
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
    case "maintenance":
      return {
        label: "Manutenzione",
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        icon: AlertTriangle,
      };
    default:
      return {
        label: "Unknown",
        color: "bg-muted text-muted-foreground",
        icon: AlertTriangle,
      };
  }
};

const ExplorePaths = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Explore Paths
        </h1>
        <p className="text-muted-foreground mt-1">
          Find the best bike paths in your area
        </p>
      </div>

      {/* Search Section */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                placeholder="Origin (e.g., Piazza Duomo, Milan)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
              <Input
                placeholder="Destination (e.g., Navigli)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="lg:w-auto w-full">
              <Search className="w-4 h-4 mr-2" />
              Search Paths
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            <Select defaultValue="score">
              <SelectTrigger className="w-[160px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Sort by Score</SelectItem>
                <SelectItem value="distance">Sort by Distance</SelectItem>
                <SelectItem value="duration">Sort by Duration</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="optimal">Optimal Only</SelectItem>
                <SelectItem value="good">Good or Better</SelectItem>
                <SelectItem value="sufficient">Sufficient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2 border-border/50 overflow-hidden">
          <div className="relative h-[500px] bg-muted/30 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="text-center z-10">
              <MapPin className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <p className="text-muted-foreground max-w-sm mx-auto">
                Enter origin and destination to view available paths
                on the map
              </p>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">
              Paths Found
            </h2>
            <Badge variant="secondary">{samplePaths.length} results</Badge>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
            {samplePaths.map((path) => {
              const statusConfig = getStatusConfig(path.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={path.id}
                  className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {path.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {path.from} → {path.to}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <Star className="w-4 h-4 fill-primary" />
                          {path.score}
                        </div>
                      </div>
                    </div>

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
                      <Badge
                        variant="outline"
                        className={statusConfig.color}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {path.confirmedBy} conferme • {path.updatedAt}
                      </span>
                    </div>

                    {path.issues > 0 && (
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <AlertTriangle className="w-4 h-4" />
                        {path.issues} issue
                        {path.issues > 1 ? "s" : ""} reported
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePaths;
