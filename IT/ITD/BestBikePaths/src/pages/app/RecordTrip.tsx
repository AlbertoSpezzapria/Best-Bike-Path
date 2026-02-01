import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Square, Navigation, Gauge, Clock, Route,
  Edit3, Upload, Loader2, Globe, Lock, CheckCircle, AlertTriangle, Trash2, MapPin,
  AlertCircle, CheckCircle2, ThumbsDown, ThumbsUp, Activity, User as UserIcon
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Internal Logic & Services
import BikeMap, { Hazard } from "@/components/BikeMap";
import { supabase } from "@/supabaseClient";
import { fetchWeather } from "@/lib/weatherService";
import { useDebugStore } from "@/stores/useDebugStore"; 

// --- MATH & GEOMETRY HELPERS ---

// Calculates distance between two coordinates in Kilometers
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

// Converts coordinate array to PostGIS WKT format (LINESTRING)
const toWKT = (coords: [number, number][]) => {
  if (coords.length < 2) return null;
  const points = coords.map(c => `${c[1]} ${c[0]}`).join(", ");
  return `LINESTRING(${points})`;
};

// Formats seconds into HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const RecordTrip = () => {  
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mockIndexRef = useRef(0);
  const { isDebugMode, debugPathType } = useDebugStore();

  // --- STATE MANAGEMENT ---

  // 1. User & Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 2. Tracking Session Data
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [livePath, setLivePath] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number]>([45.4642, 9.1900]); 
  const [stats, setStats] = useState({ distance: 0, duration: 0, currentSpeed: 0 });
  const [hazards, setHazards] = useState<Hazard[]>([]); // Auto-detected or manual hazards

  // 3. User Feedback States
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [status, setStatus] = useState<string>("good");

  // 4. UI & Flow States
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingPath, setIsCheckingPath] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // 5. Matching Logic States
  const [matchedPath, setMatchedPath] = useState<{id: number, id_owner: string, name: string} | null>(null); 
  const [linkToExisting, setLinkToExisting] = useState(true); // Toggle for Opt-out logic
  const [newPathForm, setNewPathForm] = useState({ name: "", description: "", isPublic: true });

  // 6. Manual Editor States
  const [manualDistance, setManualDistance] = useState<number>(0);
  const [manualPath, setManualPath] = useState<[number, number][]>([]);
  const [manualForm, setManualForm] = useState({ 
    name: `Manual Path of ${new Date().toLocaleDateString()}`, 
    description: "", 
    status: "optimal", 
    difficulty: "easy", 
    isPublic: false 
  });

  // Derived State: Check if the matched path belongs to the current user
  const isOwnPath = matchedPath?.id_owner === currentUserId;

  // --- EFFECTS ---

  // Load User ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
            setCurrentUserId(data.user.id);
        }
    });
  }, []);

  // Tracking Engine (GPS + Simulation)
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {

        const updateSession = (newPos: [number, number]) => {
            setStats(prev => {
                let dist = 0;
                if (livePath.length > 0) {
                    const lastPos = livePath[livePath.length - 1];
                    dist = getDistanceFromLatLonInKm(lastPos[0], lastPos[1], newPos[0], newPos[1]);
                    // Filter noise: only count if moved > 1 meter (unless debugging)
                    if (dist > 1 && !isDebugMode) dist = 0;
                }
                return {
                    ...prev,
                    duration: prev.duration + 1,
                    distance: prev.distance + dist,
                    currentSpeed: (dist / (1/3600)) // km/h
                };
            });
            setCurrentPos(newPos);
            setLivePath(prev => [...prev, newPos]);

            // Simulation: Random hazard detection in debug mode
            if (isDebugMode && Math.random() > 0.85) { 
                 const types = ["pothole", "obstacle", "other"] as const;
                 const randomType = types[Math.floor(Math.random() * types.length)];
                 const newHazard: Hazard = {
                     id: Date.now().toString(),
                     location: newPos,
                     type: randomType,
                 };
                 setHazards(prev => {
                     const updated = [...prev, newHazard];
                     if (updated.length <= 3) toast.warning(`Sim: ${randomType} detected!`);
                     return updated;
                 });
            }
        };

        // --- SOURCE SELECTION LOGIC ---
        if (isDebugMode) {
            // DEBUG: Simulate movement
            let simPos: [number, number] | null = null;

            if (debugPathType === 'fixed') {
                if (mockIndexRef.current >= MOCK_ROUTE.length - 1) return; 
                mockIndexRef.current += 1;
                simPos = MOCK_ROUTE[mockIndexRef.current];
            } else {
                // Random Walk
                const latChange = (Math.random() - 0.5) * 0.001; 
                const lngChange = (Math.random() - 0.5) * 0.001;
                simPos = [currentPos[0] + latChange, currentPos[1] + lngChange];
            }
            if (simPos) updateSession(simPos);

        } else {
            // PRODUCTION: Real GPS
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const realPos: [number, number] = [position.coords.latitude, position.coords.longitude];
                        updateSession(realPos);
                    },
                    (error) => {
                        console.error("GPS Error:", error);
                        toast.error("Error retrieving GPS position.");
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            } else {
                toast.error("GPS not available.");
            }
        }

      }, 1000); // 1Hz Update Rate
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking, isPaused, currentPos, isDebugMode, debugPathType, livePath.length]);

  // --- ACTIONS ---

  const handleStart = () => {
    setLivePath([]); 
    setStats({ distance: 0, duration: 0, currentSpeed: 0 });
    setIsTracking(true);
    setStartTime(new Date());

    if (isDebugMode) { 
        if (debugPathType === 'fixed') {
             mockIndexRef.current = 0;
             toast.info("DEBUG: Fixed Path Simulation Started");
        } else {
             toast.info("DEBUG: Random Path Simulation Started");
        }
    } else {
        toast.success("Tracking Started (GPS)");
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

  const removeHazard = (index: number) => {
    setHazards(prev => prev.filter((_, i) => i !== index));
  };

  // --- STOP & MATCHING LOGIC ---
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
        
        // 1. Database RPC Call to check for existing paths
        const { data: matchedPaths, error } = await supabase.rpc('check_path_similarity', { 
            new_geom_wkt: wktString,
            tolerance_meters: 50,
            length_tolerance_pct: 0.2
        });

        if (error) console.error("Check error:", error);

        if (matchedPaths && matchedPaths.length > 0) {
            // --- PRIORITY LOGIC ---
            // 1. Check if the user already owns one of the matched paths (Private or Public)
            const myExistingPath = matchedPaths.find((p: any) => p.id_owner === currentUserId);
            
            // 2. Priority: Own Path > Best Public Match
            const bestMatch = myExistingPath || matchedPaths[0];

            setMatchedPath(bestMatch);
            setLinkToExisting(true); // Default behavior: Link to match

            // 3. Pre-fill form for "Private Copy" scenario (only if match is NOT mine)
            if (bestMatch.id_owner !== currentUserId) {
                setNewPathForm({
                    name: bestMatch.name,
                    description: bestMatch.description || "Private copy",
                    isPublic: false
                });
            }
        } else {
            // NO MATCH -> Create New Path
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
        console.error(e);
        toast.error("Error analyzing the path.");
    } finally {
        setIsCheckingPath(false);
    }
  };

  // --- SAVE WORKFLOW ---
  const confirmSaveTracking = async () => {
    setIsSaving(true);
    setShowSaveDialog(false);

    try {
        // 1. Fetch Weather Data for the endpoint
        let finalWeather = { temp: 0, condition: "--", wind: 0, humidity: 0 };
        if (livePath.length > 0) {
            const lastPos = livePath[livePath.length - 1];
            try {
                finalWeather = await fetchWeather(lastPos[0], lastPos[1]);
            } catch (wError) {
                console.error("Weather fetch failed:", wError);
            }
        }

        const wktString = toWKT(livePath); 
        
        let targetPathId: number;
        let targetPathName: string;

        // --- BRANCHING LOGIC: LINK vs CREATE ---
        
        if (matchedPath && linkToExisting) {
            // CASE A: Link to Existing Path (Public or Own)
            targetPathId = matchedPath.id;
            targetPathName = matchedPath.name;

            // If it's a public path I don't own, add it to my favorites
            if (matchedPath.id_owner !== currentUserId) {
                try {
                    await supabase
                        .from('saved_paths')
                        .upsert(
                            { user_id: currentUserId, path_id: matchedPath.id }, 
                            { onConflict: 'user_id, path_id' } 
                        );
                    toast.info("Added to your saved paths!");
                } catch (favError) {
                    console.error("Silent error saving favorite:", favError);
                }
            }
            toast.success(`Activity linked to: ${matchedPath.name}`);

        } else {
            // CASE B: Create New Path (or Private Copy of a Public Match)
            // If we have a match but linkToExisting is false, we force Private visibility
            const isForcedPrivate = matchedPath && !linkToExisting;

            const pathPayload = {
                name: newPathForm.name, 
                description: newPathForm.description,
                distance: stats.distance,
                duration: formatTime(stats.duration),
                path_data: livePath,
                geom: wktString,
                hazards: hazards, 
                status: "good", // Default status for new path
                difficulty: "medium", // Default difficulty for new path
                is_public: isForcedPrivate ? false : newPathForm.isPublic,
                id_owner: currentUserId,
                is_manual_setup: false
            };

            const { data: newPath, error: createError } = await supabase
                .from('paths')
                .insert([pathPayload])
                .select()
                .single();

            if (createError) throw createError;
            
            targetPathId = newPath.id;
            targetPathName = newPath.name;
            toast.success(isForcedPrivate ? "Saved as private copy." : "New path created successfully!");
        }

        // 2. Save the Activity Entry
        const activityPayload = {
            name: `${targetPathName} Ride`, // Simply use path name
            path_id: targetPathId,
            user_id: currentUserId,
            started_at: startTime?.toISOString(),
            ended_at: new Date().toISOString(),
            duration_second: stats.duration,
            duration_meters: stats.distance * 1000,
            average_speed: stats.duration > 0 ? (stats.distance * 1000) / stats.duration : 0,
            raw_data: livePath, 
            path: wktString, // Store geometry snapshot
            hazards: hazards, 
            weather_data: finalWeather,
            difficulty: difficulty,
            status: status
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

  // --- MANUAL EDITOR SAVE ---
  const handleSaveManualPath = async () => {
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
            difficulty: manualForm.difficulty, 
            is_public: manualForm.isPublic,
            id_owner: currentUserId,
            is_manual_setup: true
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

  const handlePathCreated = (coords: [number, number][], dist: number, haz: Hazard[]) => {
    setManualPath(coords);
    setHazards(haz);
    if(coords.length >= 2 && dist > 0) {
        setManualDistance(parseFloat((dist / 1000).toFixed(2)));
    } else {
        setManualDistance(0);
    }
  };

  return (
    <div className="p-4 lg:mx-4 lg:p-8 space-y-6 pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Record Trip</h1>
            <p className="text-muted-foreground mt-1">Track your performance or map a route manually.</p>
        </div>
        
        {isDebugMode && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 font-mono text-xs">
                DEBUG: {debugPathType.toUpperCase()}
            </Badge>
        )}
      </div>

      <Tabs defaultValue="auto" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="auto" className="gap-2"><Navigation className="w-4 h-4" /> Automatic Tracker</TabsTrigger>
          <TabsTrigger value="manual" className="gap-2"><Edit3 className="w-4 h-4" /> Manual Editor</TabsTrigger>
        </TabsList>

        {/* --- AUTOMATIC TRACKER UI --- */}
        <TabsContent value="auto" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: MAP */}
            <Card className="lg:col-span-2 border-border/50 overflow-hidden h-[500px] flex flex-col relative shadow-md">
              <div className="absolute inset-0 z-0">
                  <BikeMap 
                    mode="record" 
                    initialCenter={[45.4642, 9.1900]} 
                    currentLocation={currentPos} 
                    recordedPath={livePath} 
                    autoCenter={isTracking} 
                    hazards={hazards} 
                  />
              </div>

              {/* Start Overlay */}
              {!isTracking && livePath.length === 0 && (
                 <div className="absolute inset-0 bg-background/40 z-[10] flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
                     <p className="bg-background/90 px-4 py-2 rounded-full text-sm font-medium shadow-lg border animate-pulse">
                        Press Play to start recording
                     </p>
                 </div>
              )}

              {/* Controls Overlay */}
              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-end z-50 gap-4 pointer-events-none">
                <div className="pointer-events-auto flex gap-4 items-center">
                  {!isTracking ? (
                    <Button 
                        size="lg" 
                        className="rounded-full w-20 h-20 shadow-2xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300" 
                        onClick={handleStart} 
                        disabled={isSaving || isCheckingPath}
                    >
                      <Play className="w-8 h-8 ml-1" />
                    </Button>
                  ) : (
                    <>
                        <Button 
                            size="lg" 
                            className="rounded-full w-16 h-16 shadow-xl bg-amber-500 hover:bg-amber-600 border-none transition-all hover:scale-105" 
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
                        </Button>
                        
                        <Button 
                            variant="destructive" 
                            size="lg" 
                            className="rounded-full w-16 h-16 shadow-xl border-none transition-all hover:scale-105" 
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

            {/* RIGHT COLUMN: STATS */}
            <div className="space-y-4">
               {/* LIVE STATS */}
               <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
                <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-primary" /> Live Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 pt-4">
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                      <Route className="w-4 h-4 text-primary mx-auto mb-1 opacity-70" />
                      <p className="text-xl font-bold font-mono">{stats.distance.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">km</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                      <Clock className="w-4 h-4 text-primary mx-auto mb-1 opacity-70" />
                      <p className="text-xl font-bold font-mono">{formatTime(stats.duration)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                      <Gauge className="w-4 h-4 text-blue-500 mx-auto mb-1 opacity-70" />
                      <p className="text-xl font-bold font-mono">{stats.duration > 0 ? (stats.distance / (stats.duration / 3600)).toFixed(1) : "0.0"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Avg Km/h</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background border shadow-sm">
                      <Navigation className="w-4 h-4 text-blue-500 mx-auto mb-1 opacity-70" />
                      <p className="text-xl font-bold font-mono">{isPaused ? "0.0" : stats.currentSpeed.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Cur Km/h</p>
                  </div>
                </CardContent>
              </Card>

              {/* HAZARDS LIST */}
              <Card className="border-border/50 flex-1 shadow-sm h-[200px] flex flex-col">
                <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Detected Hazards
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full">
                        {hazards.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4">
                                <CheckCircle className="w-8 h-8 mb-2" />
                                <p className="text-xs">No hazards detected yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {hazards.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full">
                                                <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="capitalize font-medium text-xs">{h.type}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground">
                                                    Lat: {h.location[0].toFixed(4)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" size="icon" className="h-6 w-6"
                                            onClick={() => removeHazard(i)}
                                        >
                                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                                        </Button>
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

        {/* --- MANUAL EDITOR UI --- */}
        <TabsContent value="manual" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border/50 h-[600px] overflow-hidden flex flex-col shadow-md">
                    <CardHeader className="p-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2"><Edit3 className="w-4 h-4" /> Geometry Editor</CardTitle>
                        <Badge variant="outline" className="text-[10px] font-normal">Click map to draw</Badge>
                    </CardHeader>
                    <div className="flex-1 relative">
                        <BikeMap 
                            mode="edit" 
                            initialCenter={[45.4642, 9.1900]} 
                            onPathChange={handlePathCreated} 
                        />
                    </div>
                </Card>

                <Card className="border-border/50 shadow-md">
                    <CardHeader>
                        <CardTitle className="font-display">Path Details</CardTitle>
                        <p className="text-sm text-muted-foreground">Define the static characteristics of this route.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Path Name</Label>
                            <Input 
                                placeholder="e.g. Martesana Cycleway"
                                value={manualForm.name} 
                                onChange={(e) => setManualForm({...manualForm, name: e.target.value})} 
                            />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    {manualForm.isPublic ? <Globe className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                    <Label className="text-sm font-semibold cursor-pointer">Public Path</Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {manualForm.isPublic ? "Visible on community map" : "Private (only visible to you)"}
                                </p>
                            </div>
                            <Switch checked={manualForm.isPublic} onCheckedChange={(checked) => setManualForm({...manualForm, isPublic: checked})} />
                        </div>

                        <div className="space-y-2">
                            <Label>Total Length (km)</Label>
                            <Input value={manualDistance} readOnly className="bg-muted font-mono text-muted-foreground" />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea 
                                value={manualForm.description} 
                                onChange={(e) => setManualForm({...manualForm, description: e.target.value})} 
                                rows={3} 
                                placeholder="Add notes about landmarks or surface type..."
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Condition</Label>
                                <Select value={manualForm.status} onValueChange={(v) => setManualForm({...manualForm, status: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="optimal">Optimal</SelectItem>
                                        <SelectItem value="good">Good</SelectItem>
                                        <SelectItem value="fair">Fair</SelectItem>
                                        <SelectItem value="bad">Bad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select value={manualForm.difficulty} onValueChange={(v) => setManualForm({...manualForm, difficulty: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button className="w-full mt-4 bg-primary hover:bg-primary/90" onClick={handleSaveManualPath} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} 
                            Create Path
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* --- SAVE DIALOG (TRACKING) --- */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className={matchedPath ? "text-emerald-600 flex items-center gap-2" : ""}>
                    {matchedPath 
                        ? (isOwnPath ? <><UserIcon className="w-5 h-5" /> Welcome Back!</> : <><CheckCircle className="w-5 h-5" /> Path Recognized!</>)
                        : "New Path Detected"}
                </DialogTitle>
                <DialogDescription>
                    {matchedPath 
                        ? (isOwnPath 
                            ? `You are recording an activity on your path "${matchedPath.name}".`
                            : "Your track matches an existing public path. Link your activity to compare stats?")
                        : "You explored a new area! Give this track a name to save it."}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
                
                {/* 1. PATH IDENTITY / MATCH INFO */}
                {matchedPath ? (
                    <div className="space-y-4">
                        <div className={`p-4 border rounded-lg flex flex-col gap-3 transition-colors ${linkToExisting ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900' : 'bg-muted/30 border-border'}`}>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {isOwnPath ? "Your Path" : "Community Path"}
                                    </span>
                                    <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                                        <MapPin className="w-4 h-4 text-emerald-600" /> 
                                        {matchedPath.name}
                                    </div>
                                </div>

                                {/* SWITCH OPT-OUT (Visible only if it's NOT my path) */}
                                {!isOwnPath ? (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="link-mode" className="text-xs cursor-pointer font-medium">Link Activity</Label>
                                            <Switch 
                                                id="link-mode"
                                                checked={linkToExisting}
                                                onCheckedChange={setLinkToExisting}
                                                className="data-[state=checked]:bg-emerald-600"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* If it is mine, show a static badge */
                                    <div className="px-2 py-1 bg-background/50 rounded text-xs font-medium text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                        Auto-Linked
                                    </div>
                                )}
                            </div>

                            {!linkToExisting && !isOwnPath && (
                                <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border border-dashed border-border">
                                    You are creating a <strong>private copy</strong>. Your stats won't appear on the public leaderboard.
                                </div>
                            )}
                        </div>

                        {/* Input for Private Copy Name (Only if NOT mine and Switch is OFF) */}
                        {!linkToExisting && !isOwnPath && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        Private Copy Name
                                        <Lock className="w-3 h-3 text-amber-500" />
                                    </Label>
                                    <Input 
                                        value={newPathForm.name} 
                                        onChange={(e) => setNewPathForm({...newPathForm, name: e.target.value})}
                                        placeholder="Name your private version..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // --- CASE: NEW PATH (NO MATCH) ---
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-2">
                            <Label>Path Name</Label>
                            <Input 
                                placeholder="e.g. Navigli Sunday Ride" 
                                value={newPathForm.name} 
                                onChange={(e) => setNewPathForm({...newPathForm, name: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea 
                                placeholder="Brief description of the route..." 
                                value={newPathForm.description} 
                                onChange={(e) => setNewPathForm({...newPathForm, description: e.target.value})} 
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Globe className="w-4 h-4" />
                                <span>Make Public?</span>
                            </div>
                            <Switch 
                                checked={newPathForm.isPublic} 
                                onCheckedChange={(c) => setNewPathForm({...newPathForm, isPublic: c})} 
                            />
                        </div>
                    </div>
                )}

                {/* 2. RIDE FEEDBACK (Status & Difficulty) */}
                <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> How was the ride?
                    </h3>
                    
                    <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground uppercase">Difficulty Level</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {['easy', 'medium', 'hard', 'expert'].map((level) => (
                                <div 
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`
                                        cursor-pointer flex items-center justify-center py-2 px-1 rounded-md border text-xs capitalize transition-all font-medium select-none
                                        ${difficulty === level 
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                            : 'bg-background hover:bg-muted text-muted-foreground'}
                                    `}
                                >
                                    {level}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground uppercase">Path Condition</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: 'optimal', label: 'Optimal', icon: CheckCircle2, color: 'text-emerald-500' },
                                { val: 'good', label: 'Good', icon: ThumbsUp, color: 'text-blue-500' },
                                { val: 'fair', label: 'Bumpy/Fair', icon: AlertCircle, color: 'text-amber-500' },
                                { val: 'bad', label: 'Bad/Gravel', icon: ThumbsDown, color: 'text-red-500' }
                            ].map((opt) => (
                                <div 
                                    key={opt.val}
                                    onClick={() => setStatus(opt.val)}
                                    className={`
                                        cursor-pointer flex items-center gap-2 p-2 rounded-md border text-sm transition-all select-none
                                        ${status === opt.val 
                                            ? 'bg-accent border-accent-foreground/20 ring-1 ring-accent-foreground/20 shadow-sm' 
                                            : 'bg-background hover:bg-muted text-muted-foreground'}
                                    `}
                                >
                                    <opt.icon className={`w-4 h-4 ${status === opt.val ? opt.color : 'opacity-50'}`} />
                                    <span className={status === opt.val ? 'font-semibold text-foreground' : ''}>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. HAZARDS CONFIRMATION */}
                {hazards.length > 0 && (
                    <div className="space-y-2 pt-2 border-t mt-2">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
                                <AlertTriangle className="w-4 h-4" /> 
                                Detected Hazards ({hazards.length})
                            </Label>
                        </div>
                        
                        <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900 rounded-lg p-2">
                            <ScrollArea className="h-[120px] pr-3">
                                <div className="space-y-2">
                                    {hazards.map((h, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-background/80 backdrop-blur border rounded-md shadow-sm group">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-orange-100 dark:bg-orange-900/50 p-1.5 rounded-full shrink-0">
                                                    <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium capitalize truncate">{h.type}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">
                                                        {h.location[0].toFixed(4)}, {h.location[1].toFixed(4)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                                onClick={() => removeHazard(index)}
                                                title="Remove hazard"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <p className="text-[10px] text-muted-foreground/70 mt-2 text-center italic">
                                Review hazards. You can delete false detections before saving.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => resetTrackingSession()}>Discard Activity</Button>
                <Button onClick={confirmSaveTracking} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                    {isSaving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                        "Save Activity"
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordTrip;

// --- MOCK DATA FOR DEBUGGING ---
const MOCK_ROUTE: [number, number][] = [
    [45.46420, 9.19000], [45.46425, 9.19005], [45.46430, 9.19010],
    [45.46435, 9.19015], [45.46440, 9.19020], [45.46445, 9.19025],
    [45.46450, 9.19030], [45.46455, 9.19035], [45.46460, 9.19040],
    [45.46465, 9.19045], [45.46470, 9.19050], [45.46475, 9.19055],
    [45.46480, 9.19060], [45.46485, 9.19065], [45.46490, 9.19070],
    [45.46495, 9.19075], [45.46500, 9.19080], [45.46510, 9.19090], 
    [45.46520, 9.19100], [45.46530, 9.19110], [45.46540, 9.19120],
    [45.46550, 9.19130], [45.46555, 9.19140], [45.46560, 9.19150],
    [45.46560, 9.19165], [45.46560, 9.19180], [45.46560, 9.19195],
    [45.46560, 9.19210], [45.46560, 9.19225], [45.46560, 9.19240]
];