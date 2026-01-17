import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  MapPin,
  Navigation,
  Gauge,
  Clock,
  Route,
  Thermometer,
  Wind,
  Cloud,
  Edit3,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import BikeMap from "@/components/BikeMap";
import { Hazard } from "@/components/BikeMap";

// --- HELPER FUNCTIONS (Fuori dal componente) ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raggio della terra in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// --- COMPONENTE ---
const RecordTrip = () => {
  // 1. Stati di Controllo UI
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 2. Stati per "Automatic Tracking" (Dinamici)
  const [livePath, setLivePath] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number]>([45.4642, 9.1900]); 
  const [stats, setStats] = useState({
      distance: 0,
      duration: 0, // secondi
      currentSpeed: 0
  });

  // 3. Stati per "Manual Entry"
  const [manualDistance, setManualDistance] = useState<number>(0);
  const [manualPath, setManualPath] = useState<[number, number][]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);

  // 4. Refs e Utility
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock Meteo (Manteniamo questo statico per ora finché non integriamo un'API Meteo)
  const weatherData = {
    temp: 18,
    condition: "Partially Cloudy",
    wind: 12,
    humidity: 65,
  };

  // --- SIMULAZIONE GPS (Effect) ---
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        setStats(prev => ({ ...prev, duration: prev.duration + 1 }));

        // Simulazione movimento GPS
        setCurrentPos(prevPos => {
            const latChange = (Math.random() - 0.2) * 0.0005; 
            const lngChange = (Math.random() - 0.2) * 0.0005;
            
            const newPos: [number, number] = [
                prevPos[0] + 0.0001 + latChange,
                prevPos[1] + 0.0001 + lngChange 
            ];
            
            setLivePath(prevPath => [...prevPath, newPos]);

            const dist = getDistanceFromLatLonInKm(prevPos[0], prevPos[1], newPos[0], newPos[1]);
            
            setStats(prevStats => ({
                ...prevStats,
                distance: prevStats.distance + dist,
                currentSpeed: (dist / (1/3600)) // km/h
            }));

            return newPos;
        });

      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, isPaused]);

  // --- HANDLERS ---
  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePathCreated = (coordinates: [number, number][], distanceInMeters: number, newHazards: Hazard[]) => {
    setManualPath(coordinates);
    setManualDistance(parseFloat((distanceInMeters / 1000).toFixed(2)));
    setHazards(newHazards);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Record Trip
        </h1>
        <p className="text-muted-foreground mt-1">
          Automatically track or manually enter your trips
        </p>
      </div>

      <Tabs defaultValue="auto" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="auto" className="gap-2">
            <Navigation className="w-4 h-4" />
            Automatic
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Edit3 className="w-4 h-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* --- AUTOMATIC TRACKING --- */}
        <TabsContent value="auto" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Map Preview Live */}
            <Card className="lg:col-span-2 border-border/50 overflow-hidden h-[500px] flex flex-col relative">
              <div className="absolute inset-0 z-0">
                  <BikeMap 
                    mode="view" 
                    initialCenter={[45.4642, 9.1900]}
                    currentLocation={currentPos} // <-- Aggiornato: posizione live
                    recordedPath={livePath}      // <-- Aggiornato: scia live
                    autoCenter={isTracking}      // <-- Aggiornato: segue l'utente
                  />
              </div>

              {/* Overlay per stato "Non attivo" */}
              {!isTracking && livePath.length === 0 && (
                  <div className="absolute inset-0 bg-background/40 z-[400] flex items-center justify-center pointer-events-none">
                      <p className="bg-background/80 p-2 rounded text-sm font-medium backdrop-blur">
                        Start tracking to view live path
                      </p>
                  </div>
              )}

              {/* Tracking Controls Overlay */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center z-[500] gap-6 pointer-events-none">
                <div className="pointer-events-auto flex gap-4">
                  {!isTracking ? (
                    <Button
                      size="lg"
                      className="rounded-full w-20 h-20 shadow-2xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
                      onClick={() => {
                          setIsTracking(true);
                          setLivePath([currentPos]); 
                      }}
                    >
                      <Play className="w-8 h-8 ml-1" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 shadow-xl bg-yellow-500 hover:bg-yellow-600 text-white border-none"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
                      </Button>
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 shadow-xl bg-destructive hover:bg-destructive/90 text-white border-none"
                        onClick={() => {
                          setIsTracking(false);
                          setIsPaused(false);
                          // Qui puoi aggiungere logica di salvataggio
                          console.log("Ride Finished", stats);
                        }}
                      >
                        <Square className="w-6 h-6" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Live Stats */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-primary" />
                    Live Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                    <Route className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {stats.distance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">km</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {formatTime(stats.duration)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">Time</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                    <Gauge className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {/* Calcolo Velocità Media (evita divisione per zero) */}
                      {stats.duration > 0 ? (stats.distance / (stats.duration / 3600)).toFixed(1) : "0.0"}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">Avg Km/h</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                    <Navigation className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {isPaused ? "0.0" : stats.currentSpeed.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">Cur Km/h</p>
                  </div>
                </CardContent>
              </Card>

              {/* Weather (Static Mock) */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-primary" />
                    Meteo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Temperature
                      </span>
                    </div>
                    <span className="font-medium">{weatherData.temp}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Condition
                      </span>
                    </div>
                    <span className="font-medium text-sm">
                      {weatherData.condition}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Wind</span>
                    </div>
                    <span className="font-medium">{weatherData.wind} km/h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- MANUAL ENTRY --- */}
        <TabsContent value="manual" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Colonna Sinistra: Editor Mappa */}
                <Card className="border-border/50 h-[600px] overflow-hidden flex flex-col">
                    <CardHeader className="p-4 bg-muted/20 border-b">
                        <CardTitle className="text-base flex justify-between items-center">
                            <span>Draw Geometry</span>
                            <Badge variant="outline">Click to add points</Badge>
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 relative">
                        <BikeMap 
                            mode="edit" 
                            initialCenter={[45.4642, 9.1900]} 
                            onPathChange={handlePathCreated}
                        />
                    </div>
                </Card>

                {/* Colonna Destra: Attributi del Percorso */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="font-display">
                            New Path Details
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Define the static characteristics of this route.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        <div className="space-y-2">
                            <Label htmlFor="pathName">Path Name</Label>
                            <Input id="pathName" placeholder="e.g. Green Loop Park" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="distance">Length (km)</Label>
                            <Input 
                                id="distance" 
                                type="number" 
                                className="bg-muted"
                                value={manualDistance} 
                                readOnly 
                                disabled
                            />
                            <p className="text-xs text-muted-foreground">Calculated automatically from map</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the scenery, landmarks, or terrain type..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Condition</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="optimal">🟢 Perfect</SelectItem>
                                        <SelectItem value="good">🟡 Good</SelectItem>
                                        <SelectItem value="bad">🟠 Uneven</SelectItem>
                                        <SelectItem value="critical">🔴 Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy (Flat)</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard (Steep)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button className="flex-1 w-full" onClick={() => console.log("Saving...", { manualPath, manualDistance, hazards })}>
                                <Upload className="w-4 h-4 mr-2" />
                                Create Path
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}