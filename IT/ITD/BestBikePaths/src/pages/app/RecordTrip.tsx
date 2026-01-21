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

const RecordTrip = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  const detectedIssues = [
    { id: 1, type: "pothole", location: "Via Roma, 45", confirmed: false },
    { id: 2, type: "pothole", location: "Corso Italia, 120", confirmed: true },
  ];

  return (
    <div className="mx-2 lg:mx-4 p-6 lg:p-8 space-y-8">
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

        {/* Manual Entry */}
        <TabsContent value="manual" className="space-y-6">
          <Card className="border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">
                Manual Trip Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Starting Point</Label>
                  <Input id="start" placeholder="E.g. Via Roma, 1 - Milan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Ending Point</Label>
                  <Input id="end" placeholder="E.g. Piazza Duomo - Milan" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streets">Streets Covered</Label>
                <Textarea
                  id="streets"
                  placeholder="Enter the streets covered, separated by commas..."
                  rows={3}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input id="distance" type="number" placeholder="0.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Path Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optimal">🟢 Optimal</SelectItem>
                    <SelectItem value="good">🟡 Good</SelectItem>
                    <SelectItem value="sufficient">🟠 Sufficient</SelectItem>
                    <SelectItem value="maintenance">
                      🔴 Requires Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes and Reports</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the path, obstacles, potholes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Save and Publish
                </Button>
                <Button variant="outline" className="flex-1">
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecordTrip;
