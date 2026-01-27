import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Square, Navigation, Gauge, Clock, Route,
  Thermometer, Wind, Cloud, Edit3, Upload, Loader2, Globe, Lock, CheckCircle, AlertTriangle, Trash2, MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch} from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import BikeMap, { Hazard } from "@/components/BikeMap";
import { supabase } from "@/supabaseClient";
import { fetchWeather, WeatherData } from "@/lib/weatherService";
import { toast } from "sonner";
import { useDebugStore } from "@/stores/useDebugStore"; 

// Mock Route 
const MOCK_ROUTE: [number, number][] = [
    [45.46420, 9.19000], 
    [45.46425, 9.19005],
    [45.46430, 9.19010],
    [45.46435, 9.19015],
    [45.46440, 9.19020],
    [45.46445, 9.19025],
    [45.46450, 9.19030],
    [45.46455, 9.19035],
    [45.46460, 9.19040],
    [45.46465, 9.19045],
    [45.46470, 9.19050],
    [45.46475, 9.19055],
    [45.46480, 9.19060],
    [45.46485, 9.19065],
    [45.46490, 9.19070],
    [45.46495, 9.19075],
    [45.46500, 9.19080],
    [45.46510, 9.19090], 
    [45.46520, 9.19100], 
    [45.46530, 9.19110], 
    [45.46540, 9.19120],
    [45.46550, 9.19130],
    [45.46555, 9.19140],
    [45.46560, 9.19150],
    [45.46560, 9.19165],
    [45.46560, 9.19180],
    [45.46560, 9.19195],
    [45.46560, 9.19210],
    [45.46560, 9.19225],
    [45.46560, 9.19240],
    [45.46558, 9.19255],
    [45.46555, 9.19270],
    [45.46552, 9.19285],
    [45.46550, 9.19300],
    [45.46540, 9.19310],
    [45.46530, 9.19320],
    [45.46520, 9.19330],
    [45.46510, 9.19340],
    [45.46500, 9.19350],
    [45.46490, 9.19360],
    [45.46480, 9.19370],
    [45.46470, 9.19380],
    [45.46460, 9.19390],
    [45.46450, 9.19400],
    [45.46450, 9.19385],
    [45.46450, 9.19370],
    [45.46450, 9.19355],
    [45.46450, 9.19340],
    [45.46450, 9.19325],
    [45.46450, 9.19310],
    [45.46450, 9.19295],
    [45.46450, 9.19280],
    [45.46450, 9.19265],
    [45.46450, 9.19250],
    [45.46450, 9.19235],
    [45.46450, 9.19220],
    [45.46450, 9.19205],
];

// --- MATH HELPERS ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg: number) { return deg * (Math.PI / 180); }

// --- WKT BUILDER ---
const toWKT = (coords: [number, number][]) => {
  if (coords.length < 2) return null;
  const points = coords.map(c => `${c[1]} ${c[0]}`).join(", ");
  return `LINESTRING(${points})`;
};

const RecordTrip = () => {  
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mockIndexRef = useRef(0);

  // Tracking States
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isCheckingPath, setIsCheckingPath] = useState(false);

  const [livePath, setLivePath] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number]>([45.4642, 9.1900]); 
  const [stats, setStats] = useState({ distance: 0, duration: 0, currentSpeed: 0 });

  // Hazards State (Used for both Manual and Auto-detected)
  const [hazards, setHazards] = useState<Hazard[]>([]);

  // Manual Form State
  const [manualDistance, setManualDistance] = useState<number>(0);
  const [manualPath, setManualPath] = useState<[number, number][]>([]);
  const [manualForm, setManualForm] = useState({ 
    name: `Manual Path of ${new Date().toLocaleDateString()}`, 
    description: "", 
    status: "optimal", 
    difficulty: "easy", 
    isPublic: false 
  });
  
  // Modal States
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [matchedPath, setMatchedPath] = useState<{id: number, name: string} | null>(null); 
  const [newPathForm, setNewPathForm] = useState({ name: "", description: "", isPublic: true });

  const [weather, setWeather] = useState<WeatherData>({ temp: 0, condition: "--", wind: 0, humidity: 0 });

  const { isDebugMode, debugPathType } = useDebugStore();

  const handleStart = () => {
    setIsTracking(true);
    setStartTime(new Date());

    if (isDebugMode) { 
        if (debugPathType === 'fixed') {
             mockIndexRef.current = 0;
             toast.info("DEBUG: Fixed Path Simulation");
        } else {
             toast.info("DEBUG: Random Path Simulation");
        }
    } else {
        toast.success("Tracking Started (GPS)");
    }
  };

  // --- GPS & HAZARD SIMULATION ENGINE ---
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {

        const updateSession = (newPos: [number, number]) => {
            setStats(prev => {
                const dist = getDistanceFromLatLonInKm(currentPos[0], currentPos[1], newPos[0], newPos[1]);
                return {
                    ...prev,
                    duration: prev.duration + 1,
                    distance: prev.distance + dist,
                    currentSpeed: (dist / (1/3600)) // km/h
                };
            });
            setCurrentPos(newPos);
            setLivePath(prev => [...prev, newPos]);

            if (isDebugMode && Math.random() > 0.95) { 
                 const types = ["pothole", "obstacle", "other"] as const;
                 const randomType = types[Math.floor(Math.random() * types.length)];
                 const newHazard: Hazard = {
                     id: Date.now().toString(),
                     location: newPos,
                     type: randomType,
                 };
                 setHazards(prev => {
                     const updated = [...prev, newHazard];
                     if (updated.length <= 3) toast.warning(`Simulazione: ${randomType} rilevato!`);
                     return updated;
                 });
            }
        };

        // --- LOGICA DI SCELTA SORGENTE POSIZIONE ---
        
        if (isDebugMode) {
            // DEBUG MODE
            let simPos: [number, number] | null = null;

            if (debugPathType === 'fixed') {
                // 1. Fixed Path
                if (mockIndexRef.current >= MOCK_ROUTE.length - 1) return; // Fine percorso
                mockIndexRef.current += 1;
                simPos = MOCK_ROUTE[mockIndexRef.current];
            } else {
                // 2. Random Walk
                const latChange = (Math.random() - 0.5) * 0.001; // Random movement
                const lngChange = (Math.random() - 0.5) * 0.001;
                simPos = [currentPos[0] + latChange, currentPos[1] + lngChange];
            }

            if (simPos) updateSession(simPos);

        } else {
            // PRODCUTION (GPS REALE)
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const realPos: [number, number] = [position.coords.latitude, position.coords.longitude];
                        // Update position with real data
                        updateSession(realPos);
                    },
                    (error) => {
                        console.error("Errore GPS:", error);
                        toast.error("Errore nel recupero della posizione GPS.");
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            } else {
                toast.error("GPS non disponibile su questo dispositivo");
            }
        }

      }, 1000); // Aggiornamento ogni secondo
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking, isPaused, currentPos, isDebugMode, debugPathType]);

  // --- STOP & CHECK ---
  const handleStopPress = async () => {
    setIsTracking(false);
    setIsPaused(true); 
    
    if (livePath.length < 2) {
        toast.error("Track is too short to save.");
        return;
    }

    setIsCheckingPath(true);

    try {
        const wktString = toWKT(livePath);
        
        // RPC Call
        const { data: matchedPaths, error } = await supabase.rpc('check_path_similarity', { 
            new_geom_wkt: wktString,
            tolerance_meters: 50,
            length_tolerance_pct: 0.1
        });

        if (error) console.error("Check error:", error);

        if (matchedPaths && matchedPaths.length > 0) {
            setMatchedPath(matchedPaths[0]);
        } else {
            setMatchedPath(null);
            const today = new Date().toLocaleDateString();
            setNewPathForm({
                name: `Path of ${today}`,
                description: "New track created via GPS recording.",
                isPublic: true
            });
        }
        setShowSaveDialog(true);
    } catch (e) {
        toast.error("Error analyzing the path.");
    } finally {
        setIsCheckingPath(false);
    }
  };

  const resetTrackingSession = () => {
    setIsTracking(false);
    setIsPaused(false);
    setLivePath([]);
    setHazards([]);
    setStats({ distance: 0, duration: 0, currentSpeed: 0 });
    setStartTime(null);
    
    mockIndexRef.current = 0;
    
    setShowSaveDialog(false);
    
    toast.info("Session discarded");
};

  // --- SAVE LOGIC ---
  const confirmSaveTracking = async () => {
    setIsSaving(true);
    setShowSaveDialog(false);

    try {
        const user = (await supabase.auth.getUser()).data.user;
        const wktString = toWKT(livePath); 
        
        let targetPathId: number;
        let targetPathName: string;

        if (matchedPath) {
            // MATCH FOUND
            targetPathId = matchedPath.id;
            targetPathName = matchedPath.name;
            toast.success(`Activity saved! Linked to: ${matchedPath.name}`);
        } else {
            // NEW PATH
            const pathPayload = {
                name: newPathForm.name, 
                description: newPathForm.description,
                distance: stats.distance,
                duration: formatTime(stats.duration),
                path_data: livePath,
                geom: wktString,
                hazards: hazards, 
                status: "good",
                is_public: newPathForm.isPublic, 
                id_owner: user?.id
            };
            const { data: newPath, error: createError } = await supabase.from('paths').insert([pathPayload]).select().single();
            if (createError) throw createError;
            
            targetPathId = newPath.id;
            targetPathName = newPath.name;
            toast.success("New path created successfully!");
        }

        // SAVE ACTIVITY (With Hazards!)
        const activityPayload = {
            name: `${user?.email?.split('@')[0] || 'User'} on ${targetPathName}`,
            path_id: targetPathId,
            user_id: user?.id,
            started_at: startTime?.toISOString(),
            ended_at: new Date().toISOString(),
            duration_second: stats.duration,
            duration_meters: stats.distance * 1000,
            average_speed: stats.duration > 0 ? (stats.distance * 1000) / stats.duration : 0,
            raw_data: livePath, 
            path: wktString,
            hazards: hazards 
        };

        const { error: activityError } = await supabase.from('activities').insert([activityPayload]);
        if (activityError) throw activityError;

        navigate("/app/my-paths");
    } catch (error: any) {
        console.error("Error:", error);
        toast.error("Error saving the activity.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- MANUAL SAVE ---
  const handleSaveManualPath = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (manualPath.length < 2) {
        toast.error("Please draw a path on the map.");
        return;
    }
    setIsSaving(true);

    try {
        const wktString = toWKT(manualPath); 
        const today = new Date().toLocaleDateString();
        const finalName = manualForm.name.trim() !== "" ? manualForm.name : `Manual Path of ${today}`;

        const dbPayload = {
            name: finalName, 
            description: manualForm.description,
            distance: manualDistance,
            duration: "N/A",
            path_data: manualPath,
            geom: wktString, 
            hazards: hazards,
            status: manualForm.status,
            difficulty: manualForm.difficulty, // AGGIUNTO
            is_public: manualForm.isPublic,
            id_owner: user?.id
        };

        const { error } = await supabase.from('paths').insert([dbPayload]);
        if (error) throw error;

        toast.success("Manual path created successfully!");
        navigate("/app/my-paths");
    } catch (error: any) {
        console.error("Error:", error);
        toast.error(error.message);
    } finally {
        setIsSaving(false);
    }
  };

  // Helpers
  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePathCreated = (coords: [number, number][], dist: number, haz: Hazard[]) => {
    setManualPath(coords);
    setManualDistance(parseFloat((dist / 1000).toFixed(2)));
    setHazards(haz);
  };

  const removeHazard = (index: number) => {
      setHazards(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 lg:mx-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Record Trip</h1>
        <p className="text-muted-foreground mt-1">Track activities or create paths manually</p>
        
{       isDebugMode && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            DEBUG: {debugPathType.toUpperCase()}
            </Badge>
        )}
      </div>

      <Tabs defaultValue="auto" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="auto" className="gap-2"><Navigation className="w-4 h-4" /> Automatic</TabsTrigger>
          <TabsTrigger value="manual" className="gap-2"><Edit3 className="w-4 h-4" /> Manual</TabsTrigger>
        </TabsList>

        {/* --- AUTOMATIC TAB --- */}
        <TabsContent value="auto" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/50 overflow-hidden h-[500px] flex flex-col relative">
              <div className="absolute inset-0 z-0">
                  <BikeMap 
                    mode="view" 
                    initialCenter={[45.4642, 9.1900]} 
                    currentLocation={currentPos} 
                    recordedPath={livePath} 
                    autoCenter={isTracking} 
                    hazards={hazards} 
                  />
              </div>

              {!isTracking && livePath.length === 0 && (
                 <div className="absolute inset-0 bg-background/40 z-[400] flex items-center justify-center pointer-events-none">
                     <p className="bg-background/80 p-2 rounded text-sm font-medium backdrop-blur">Press Play to start recording</p>
                 </div>
              )}

              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-end z-20 gap-4 pointer-events-none">
                <div className="pointer-events-auto flex gap-4">
                  {!isTracking ? (
                    <Button size="lg" className="rounded-full w-20 h-20 shadow-2xl bg-primary hover:bg-primary/90 hover:scale-105 transition-transform" onClick={handleStart} disabled={isSaving || isCheckingPath}>
                      <Play className="w-8 h-8 ml-1" />
                    </Button>
                  ) : (
                    <>
                    <Button size="lg" className="rounded-full w-16 h-16 shadow-xl bg-yellow-500 hover:bg-yellow-600 border-none" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
                    </Button>
                    <Button 
                    variant="destructive" 
                    size="lg" 
                    className="rounded-full w-16 h-16 shadow-xl border-none" 
                    onClick={handleStopPress} 
                    disabled={isSaving || isCheckingPath}
                    >
                    {isCheckingPath ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <Square className="w-6 h-6 fill-current" />
                    )}
                    </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-4">
               {/* STATS */}
               <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="pb-2"><CardTitle className="text-lg font-display flex items-center gap-2"><Gauge className="w-5 h-5 text-primary" /> Live Stats</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Route className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{stats.distance.toFixed(2)}</p><p className="text-xs text-muted-foreground">km</p></div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Clock className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{formatTime(stats.duration)}</p><p className="text-xs text-muted-foreground">Time</p></div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Gauge className="w-5 h-5 text-accent mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{stats.duration > 0 ? (stats.distance / (stats.duration / 3600)).toFixed(1) : "0.0"}</p><p className="text-xs text-muted-foreground">Avg Km/h</p></div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Navigation className="w-5 h-5 text-accent mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{isPaused ? "0.0" : stats.currentSpeed.toFixed(1)}</p><p className="text-xs text-muted-foreground">Cur Km/h</p></div>
                </CardContent>
              </Card>

              {/* HAZARD LIST PREVIEW */}
              <Card className="border-border/50 flex-1">
                <CardHeader className="pb-2"><CardTitle className="text-lg font-display flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Detected Hazards</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-[120px]">
                        {hazards.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No hazards detected yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {hazards.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm bg-muted/40 p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                                            <span className="capitalize font-medium">{h.type}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground">{h.location[0].toFixed(4)}, {h.location[1].toFixed(4)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- MANUAL TAB (RIPRISTINATO COMPLETAMENTE) --- */}
        <TabsContent value="manual" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border/50 h-[600px] overflow-hidden flex flex-col">
                    <CardHeader className="p-4 bg-muted/20 border-b"><CardTitle className="text-base">Draw Geometry</CardTitle></CardHeader>
                    <div className="flex-1 relative"><BikeMap mode="edit" initialCenter={[45.4642, 9.1900]} onPathChange={handlePathCreated} /></div>
                </Card>

                <Card className="border-border/50">
                    <CardHeader><CardTitle className="font-display">New Path Details</CardTitle><p className="text-sm text-muted-foreground">Static characteristics of the route.</p></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2"><Label>Name</Label><Input value={manualForm.name} onChange={(e) => setManualForm({...manualForm, name: e.target.value})} /></div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    {manualForm.isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                    <Label className="text-base cursor-pointer">Public Path</Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {manualForm.isPublic ? "Visible to everyone" : "Only visible to you"}
                                </p>
                            </div>
                            <Switch checked={manualForm.isPublic} onCheckedChange={(checked) => setManualForm({...manualForm, isPublic: checked})} />
                        </div>

                        {/* Length Field Restored */}
                        <div className="space-y-2">
                            <Label>Length (km)</Label>
                            <Input value={manualDistance} readOnly className="bg-muted font-mono" />
                        </div>

                        <div className="space-y-2"><Label>Description</Label><Textarea value={manualForm.description} onChange={(e) => setManualForm({...manualForm, description: e.target.value})} rows={3} /></div>
                        
                        {/* Selects Restored */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Condition</Label>
                                <Select value={manualForm.status} onValueChange={(v) => setManualForm({...manualForm, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="optimal">Optimal</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="bad">Bad</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Difficulty</Label>
                                <Select value={manualForm.difficulty} onValueChange={(v) => setManualForm({...manualForm, difficulty: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button className="w-full mt-4" onClick={handleSaveManualPath} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Create Path
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* --- SAVE DIALOG --- */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle className={matchedPath ? "text-green-600 flex items-center gap-2" : ""}>
                    {matchedPath ? <><CheckCircle className="w-5 h-5" /> Path Recognized!</> : "New Path Detected"}
                </DialogTitle>
                <DialogDescription>
                    {matchedPath ? "Your track matches an existing public path." : "You explored a new area! Name this track."}
                </DialogDescription>
            </DialogHeader>

            {matchedPath ? (
                <div className="p-4 bg-muted/30 rounded-lg border mb-4">
                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">Link to:</p>
                    <p className="text-lg font-medium">{matchedPath.name}</p>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Path Name</Label><Input value={newPathForm.name} onChange={(e) => setNewPathForm({...newPathForm, name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea value={newPathForm.description} onChange={(e) => setNewPathForm({...newPathForm, description: e.target.value})} /></div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /><Label>Public Path</Label></div>
                        <Switch checked={newPathForm.isPublic} onCheckedChange={(c) => setNewPathForm({...newPathForm, isPublic: c})} />
                    </div>
                </div>
            )}

            {/* --- DETECTED HAZARDS REVIEW SECTION --- */}
            {hazards.length > 0 && (
                <div className="border-t pt-4 mt-2">
                    <Label className="mb-2 block flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> 
                        Review Detected Hazards ({hazards.length})
                    </Label>
                    <div className="bg-muted/30 rounded-md border p-2">
                        <ScrollArea className="h-[150px]">
                            <div className="space-y-2">
                                {hazards.map((h, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-background border rounded-md shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 p-1.5 rounded-full"><AlertTriangle className="w-3 h-3 text-orange-600" /></div>
                                            <div>
                                                <p className="text-sm font-medium capitalize">{h.type}</p>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {h.location[0].toFixed(5)}, {h.location[1].toFixed(5)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => removeHazard(index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            Hazards left in this list will be saved to your activity.
                        </p>
                    </div>
                </div>
            )}
            
            <DialogFooter>
                <Button variant="outline" onClick={() => resetTrackingSession()}>Cancel</Button>
                <Button onClick={confirmSaveTracking} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Activity"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordTrip;