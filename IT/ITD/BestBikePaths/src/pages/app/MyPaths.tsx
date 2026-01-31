import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Route as RouteIcon, Calendar, Globe, Lock, Trash2, Heart, ArrowUpDown, AlertTriangle, Copy, Merge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

// --- WKT BUILDER ---
const toWKT = (coords: [number, number][]) => {
  if (coords.length < 2) return null;
  const points = coords.map(c => `${c[1]} ${c[0]}`).join(", ");
  return `LINESTRING(${points})`;
};

const MyPaths = () => {
  const navigate = useNavigate();
  const [createdPaths, setCreatedPaths] = useState<any[]>([]);
  const [savedPaths, setSavedPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictPath, setConflictPath] = useState<any>(null); 
  const [pendingPathToPublic, setPendingPathToPublic] = useState<any>(null); 
  
  // Sort State
  const [sortOption, setSortOption] = useState<string>("date_desc");

  // Loading state for visibility toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // 1. Fetch CREATED BY ME
    const { data: created } = await supabase
      .from('paths')
      .select('*')
      .eq('id_owner', user.id); 

    if (created) setCreatedPaths(created);

    // 2. Fetch SAVED
    const { data: saved } = await supabase
      .from('saved_paths')
      .select(`path_id, created_at, paths:path_id (*)`)
      .eq('user_id', user.id);

    if (saved) {
        const cleanSaved = saved.map((item: any) => item.paths).filter((p: any) => p !== null);
        setSavedPaths(cleanSaved);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- SORTING LOGIC ---
  const getSortedPaths = (list: any[]) => {
      const sorted = [...list];
      switch (sortOption) {
          case "date_desc": // Newest
              return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          case "date_asc": // Oldest
              return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          case "dist_desc": // Longest
              return sorted.sort((a, b) => (b.distance || 0) - (a.distance || 0));
          case "dist_asc": // Shortest
              return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          default:
              return sorted;
      }
  };

   // Smart Visibility Toggle
  const toggleVisibility = async (e: React.MouseEvent, path: any) => {
    e.stopPropagation();
    
    // --- CASE A: PUBLIC -> PRIVATE (Blocco se usato da altri) ---
    if (path.is_public) {
        setTogglingId(path.id);
        console.log("RPC Call Payload:", { p_path_id: path.id, type: typeof path.id });

        if (!path.id) {
            toast.error("Error: Path ID is missing");
            setTogglingId(null);
            return;
        }
        
        // 1. Controlla se qualcuno altro lo sta usando
        // Nota: Assicurati di aver creato la funzione RPC 'get_path_community_usage' su Supabase come discusso prima
        const { data: usageCount, error } = await supabase.rpc('get_path_community_usage', {
            p_path_id: path.id,
        });

        if (error) {
            console.error("RPC Error Details:", error);
            toast.error(`Error checking usage: ${error.message}`);
            setTogglingId(null);
            return;
        }

        if (usageCount > 0) {
            toast.warning("Cannot make private", {
                description: `This path is actively used by ${usageCount} other rider(s). It must remain public.`
            });
            setTogglingId(null);
            return;
        }

        // Se nessuno lo usa, procedi pure a renderlo privato
        await performUpdate(path.id, false);
        return;
    }

    // --- CASE B: PRIVATE -> PUBLIC (Controllo Duplicati) ---
    if (!path.is_public) {
        setTogglingId(path.id);

        const wktString = toWKT(path.path_data);


        // 1. Cerca duplicati geometrici
        const { data: matches, error } = await supabase.rpc('check_path_similarity', {
            new_geom_wkt: wktString,
            tolerance_meters: 20,
            length_tolerance_pct: 0.1
        });

        if (error) {
             console.error("Match error", error);
             // In caso di errore tecnico, procediamo con cautela permettendo l'update
             await performUpdate(path.id, true);
             return;
        }

        // Cerchiamo se esiste UN ALTRO percorso pubblico diverso dal mio
        const existingPublic = matches?.find((m: any) => m.id !== path.id && m.is_public === true);

        if (existingPublic) {
            setConflictPath(existingPublic);
            setPendingPathToPublic(path);
            setShowConflictDialog(true);
            setTogglingId(null); // Sblocca lo spinner
            return;
        }

        // Nessun duplicato, procedi
        await performUpdate(path.id, true);
    }
  };

  // Funzione helper per l'update effettivo
  const performUpdate = async (pathId: string, newStatus: boolean) => {
      const { error } = await supabase
          .from('paths')
          .update({ is_public: newStatus })
          .eq('id', pathId);

      if (error) {
          toast.error("Update failed");
      } else {
          setCreatedPaths(prev => prev.map(p => 
              p.id === pathId ? { ...p, is_public: newStatus } : p
          ));
          toast.success(newStatus ? "Path is now Public" : "Path is now Private");
      }
      setTogglingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, pathId: string, isSavedOnly: boolean) => {
    e.stopPropagation();
    
    if (isSavedOnly) {
        if (!confirm("Remove from favorites?")) return;
        const { error } = await supabase.from('saved_paths').delete().eq('user_id', userId).eq('path_id', pathId);
        if (!error) { toast.success("Removed from favorites"); fetchData(); }
    } else {
        if (!confirm("Delete permanently? This will also remove associated leaderboards.")) return;
        const { error } = await supabase.from('paths').delete().eq('id', pathId);
        if (!error) { toast.success("Path deleted"); fetchData(); }
    }
  };

  const handleMerge = async () => {
    const { data: { user } } = await supabase.auth.getUser();    
    if (!conflictPath || !pendingPathToPublic) return;
    setTogglingId(pendingPathToPublic.id); // Mostra loading sulla card

    try {
        // 1. Sposta le mie attività sul path pubblico esistente
        const { error: moveError } = await supabase
            .from('activities')
            .update({ path_id: conflictPath.id })
            .eq('path_id', pendingPathToPublic.id);
        
        if (moveError) throw moveError;

        const { error: saveError } = await supabase
            .from('saved_paths')
            .upsert({ 
                user_id: user.id, 
                path_id: conflictPath.id 
            }, { onConflict: 'user_id, path_id' }); 

        if (saveError) {
            console.error("Errore nel salvataggio dei preferiti:", saveError);
        }

        // 2. Elimina il mio path privato (non serve più)
        const { error: deleteError } = await supabase
            .from('paths')
            .delete()
            .eq('id', pendingPathToPublic.id);
        
        if (deleteError) throw deleteError;

        // 3. Aggiorna la UI rimuovendo il path vecchio
        setCreatedPaths(prev => prev.filter(p => p.id !== pendingPathToPublic.id));

        await fetchData(); 
    
        toast.success("Merged successfully!", { 
            description: `Rides moved to "${conflictPath.name}" and added to your favorites.` 
        });

    } catch (e) {
        console.error(e);
        toast.error("Merge failed. Try again.");
    } finally {
        setShowConflictDialog(false);
        setTogglingId(null);
        setConflictPath(null);
        setPendingPathToPublic(null);
    }
  };

  const handleDuplicate = async () => {
     if (pendingPathToPublic) {
         await performUpdate(pendingPathToPublic.id, true);
     }
     setShowConflictDialog(false);
  };

  // Reusable Card Component
  const PathCard = ({ path, isSavedView }: { path: any, isSavedView: boolean }) => (
    <Card 
        className="group cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/50 overflow-hidden relative"
        onClick={() => navigate(`/app/path/${path.id}`)}
    >
        <div className="h-32 bg-muted/50 w-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <RouteIcon className="w-10 h-10 text-muted-foreground/30" />
            
            {/* Visibility Badge/Toggle */}
            <div className="absolute top-2 right-2 z-10">
                {!isSavedView ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant={path.is_public ? "secondary" : "destructive"} 
                                    className={`h-6 text-[10px] px-2 gap-1 shadow-sm opacity-90 hover:opacity-100 transition-opacity ${path.is_public ? 'bg-white/90 text-green-700 hover:bg-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
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
                            <TooltipContent><p>Click to make {path.is_public ? "Private" : "Public"}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Badge variant={path.is_public ? "default" : "secondary"} className="shadow-sm gap-1 cursor-default">
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
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                onClick={(e) => handleDelete(e, path.id, isSavedView)}
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
             {/* SORT DROPDOWN */}
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
            <TabsTrigger value="created">Created by me ({createdPaths.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedPaths.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="space-y-6">
            {createdPaths.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed"><p className="text-muted-foreground">You haven't created any paths yet.</p></div>
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

      {/* --- CONFLICT DIALOG (PRIVATE -> PUBLIC) --- */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
               <AlertTriangle className="w-5 h-5" /> Duplicate Path Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found an existing public path <strong>"{conflictPath?.name}"</strong> that matches your route perfectly.
              <br /><br />
              Do you want to merge your activities into the existing public leaderboard (recommended) or publish yours as a separate duplicate?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col gap-3 my-2">
             {/* Opzione 1: Merge */}
             <button 
                onClick={handleMerge}
                className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
             >
                <div className="bg-primary/20 p-2 rounded-full group-hover:bg-primary/30"><Merge className="w-4 h-4 text-primary" /></div>
                <div>
                    <p className="font-bold text-sm text-foreground">Merge & Delete Mine</p>
                    <p className="text-xs text-muted-foreground">Link your rides to the existing leaderboard. Keeps the map clean.</p>
                </div>
             </button>

             {/* Opzione 2: Duplicate */}
             <button 
                onClick={handleDuplicate}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left group"
             >
                <div className="bg-muted p-2 rounded-full group-hover:bg-muted/80"><Copy className="w-4 h-4" /></div>
                <div>
                    <p className="font-bold text-sm text-foreground">Create Duplicate</p>
                    <p className="text-xs text-muted-foreground">Publish my path anyway with its own separate leaderboard.</p>
                </div>
             </button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
                setShowConflictDialog(false);
                setPendingPathToPublic(null);
            }}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPaths;