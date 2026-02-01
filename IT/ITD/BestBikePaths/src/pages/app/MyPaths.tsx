import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Icons
import { 
  Loader2, Plus, Route as RouteIcon, Calendar, Globe, 
  Lock, Trash2, Heart, ArrowUpDown, AlertTriangle, Merge 
} from "lucide-react";

// --- UTILS ---

/** Converts coordinate array to Well-Known Text (WKT) Linestring for PostGIS */
const toWKT = (coords: [number, number][]) => {
  if (!coords || coords.length < 2) return null;
  return `LINESTRING(${coords.map(c => `${c[1]} ${c[0]}`).join(", ")})`;
};

const MyPaths = () => {
  const navigate = useNavigate();

  // State Management
  const [createdPaths, setCreatedPaths] = useState<any[]>([]);
  const [savedPaths, setSavedPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Dialog & Conflict Management
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictPath, setConflictPath] = useState<any>(null); 
  const [pendingPathToPublic, setPendingPathToPublic] = useState<any>(null); 
  const [pathToDelete, setPathToDelete] = useState<any>(null);
  
  const [sortOption, setSortOption] = useState<string>("date_desc");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /** Fetches both user-created paths and community paths saved as favorites */
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Fetch paths owned by user
    const { data: created } = await supabase
      .from('paths')
      .select('*')
      .eq('id_owner', user.id); 

    if (created) setCreatedPaths(created);

    // Fetch paths saved by user 
    const { data: saved } = await supabase
      .from('saved_paths')
      .select(`path_id, created_at, paths:path_id (*)`)
      .eq('user_id', user.id);

    if (saved) {
        setSavedPaths(saved.map((item: any) => item.paths).filter((p: any) => p !== null));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC ---

  /** Client-side sorting based on Select input */
  const getSortedPaths = (list: any[]) => {
      const sorted = [...list];
      switch (sortOption) {
          case "date_desc": return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          case "date_asc":  return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          case "dist_desc": return sorted.sort((a, b) => (b.distance || 0) - (a.distance || 0));
          case "dist_asc":  return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          default:          return sorted;
      }
  };

  /** Handles visibility changes with community usage and geometric duplicate checks */
  const toggleVisibility = async (e: React.MouseEvent, path: any) => {
    e.stopPropagation();
    setTogglingId(path.id);
    
    // Case 1: Making a Public path Private
    if (path.is_public) {
        const { data: usageCount } = await supabase.rpc('get_path_community_usage', { p_path_id: path.id });

        if (usageCount > 0) {
            toast.warning("Cannot make private", { description: `Actively used by ${usageCount} other riders.` });
            setTogglingId(null);
            return;
        }
        await performUpdate(path.id, false);
        return;
    }

    // Case 2: Making a Private path Public (check for duplicates)
    const wktString = toWKT(path.path_data);
    const { data: matches, error } = await supabase.rpc('check_path_similarity', {
        new_geom_wkt: wktString,
        tolerance_meters: 20,
        length_tolerance_pct: 0.1
    });

    if (!error) {
        const existingPublic = matches?.find((m: any) => m.id !== path.id && m.is_public === true);
        if (existingPublic) {
            setConflictPath(existingPublic);
            setPendingPathToPublic(path);
            setShowConflictDialog(true);
            setTogglingId(null);
            return;
        }
    }
    await performUpdate(path.id, true);
  };

  /** Helper to execute visibility update on DB */
  const performUpdate = async (pathId: string, newStatus: boolean) => {
      const { error } = await supabase.from('paths').update({ is_public: newStatus }).eq('id', pathId);

      if (error) {
          toast.error("Update failed");
      } else {
          setCreatedPaths(prev => prev.map(p => p.id === pathId ? { ...p, is_public: newStatus } : p));
          toast.success(newStatus ? "Path is now Public" : "Path is now Private");
      }
      setTogglingId(null);
  };

  /** Removes a path from user's favorites list */
  const handleDeleteFavorite = async (pathId: string) => {
    if (!confirm("Remove from favorites?")) return;
    const { error } = await supabase.from('saved_paths').delete().eq('user_id', userId).eq('path_id', pathId);
    if (!error) { 
        toast.success("Removed from favorites"); 
        fetchData(); 
    }
  };

  /** Permanently deletes path if not utilized by other community members */
  const confirmDeletePath = async () => {
    if (!pathToDelete) return;
    const { data: usageCount } = await supabase.rpc('get_path_community_usage', { p_path_id: pathToDelete.id });

    if (usageCount > 0) {
        toast.warning("Cannot delete", { description: "Path is actively used by other riders." });
        setPathToDelete(null);
        return;
    }

    const { error, count } = await supabase.from('paths').delete().eq('id', pathToDelete.id).eq('id_owner', userId).select(); 

    if (error) toast.error("Error deleting path.");
    else if (count === 0) toast.warning("Delete failed", { description: "Path is protected or restricted." });
    else {
        toast.success("Path deleted permanently");
        fetchData();
    }
    setPathToDelete(null);
  };

  /** Resolves duplicate conflict by moving activities to existing public path and deleting local copy */
  const handleMerge = async () => {
    if (!conflictPath || !pendingPathToPublic || !userId) return;
    setTogglingId(pendingPathToPublic.id);

    try {
        // Transfer activity ownership to existing public path
        const { error: moveError } = await supabase.from('activities').update({ path_id: conflictPath.id }).eq('path_id', pendingPathToPublic.id);
        if (moveError) throw moveError;

        // Ensure existing path is in user's favorites
        await supabase.from('saved_paths').upsert({ user_id: userId, path_id: conflictPath.id }, { onConflict: 'user_id, path_id' });

        // Delete the redundant private path
        await supabase.from('paths').delete().eq('id', pendingPathToPublic.id);
        
        setCreatedPaths(prev => prev.filter(p => p.id !== pendingPathToPublic.id));
        await fetchData(); 
        toast.success("Merged successfully!");
    } catch (e) {
        toast.error("Merge failed. Please try again.");
    } finally {
        setShowConflictDialog(false);
        setTogglingId(null);
    }
  };

  const handleKeepPrivate = () => {
     setShowConflictDialog(false);
     setPendingPathToPublic(null);
     toast.info("Action cancelled. Path remains private.");
  };

  // --- SUB-COMPONENTS ---

  const PathCard = ({ path, isSavedView }: { path: any, isSavedView: boolean }) => (
    <Card 
        className="group cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/50 overflow-hidden relative"
        onClick={() => navigate(`/app/path/${path.id}`)}
    >
        <div className="h-32 bg-muted/50 w-full flex items-center justify-center relative overflow-hidden">
            <RouteIcon className="w-10 h-10 text-muted-foreground/30" />
            
            <div className="absolute top-2 right-2 z-10">
                {!isSavedView ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant={path.is_public ? "secondary" : "destructive"} 
                                    className={`h-6 text-[10px] px-2 gap-1 shadow-sm ${path.is_public ? 'bg-white/90 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    onClick={(e) => toggleVisibility(e, path)}
                                    disabled={togglingId === path.id}
                                >
                                    {togglingId === path.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                        <>
                                            {path.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {path.is_public ? "Public" : "Private"}
                                        </>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Switch to {path.is_public ? "Private" : "Public"}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Badge variant={path.is_public ? "default" : "secondary"} className="shadow-sm gap-1">
                        {path.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {path.is_public ? "Public" : "Private"}
                    </Badge>
                )}
            </div>
        </div>
        
        <CardContent className="p-4">
            <div className="mb-2">
                <h3 className="font-bold text-lg truncate pr-6 group-hover:text-primary transition-colors">{path.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{path.description || "No description"}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded text-xs">
                    <RouteIcon className="w-3 h-3" /> {Number(path.distance).toFixed(2)} km
                </span>
                <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded text-xs">
                    <Calendar className="w-3 h-3" /> {new Date(path.created_at).toLocaleDateString()}
                </span>
            </div>
            <Button 
                variant="ghost" size="icon" 
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={(e) => {
                    e.stopPropagation();
                    isSavedView ? handleDeleteFavorite(path.id) : setPathToDelete(path);
                }}
            >
                {isSavedView ? <Heart className="w-4 h-4 fill-current" /> : <Trash2 className="w-4 h-4" />}
            </Button>
        </CardContent>
    </Card>
  );

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-6 lg:mx-4 lg:p-8 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-display font-bold">My Paths</h1>
            <p className="text-muted-foreground">Manage your tracks and favorites.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
             <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                    <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date_desc">Date: Newest</SelectItem>
                    <SelectItem value="date_asc">Date: Oldest</SelectItem>
                    <SelectItem value="dist_desc">Distance: Longest</SelectItem>
                    <SelectItem value="dist_asc">Distance: Shortest</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={() => navigate("/app/record")} className="gap-2 shadow-lg"><Plus className="w-4 h-4" /> New</Button>
        </div>
      </div>

      <Tabs defaultValue="created" className="space-y-6">
        <TabsList>
            <TabsTrigger value="created">Created ({createdPaths.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedPaths.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="space-y-6">
            {createdPaths.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed"><p className="text-muted-foreground">No paths created yet.</p></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getSortedPaths(createdPaths).map(path => <PathCard key={path.id} path={path} isSavedView={false} />)}
                </div>
            )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
            {savedPaths.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">No saved paths.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getSortedPaths(savedPaths).map(path => <PathCard key={path.id} path={path} isSavedView={true} />)}
                </div>
            )}
        </TabsContent>
      </Tabs>
       
      {/* CONFLICT DIALOG */}
      <AlertDialog open={showConflictDialog} onOpenChange={(open) => !open && handleKeepPrivate()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
               <AlertTriangle className="w-5 h-5" /> Duplicate Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              A public path <strong>"{conflictPath?.name}"</strong> matches your route. Duplicate public paths are not allowed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 my-2">
             <button onClick={handleMerge} className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left group">
                <Merge className="w-4 h-4 text-emerald-800" />
                <div>
                    <p className="font-bold text-sm">Merge & Delete Mine</p>
                    <p className="text-xs text-muted-foreground">Join the existing leaderboard. Your private path will be removed.</p>
                </div>
             </button>
             <button onClick={handleKeepPrivate} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left group">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                    <p className="font-bold text-sm">Keep Private</p>
                    <p className="text-xs text-muted-foreground">Cancel publication. Only you can see this path.</p>
                </div>
             </button>
          </div>
          <AlertDialogFooter><AlertDialogCancel onClick={handleKeepPrivate}>Cancel</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* DELETE DIALOG */}
      <AlertDialog open={!!pathToDelete} onOpenChange={(open) => !open && setPathToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Path?</AlertDialogTitle>
                <AlertDialogDescription>Are you sure? This permanently removes <strong>"{pathToDelete?.name}"</strong> and all its data.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeletePath} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPaths;