import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Square, Navigation, Gauge, Clock, Route,
  Thermometer, Wind, Cloud, Edit3, Upload, Loader2, Globe, Lock, CheckCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch} from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import BikeMap, { Hazard } from "@/components/BikeMap";
import { supabase } from "@/supabaseClient";
import { fetchWeather, WeatherData } from "@/lib/weatherService";
import { toast } from "sonner"; 

const IS_DEBUG_MODE = true;
const MOCK_ROUTE: [number, number][] = [
    [45.46420, 9.19000], 
    [45.46430, 9.19010],
    [45.46440, 9.19020],
    [45.46450, 9.19030],
    [45.46460, 9.19040],
    [45.46470, 9.19050],
    [45.46480, 9.19060],
    [45.46490, 9.19070],
    [45.46500, 9.19080],
    [45.46510, 9.19090], 
    [45.46520, 9.19100], 
    [45.46530, 9.19110], 
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

// --- POSTGIS HELPER (WKT Builder) ---
const toWKT = (coords: [number, number][]) => {
  if (coords.length < 2) return null;
  const points = coords.map(c => `${c[1]} ${c[0]}`).join(", ");
  return `LINESTRING(${points})`;
};

const RecordTrip = () => {
  const mockIndexRef = useRef(0);

  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tracking States
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isCheckingPath, setIsCheckingPath] = useState(false);

  const [livePath, setLivePath] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number]>([45.4642, 9.1900]); 
  const [stats, setStats] = useState({ distance: 0, duration: 0, currentSpeed: 0 });

  // Manual Entry States
  const [manualDistance, setManualDistance] = useState<number>(0);
  const [manualPath, setManualPath] = useState<[number, number][]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
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

  // Weather State
  const [weather, setWeather] = useState<WeatherData>({ temp: 0, condition: "--", wind: 0, humidity: 0 });

  // Start Tracking Handler
  const handleStart = () => {
    setIsTracking(true);
    setStartTime(new Date());

    if (IS_DEBUG_MODE) {
        mockIndexRef.current = 0;
        const startPoint = MOCK_ROUTE[0];
        setCurrentPos(startPoint);
        setLivePath([startPoint]);
        fetchWeather(startPoint[0], startPoint[1]).then(setWeather);
        toast.info("Debug mode: starting mock GPS route.");
    } else {
        setLivePath([currentPos]);
        fetchWeather(currentPos[0], currentPos[1]).then(setWeather);
    }
  };

  // --- GPS SIMULATION ---
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        
        // --- DETERMINISTIC PATH ---
        if (IS_DEBUG_MODE) {
            if (mockIndexRef.current >= MOCK_ROUTE.length - 1) {
                return; 
            }
            mockIndexRef.current += 1;
            const newPos = MOCK_ROUTE[mockIndexRef.current];
            setStats(prev => {
                const dist = getDistanceFromLatLonInKm(currentPos[0], currentPos[1], newPos[0], newPos[1]);
                return {
                    ...prev,
                    duration: prev.duration + 1,
                    distance: prev.distance + dist,
                    currentSpeed: (dist / (1/3600))
                };
            });
            setCurrentPos(newPos);
            setLivePath(prev => [...prev, newPos]);
        } 
        
        // --- RANDOM PATH ---
        else {
            setStats(prev => ({ ...prev, duration: prev.duration + 1 }));

            setCurrentPos(prevPos => {
                const latChange = (Math.random() - 0.2) * 0.0005; 
                const lngChange = (Math.random() - 0.2) * 0.0005;
                const newPos: [number, number] = [prevPos[0] + 0.0001 + latChange, prevPos[1] + 0.0001 + lngChange];
                
                setLivePath(prevPath => [...prevPath, newPos]);
                const dist = getDistanceFromLatLonInKm(prevPos[0], prevPos[1], newPos[0], newPos[1]);
                
                setStats(prevStats => ({
                    ...prevStats,
                    distance: prevStats.distance + dist,
                    currentSpeed: (dist / (1/3600))
                }));
                return newPos;
            });
        }

      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking, isPaused, currentPos]);

  // --- 1. STOP TRACKING HANDLER (Opens Modal) ---
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
        
        // 1. RPC CALL: Check immediately if a similar path exists
        const { data: matchedPaths, error } = await supabase.rpc('check_path_similarity', { 
            new_geom_wkt: wktString,
            tolerance_meters: 50,
            length_tolerance_pct: 0.1
        });

        if (error) console.error("Check error:", error);

        if (matchedPaths && matchedPaths.length > 0) {
            // CASE A: EXISTING path found
            setMatchedPath(matchedPaths[0]);
        } else {
            // CASE B: No match -> Prepare form for NEW path
            setMatchedPath(null);
            const today = new Date().toLocaleDateString();
            setNewPathForm({
                name: `Path of ${today}`,
                description: "New track created via GPS recording.",
                isPublic: true
            });
        }
        
        // 2. Open modal only now, with data ready
        setShowSaveDialog(true);

    } catch (e) {
        toast.error("Error analyzing the path.");
    } finally {
        setIsCheckingPath(false);
    }
  };

  // --- 2. CONFIRM SAVE LOGIC (Called from Modal) ---
  const confirmSaveTracking = async () => {
    setIsSaving(true);
    setShowSaveDialog(false);

    try {
        const user = (await supabase.auth.getUser()).data.user;
        const wktString = toWKT(livePath); 
        
        let targetPathId: number;
        let targetPathName: string;

        if (matchedPath) {
            // --- SCENARIO: MATCH ---
            // Use the ID found earlier
            targetPathId = matchedPath.id;
            targetPathName = matchedPath.name;
            toast.success("Activity saved and linked to existing path!");
        } else {
            // --- SCENARIO: NEW PATH ---
            // Create path with data entered in modal
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

        // CREATE ACTIVITY (Always)
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
            path: wktString 
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

  // --- 3. MANUAL SAVE ---
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
        const finalName = manualForm.name.trim() !== "" 
            ? manualForm.name 
            : `Manual Path of ${today}`;

        const dbPayload = {
            name: finalName, 
            description: manualForm.description,
            distance: manualDistance,
            duration: "N/A",
            path_data: manualPath,
            geom: wktString, 
            hazards: hazards,
            status: manualForm.status,
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

  // UI Helpers
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

  return (
    <div className="p-6 lg:mx-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Record Trip</h1>
        <p className="text-muted-foreground mt-1">Track activities or create paths manually</p>
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

              {/* CONTROLS OVERLAY: z-20 to sit below modals but above map */}
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
                      <Button size="lg" className="rounded-full w-16 h-16 shadow-xl bg-destructive hover:bg-destructive/90 border-none" onClick={handleStopPress} disabled={isSaving || isCheckingPath}>
                        {/* Show loader if checking path */}
                        {isCheckingPath ? <Loader2 className="w-6 h-6 animate-spin" /> : <Square className="w-6 h-6" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-4">
               {/* LIVE STATS */}
               <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="pb-2"><CardTitle className="text-lg font-display flex items-center gap-2"><Gauge className="w-5 h-5 text-primary" /> Live Stats</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Route className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{stats.distance.toFixed(2)}</p><p className="text-xs text-muted-foreground">km</p></div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Clock className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{formatTime(stats.duration)}</p><p className="text-xs text-muted-foreground">Time</p></div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Gauge className="w-5 h-5 text-accent mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{stats.duration > 0 ? (stats.distance / (stats.duration / 3600)).toFixed(1) : "0.0"}</p><p className="text-xs text-muted-foreground">Avg Km/h</p></div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm"><Navigation className="w-5 h-5 text-accent mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{isPaused ? "0.0" : stats.currentSpeed.toFixed(1)}</p><p className="text-xs text-muted-foreground">Cur Km/h</p></div>
                </CardContent>
              </Card>

              {/* LIVE WEATHER */}
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-lg font-display flex items-center gap-2"><Cloud className="w-5 h-5 text-primary" /> Live Weather</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center"><div className="flex gap-2 text-muted-foreground text-sm"><Thermometer className="w-4 h-4" /> Temp</div><span className="font-medium">{weather.temp}°C</span></div>
                  <div className="flex justify-between items-center"><div className="flex gap-2 text-muted-foreground text-sm"><Cloud className="w-4 h-4" /> Condition</div><span className="font-medium text-sm">{weather.condition}</span></div>
                  <div className="flex justify-between items-center"><div className="flex gap-2 text-muted-foreground text-sm"><Wind className="w-4 h-4" /> Wind</div><span className="font-medium">{weather.wind} km/h</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- MANUAL TAB --- */}
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

                        <div className="space-y-2"><Label>Length (km)</Label><Input value={manualDistance} readOnly className="bg-muted" /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={manualForm.description} onChange={(e) => setManualForm({...manualForm, description: e.target.value})} rows={3} /></div>
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

      {/* --- SAVE DIALOG (Match vs New) --- */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
            {matchedPath ? (
                // CASE A: MATCH FOUND
                <>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" /> Path Recognized!
                        </DialogTitle>
                        <DialogDescription>
                            Good news! Your track matches an existing public path.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">Link to:</p>
                            <p className="text-lg font-medium">{matchedPath.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your activity will be recorded and appear on this path's leaderboard.
                        </p>
                    </div>
                </>
            ) : (
                // CASE B: NEW PATH
                <>
                    <DialogHeader>
                        <DialogTitle>New Path Detected</DialogTitle>
                        <DialogDescription>
                            You explored a new area! Name this track to save it to the public database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Path Name</Label>
                            <Input value={newPathForm.name} onChange={(e) => setNewPathForm({...newPathForm, name: e.target.value})} placeholder="Ex. Lake Loop" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={newPathForm.description} onChange={(e) => setNewPathForm({...newPathForm, description: e.target.value})} placeholder="Terrain features, views, etc." />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                {newPathForm.isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                <Label>Public Path</Label>
                            </div>
                            <Switch checked={newPathForm.isPublic} onCheckedChange={(c) => setNewPathForm({...newPathForm, isPublic: c})} />
                        </div>
                    </div>
                </>
            )}
            
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
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