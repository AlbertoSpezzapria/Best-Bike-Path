import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

// Components & UI
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressAutocomplete } from "@/components/app/AddressAutocomplete";
import { toast } from "sonner";

// Icons
import {
  Search,
  MapPin,
  Navigation,
  Route,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

// --- TYPES ---

interface PathResult {
  id: number;
  name: string;
  status: string;
  score: number;
  distance?: number;
  duration?: string;
  issues?: number;
}

// --- CONFIG & UTILS ---

/** Returns UI styling and labels based on path infrastructure status */
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; icon: any }> = {
    optimal: { label: "Optimal", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
    good: { label: "Good", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: CheckCircle },
    sufficient: { label: "Sufficient", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: AlertTriangle },
    maintenance: { label: "Maintenance", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertTriangle },
  };
  return configs[status] || { label: "Unknown", color: "bg-muted text-muted-foreground", icon: AlertTriangle };
};

/** Converts a string address into latitude and longitude using OpenStreetMap */
const geocodeAddress = async (address: string) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    return data?.[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// --- MAIN COMPONENT ---

const ExplorePaths = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundPaths, setFoundPaths] = useState<PathResult[]>([]);

  /** Invokes Supabase Edge Function to find paths connecting origin and destination */
  const fetchPaths = async (coords: { origin: any; destination: any }) => {
    const { data, error } = await supabase.functions.invoke('func_path_search', {
      body: { 
        origin_lat: coords.origin.lat, origin_lon: coords.origin.lon,
        dest_lat: coords.destination.lat, dest_lon: coords.destination.lon,
      },
    });
    
    if (error) throw error;
    return data;
  };

  /** Orchestrates geocoding and path retrieval */
  const handleSearch = async () => {
    if (!origin || !destination) {
      return toast.error("Please enter both origin and destination");
    }

    setIsSearching(true);
    try {
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(origin),
        geocodeAddress(destination),
      ]);

      if (!originCoords || !destCoords) {
        toast.error("Could not locate one of the addresses");
        setIsSearching(false);
        return;
      }

      const paths = await fetchPaths({ origin: originCoords, destination: destCoords });
      setFoundPaths(paths || []);
      toast.success(`Found ${paths?.length || 0} paths`);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search");
    } finally {
      setIsSearching(false);
    }
  };

  const isGuest = localStorage.getItem("guestMode") === "true";

  return (
    <div className="mx-2 lg:mx-4 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Explore Paths</h1>
        <p className="text-muted-foreground mt-1">Find the best bike paths in your area</p>
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
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Results Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">Paths Found</h2>
            <Badge variant="secondary">{foundPaths.length} results</Badge>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
            {foundPaths.map((path) => {
              const config = getStatusConfig(path.status);
              const StatusIcon = config.icon;

              return (
                <Card
                  key={path.id}
                  className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    const basePath = isGuest ? "/guest-app/guest-path/" : "/app/path/";
                    navigate(`${basePath}${path.id}`);
                  }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-foreground">{path.name}</h3>
                      <div className="text-primary font-bold">
                        {path.score ? Math.round(path.score) : "-"}/100
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {path.distance && (
                         <span className="flex items-center gap-1"><Route className="w-4 h-4" />{path.distance} km</span>
                      )}
                      {path.duration && (
                         <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{path.duration}</span>
                      )}
                      {!path.distance && !path.duration && (
                         <span className="text-xs italic">Details on click</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
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