import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import {
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Route,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Star,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Loader2
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner"; // Per i messaggi di conferma

// --- CONFIGURAZIONE UI ---
const getStatusConfig = (status: string | null) => {
  const safeStatus = status?.toLowerCase() || 'unknown';
  
  switch (safeStatus) {
    case "optimal":
      return { label: "Ottimale", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle };
    case "good":
      return { label: "Buono", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: CheckCircle };
    case "sufficient":
    case "bad":
      return { label: "Attenzione", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: AlertTriangle };
    case "critical":
      return { label: "Critico", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertTriangle };
    default:
      return { label: "Sconosciuto", color: "bg-muted text-muted-foreground", icon: AlertTriangle };
  }
};

// --- MOCK DATA (Solo per i percorsi "Salvati", feature futura) ---
const savedPaths = [
  {
    id: 999,
    name: "Milano - Pavia Ciclabile",
    from: "Milano Porta Genova",
    to: "Pavia Centro",
    distance: 35.2,
    duration: "2h 10min",
    status: "optimal",
    author: "Marco B.",
    score: 94,
    savedAt: "20 Nov 2024",
  },
];

// --- COMPONENTE PRINCIPALE ---
const MyPaths = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Stato Dati
  const [dbPaths, setDbPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Dati da Supabase
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('paths')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Mappiamo i dati dal DB per la UI
        const formattedData = (data || []).map(p => ({
            ...p,
            // Fallback per i campi UI se mancano nel DB
            from: p.from_loc || "Start Point", 
            to: p.to_loc || "End Point",
            createdAt: new Date(p.created_at).toLocaleDateString()
        }));

        setDbPaths(formattedData);
      } catch (error: any) {
        console.error("Errore caricamento paths:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  // 2. Navigazione
  const handleNewPath = () => {
    navigate("/app/record"); 
  };  
  
  const handleOpenDetail = (id: number) => {
    navigate(`/app/path/${id}`); 
  };

  // 3. Toggle Visibilità (Pubblico/Privato)
  const handleToggleVisibility = async (pathId: number, currentStatus: boolean) => {
    try {
        const newStatus = !currentStatus;
        
        // A. Aggiorna DB
        const { error } = await supabase
            .from('paths')
            .update({ is_public: newStatus })
            .eq('id', pathId);

        if (error) throw error;

        // B. Aggiorna Stato Locale (UI immediata)
        setDbPaths(prev => prev.map(p => 
            p.id === pathId ? { ...p, is_public: newStatus } : p
        ));

        toast.success(`Path is now ${newStatus ? 'Public' : 'Private'}`);

    } catch (error: any) {
        toast.error("Failed to update visibility");
        console.error(error);
    }
  };

  // 4. Eliminazione
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Evita di aprire il dettaglio
    if(!confirm("Are you sure you want to delete this path?")) return;

    const { error } = await supabase.from('paths').delete().eq('id', id);
    if (!error) {
        setDbPaths(prev => prev.filter(p => p.id !== id));
        toast.success("Path deleted");
    } else {
        toast.error("Error deleting path");
    }
  };

  // Filtro ricerca
  const filteredPaths = dbPaths.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-2 lg:mx-4 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Paths</h1>
          <p className="text-muted-foreground mt-1">Manage your created and saved paths</p>
        </div>
        <Button className="w-fit" onClick={handleNewPath}>
          <Plus className="w-4 h-4 mr-2" />
          New Path
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search in your paths..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="created" className="space-y-6">
        <TabsList>
          <TabsTrigger value="created" className="gap-2">
            <MapPin className="w-4 h-4" />
            Created by Me ({dbPaths.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Star className="w-4 h-4" />
            Saved ({savedPaths.length})
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: CREATED (Dal DB) --- */}
        <TabsContent value="created" className="space-y-4">
          {loading ? (
             <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                
                {/* Card "Add New" (Sempre visibile come prima opzione) */}
                <Card 
                    className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors cursor-pointer min-h-[220px]"
                    onClick={handleNewPath}
                >
                <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium">Create New</p>
                </CardContent>
                </Card>

                {/* Lista Percorsi dal DB */}
                {filteredPaths.map((path) => {
                const statusConfig = getStatusConfig(path.status);
                const StatusIcon = statusConfig.icon;

                return (
                    <Card
                        key={path.id}
                        className="border-border/50 hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
                        onClick={() => handleOpenDetail(path.id)}
                    >
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                        <div className="space-y-1 overflow-hidden">
                            <CardTitle className="text-lg font-display group-hover:text-primary transition-colors truncate">
                                {path.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground truncate">
                                {path.from} → {path.to}
                            </p>
                        </div>
                        
                        {/* Stop Propagation per non attivare il click della card */}
                        <div onClick={(e) => e.stopPropagation()}> 
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/app/record?edit=${path.id}`)}>
                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    
                                    {/* NUOVO: Toggle Visibilità */}
                                    <DropdownMenuItem onClick={() => handleToggleVisibility(path.id, path.is_public)}>
                                        {path.is_public ? (
                                            <>
                                                <EyeOff className="w-4 h-4 mr-2" /> Make Private
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" /> Make Public
                                            </>
                                        )}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(e, path.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Route className="w-4 h-4" />
                                {path.distance} km
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {path.duration}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className={statusConfig.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                            </Badge>
                            <Badge variant={path.is_public ? "default" : "secondary"}>
                                {path.is_public ? (
                                    <><Eye className="w-3 h-3 mr-1" /> Public</>
                                ) : (
                                    <><EyeOff className="w-3 h-3 mr-1" /> Private</>
                                )}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border mt-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {path.createdAt}
                            </span>
                        </div>
                    </CardContent>
                    </Card>
                );
                })}
            </div>
          )}
        </TabsContent>

        {/* --- TAB: SAVED (Statici per ora) --- */}
        <TabsContent value="saved" className="space-y-4">
             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {savedPaths.map((path) => (
                    <Card key={path.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer">
                         <CardHeader className="pb-2">
                             <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-display">{path.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{path.from} → {path.to}</p>
                                </div>
                                <div className="flex items-center gap-1 text-primary font-bold">
                                    <Star className="w-4 h-4 fill-primary" /> {path.score}
                                </div>
                             </div>
                         </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground"><Route className="w-4 h-4" />{path.distance} km</span>
                                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" />{path.duration}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <span className="text-sm text-muted-foreground">By {path.author}</span>
                            </div>
                         </CardContent>
                    </Card>
                ))}
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyPaths;