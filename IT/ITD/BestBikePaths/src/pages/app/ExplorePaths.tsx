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
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";
import { AddressAutocomplete } from "@/components/app/AddressAutocomplete";

// samplePaths removed

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

const geocodeAddress = async (address: string) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

interface PathResult {
  id: number;
  name: string;
  status: string;
  score: number;
  geo_match_score?: number;
  // properties matching UI but maybe missing in API response
  distance?: number;
  duration?: string;
  confirmedBy?: number;
  updatedAt?: string;
  issues?: number;
}

const ExplorePaths = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundPaths, setFoundPaths] = useState<PathResult[]>([]);
  const navigate = useNavigate();
  const searchCoordinates = async () => {
    if (!origin || !destination) {
      toast.error("Please enter both origin and destination");
      return;
    }

    setIsSearching(true);
    try {
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(origin),
        geocodeAddress(destination),
      ]);

      if (!originCoords) {
        toast.error(`Could not find coordinates for: ${origin}`);
        return;
      }
      if (!destCoords) {
        toast.error(`Could not find coordinates for: ${destination}`);
        return;
      }

      const coords = {
        origin: originCoords,
        destination: destCoords,
      };
      
      console.log("Search Result:", coords);
      
      return coords;
      
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search");
    } finally {
      // setIsSearching(false); // keep loading until fetchPaths done
    }
  };

  const fetchPaths = async (coords: any) => {
    console.log("Fetching paths for coordinates:")
    console.log(coords.origin.lat)
    console.log(coords.origin.lon)
    console.log(coords.destination.lat)
    console.log(coords.destination.lon)
    const { data, error } = await supabase.functions.invoke('func_path_search', {
      body: { 
        origin_lat: coords.origin.lat,
        origin_lon: coords.origin.lon,
        dest_lat: coords.destination.lat,
        dest_lon: coords.destination.lon,
      },
    })
    
    if (error) {
      console.error('Error fetching paths:', error)
      toast.error('An error occurred while fetching paths')
      return
    }

    console.log('Paths data:', data)
    toast.success(`Found ${data.length} paths`)
    return data
  }

  const handleSearch = async () => {
    const coords = await searchCoordinates();
    if (coords) {
      const paths = await fetchPaths(coords);
      if (paths) {
        setFoundPaths(paths);
      }
    }
    setIsSearching(false);
  }

  return (
    <div className="mx-2 lg:mx-4 p-6 lg:p-8 space-y-8">
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
            <div className="flex-1">
              <AddressAutocomplete
                placeholder="Origin (e.g., Piazza Duomo, Milan)"
                value={origin}
                onChange={setOrigin}
                icon={<MapPin className="w-5 h-5 text-primary" />}
              />
            </div>
            <div className="flex-1">
               <AddressAutocomplete
                placeholder="Destination (e.g., Navigli)"
                value={destination}
                onChange={setDestination}
                icon={<Navigation className="w-5 h-5 text-accent" />}
              />
            </div>
            <Button className="lg:w-auto w-full" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
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

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">
              Paths Found
            </h2>
            <Badge variant="secondary">{foundPaths.length} results</Badge>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
            {foundPaths.map((path) => {
              const statusConfig = getStatusConfig(path.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={path.id}
                  className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    // Usa i backticks ` ` non le virgolette " " o ' '
                    navigate(`/app/path/${path.id}`); 
                  }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {path.name}
                        </h3>
                        {/* 
                          API currently doesn't return from/to addresses 
                          We can conditionally render or hide for now
                        */}
                        {/* <p className="text-sm text-muted-foreground">
                           NA
                        </p> */}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <Star className="w-4 h-4 fill-primary" />
                          {path.score ? Math.round(path.score) : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {path.distance && (
                         <span className="flex items-center gap-1 text-muted-foreground">
                          <Route className="w-4 h-4" />
                          {path.distance} km
                        </span>
                      )}
                      {path.duration && (
                         <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {path.duration}
                        </span>
                      )}
                      {!path.distance && !path.duration && (
                         <span className="text-xs text-muted-foreground italic">
                           Details available on click
                         </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={statusConfig.color}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      
                       {/* updatedAt missing in API */}
                       {/* <span className="text-xs text-muted-foreground">
                        {path.confirmedBy} conferme • {path.updatedAt}
                      </span> */}
                    </div>

                    {path.issues ? (
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <AlertTriangle className="w-4 h-4" />
                        {path.issues} issue{path.issues > 1 ? "s" : ""} reported
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
             {foundPaths.length === 0 && !isSearching && (
                 <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                     No paths found matching criteria.
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePaths;
