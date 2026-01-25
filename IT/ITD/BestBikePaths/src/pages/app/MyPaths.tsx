import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Route as RouteIcon, Calendar, Globe, Lock, Trash2, Heart, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MyPaths = () => {
  const navigate = useNavigate();
  const [createdPaths, setCreatedPaths] = useState<any[]>([]);
  const [savedPaths, setSavedPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
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

  // Toggle Public/Private
  const toggleVisibility = async (e: React.MouseEvent, path: any) => {
      e.stopPropagation(); 
      setTogglingId(path.id);
      const newStatus = !path.is_public;

      const { error } = await supabase
          .from('paths')
          .update({ is_public: newStatus })
          .eq('id', path.id);

      if (error) {
          toast.error("Error updating visibility");
      } else {
          setCreatedPaths(prev => prev.map(p => 
              p.id === path.id ? { ...p, is_public: newStatus } : p
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
    <div className="p-6 lg:p-8 space-y-6 pb-20">
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
    </div>
  );
};

export default MyPaths;