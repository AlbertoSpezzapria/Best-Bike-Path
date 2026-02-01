import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

// Components
import BikeMap, { Hazard } from "@/components/BikeMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import { 
  ArrowLeft, Loader2, Calendar, Route as RouteIcon, Trophy, 
  User, Filter, Heart, Activity, AlertTriangle, BarChart3, 
  Trash2, ChevronRight 
} from "lucide-react";

// --- UTILS & CONFIG ---

/** Formats total seconds into human-readable duration (Hh Mm) or (Mm Ss) */
const formatDuration = (seconds: number) => {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
};

/** Returns visual styling and metadata for path condition status */
const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase();
    const configs: Record<string, any> = {
        optimal: { label: 'Optimal', color: 'bg-green-100 text-green-700 border-green-200', icon: <Activity className="w-3 h-3" /> },
        good: { label: 'Good', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Activity className="w-3 h-3" /> },
        bad: { label: 'Rough', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <AlertTriangle className="w-3 h-3" /> },
        critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    return configs[s] || { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Activity className="w-3 h-3" /> };
};

/** Returns visual styling for path difficulty levels */
const getDifficultyConfig = (diff: string) => {
    const d = diff?.toLowerCase();
    const configs: Record<string, any> = {
        easy: { label: 'Easy', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        hard: { label: 'Hard', color: 'bg-rose-100 text-rose-700 border-rose-200' }
    };
    return configs[d] || { label: 'N/A', color: 'bg-gray-100 text-gray-700 border-gray-200' };
};

const PathDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [pathData, setPathData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"performance" | "date" | "duration">("performance");
  const [isSaved, setIsSaved] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  /** Fetches path details, user's saved status, and leaderboard activities */
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Check if path is in user favorites
      if (user) {
          const { data: saved } = await supabase.from('saved_paths').select('id').eq('user_id', user.id).eq('path_id', id).maybeSingle();
          setIsSaved(!!saved);
      }

      // Fetch path geometry and metadata
      const { data: pData } = await supabase.from('paths').select('*').eq('id', id).single();
      setPathData(pData);

      // Fetch related user activities (Leaderboard)
      const { data: aData } = await supabase
        .from('activities')
        .select(`*, profiles!user_id (Surname)`)
        .eq('path_id', id);
      
      setActivities(aData || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  /** Toggles path between user's favorites list */
  const toggleSavePath = async () => {
    if (!currentUser) return toast.error("You must be logged in");

    if (isSaved) {
        const { error } = await supabase.from('saved_paths').delete().eq('user_id', currentUser.id).eq('path_id', id);
        if (!error) { setIsSaved(false); toast.success("Removed from favorites"); }
    } else {
        const { error } = await supabase.from('saved_paths').insert([{ user_id: currentUser.id, path_id: id }]);
        if (!error) { setIsSaved(true); toast.success("Added to favorites!"); }
    }
  };

  /** Permanently deletes an activity from the leaderboard */
  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    const { error } = await supabase.from('activities').delete().eq('id', activityToDelete);
    
    if (error) toast.error("Error deleting activity");
    else {
        setActivities(prev => prev.filter(a => a.id !== activityToDelete));
        toast.success("Activity deleted");
    }
    setActivityToDelete(null);
  };

  /** Applies client-side sorting based on UI selection */
  const sortedActivities = [...activities].sort((a, b) => {
    if (sortBy === "performance") return (b.average_speed || 0) - (a.average_speed || 0);
    if (sortBy === "date") return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    if (sortBy === "duration") return (a.duration_second || 0) - (b.duration_second || 0);
    return 0;
  });

  // Loading & Error states
  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!pathData) return <div className="p-10">Path not found.</div>;

  const statusConfig = getStatusConfig(pathData.status);
  const diffConfig = getDifficultyConfig(pathData.difficulty);
  const isGuest = localStorage.getItem("guestMode") === "true";

  return (
    <div className="p-6 space-y-6 h-full flex flex-col max-w-6xl mx-auto">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-display flex flex-wrap items-center gap-3">
                    {pathData.name}
                    <Badge variant="outline" className={`gap-1 font-normal ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.label}
                    </Badge>
                    <Badge variant="outline" className={`gap-1 font-normal ${diffConfig.color}`}>
                        <BarChart3 className="w-3 h-3" /> {diffConfig.label}
                    </Badge>
                </h1>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><RouteIcon className="w-3 h-3"/> {Number(pathData.distance).toFixed(2)} km</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(pathData.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        {!isGuest && (
            <Button variant="outline" size="sm" onClick={toggleSavePath} className={isSaved ? "bg-red-50 border-red-200 text-red-600" : ""}>
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
            </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          <div className={isGuest ? "lg:col-span-3 space-y-6" : "lg:col-span-2 space-y-6"}>
              
              {/* --- MAP VIEW --- */}
              <Card className="overflow-hidden border-border/50 h-[450px]">
                <BikeMap 
                    mode="view" 
                    recordedPath={pathData.path_data || []} 
                    initialCenter={pathData.path_data?.[0] || [45.4642, 9.1900]} 
                    hazards={pathData.hazards || []} 
                />
              </Card>

              {/* --- DESCRIPTION & HAZARDS --- */}
              <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 p-5 rounded-lg border border-border/50">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><RouteIcon className="w-4 h-4 text-primary" /> Description</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{pathData.description || "No description available."}</p>
                  </div>

                  <Card className="border-border/50">
                      <CardHeader className="py-3 px-4 bg-muted/20 border-b">
                          <CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Detected Hazards ({pathData.hazards?.length || 0})</CardTitle>
                      </CardHeader>
                      <ScrollArea className="h-[200px]">
                          <CardContent className="p-0">
                             {!pathData.hazards?.length ? (
                                 <div className="p-4 text-center text-xs text-muted-foreground">No hazards reported.</div>
                             ) : (
                                 <div className="divide-y">
                                     {pathData.hazards.map((h: Hazard, i: number) => (
                                         <div key={i} className="p-3 flex items-center gap-3 hover:bg-muted/10 transition-colors">
                                             <div className="bg-orange-100 p-1.5 rounded-full text-orange-600 shrink-0"><AlertTriangle className="w-3 h-3" /></div>
                                             <div>
                                                 <p className="text-sm font-medium text-foreground capitalize">{h.type}</p>
                                                 <p className="text-[10px] text-muted-foreground font-mono">{h.location[0].toFixed(4)}, {h.location[1].toFixed(4)}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                          </CardContent>
                      </ScrollArea>
                  </Card>
              </div>
          </div>

          {/* --- LEADERBOARD --- */}
          <div className="lg:col-span-1">
              <Card className="h-full border-border/50 flex flex-col">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                      <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard</CardTitle>
                      <div className="pt-2">
                          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                              <SelectTrigger className="w-full h-8 text-xs">
                                  <div className="flex items-center gap-2"><Filter className="w-3 h-3" /><SelectValue placeholder="Sort by" /></div>
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="performance">Speed</SelectItem>
                                  <SelectItem value="duration">Duration</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                      {sortedActivities.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                              <Trophy className="w-8 h-8 text-muted opacity-30" /><p>No activities recorded.</p>
                          </div>
                      ) : (
                          <div className="divide-y">
                              {sortedActivities.map((act, index) => {
                                  const isMe = currentUser && act.user_id === currentUser.id;
                                  return (
                                    <div key={act.id} className={`p-3 flex items-center justify-between hover:bg-muted/20 transition-colors ${isMe ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${sortBy === 'performance' && index === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200' : 'text-muted-foreground bg-muted'}`}>
                                                {index + 1}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium flex items-center gap-1 truncate">{isMe ? <span className="text-primary font-bold">You</span> : <>{act.profiles?.Surname || `Rider ${act.user_id.slice(0, 4)}`}</>}</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(act.started_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-sm font-bold font-mono">{act.average_speed?.toFixed(1) || '-'} <span className="text-[10px] font-normal text-muted-foreground">km/h</span></p>
                                                <p className="text-[10px] text-muted-foreground">{formatDuration(act.duration_second)}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => navigate('/app/activity/' + act.id)}><ChevronRight className="w-5 h-5" /></Button>
                                                {isMe && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setActivityToDelete(act.id)}><Trash2 className="w-4 h-4" /></Button>}
                                            </div>
                                        </div>
                                    </div>
                                );
                              })}
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>

      {/* --- CONFIRMATION DIALOGS --- */}
      <AlertDialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
                <AlertDialogDescription>Your performance will be removed from the leaderboard. The path data itself remains safe.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteActivity} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PathDetail;