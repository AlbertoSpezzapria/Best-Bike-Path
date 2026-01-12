import { useState } from "react";
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

const RecordTrip = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [manualDistance, setManualDistance] = useState<number>(0);
  const [manualPath, setManualPath] = useState<[number, number][]>([]);

  const [hazards, setHazards] = useState<any[]>([]);

  // Mock tracking data
  const trackingData = {
    distance: 8.42,
    duration: "00:28:15",
    avgSpeed: 17.9,
    currentSpeed: 22.4,
    elevation: 45,
    calories: 312,
  };

  const weatherData = {
    temp: 18,
    condition: "Partially Cloudy",
    wind: 12,
    humidity: 65,
  };

  const mockLivePath: [number, number][] = [
      [45.4642, 9.1900],
      [45.4650, 9.1910],
      [45.4660, 9.1920],
      [45.4670, 9.1940]
  ];

  const handlePathCreated = (coordinates: [number, number][], distanceInMeters: number, newHazards: any[]) => {
    setManualPath(coordinates);
    setManualDistance(parseFloat((distanceInMeters / 1000).toFixed(2)));
    setHazards(newHazards);
}

  const detectedIssues = [
    { id: 1, type: "pothole", location: "Via Roma, 45", confirmed: false },
    { id: 2, type: "pothole", location: "Corso Italia, 120", confirmed: true },
  ];

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

        {/* Automatic Tracking */}
        <TabsContent value="auto" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map Preview */}
            <Card className="lg:col-span-2 border-border/50 overflow-hidden">
              <div className="relative h-[400px] bg-muted/30 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="text-center z-10">
                  <MapPin className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isTracking
                      ? "Real-time route map"
                      : "Start tracking to view the route"}
                  </p>
                </div>

                {!isTracking && (
                    <div className="absolute inset-0 bg-background/40 z-[400] flex items-center justify-center pointer-events-none">
                       <p className="bg-background/80 p-2 rounded text-sm font-medium">Start tracking to see live path</p>
                    </div>
                )}

                {/* Tracking Controls Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  {!isTracking ? (
                    <Button
                      size="lg"
                      className="rounded-full w-16 h-16 shadow-lg"
                      onClick={() => setIsTracking(true)}
                    >
                      <Play className="w-8 h-8" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full w-14 h-14"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? (
                          <Play className="w-6 h-6" />
                        ) : (
                          <Pause className="w-6 h-6" />
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        className="rounded-full w-14 h-14"
                        onClick={() => {
                          setIsTracking(false);
                          setIsPaused(false);
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
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-primary" />
                    Live Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Route className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {trackingData.distance}
                    </p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {trackingData.duration}
                    </p>
                    <p className="text-xs text-muted-foreground">durata</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Gauge className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {trackingData.avgSpeed}
                    </p>
                    <p className="text-xs text-muted-foreground">km/h media</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Navigation className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {trackingData.currentSpeed}
                    </p>
                    <p className="text-xs text-muted-foreground">km/h attuale</p>
                  </div>
                </CardContent>
              </Card>

              {/* Weather */}
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

              {/* Detected Issues */}
              {isTracking && detectedIssues.length > 0 && (
                <Card className="border-border/50 border-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-accent" />
                      Detected Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detectedIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <p className="text-sm font-medium">Buca rilevata</p>
                          <p className="text-xs text-muted-foreground">
                            {issue.location}
                          </p>
                        </div>
                        <Badge
                          variant={issue.confirmed ? "default" : "secondary"}
                        >
                          {issue.confirmed ? "Confirmed" : "To Confirm"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Manual Entry: Creazione Nuovo Percorso (Statico) */}
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
                        
                        {/* 1. Nome del Percorso (Nuovo campo essenziale) */}
                        <div className="space-y-2">
                            <Label htmlFor="pathName">Path Name</Label>
                            <Input id="pathName" placeholder="e.g. Green Loop Park" />
                        </div>

                        {/* 2. Dati Fisici (Solo Distanza, calcolata dalla mappa) */}
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

                        {/* 3. Descrizione */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the scenery, landmarks, or terrain type..."
                                rows={3}
                            />
                        </div>

                        {/* 4. Attributi Qualitativi */}
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
                            <Button className="flex-1 w-full">
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
};

export default RecordTrip;
