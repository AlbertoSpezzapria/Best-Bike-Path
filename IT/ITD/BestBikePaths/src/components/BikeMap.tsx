import { useState, useEffect, useRef } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Polyline, 
  useMapEvents, 
  useMap, 
  Popup 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

import { Search, Undo2, Crosshair, AlertTriangle, CheckCircle2, Loader2, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// --- 1. CONFIGURAZIONE ICONE ---

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const HazardIcon = L.divIcon({
  html: `<div style="
    background-color: #ef4444; 
    width: 28px; height: 28px; 
    border-radius: 50%; 
    display: flex; align-items: center; justify-content: center; 
    border: 2px solid white; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
  </div>`,
  className: "bg-transparent marker-hazard-icon", // Class custom per evitare conflitti
  iconSize: [28, 28],
  iconAnchor: [14, 28], // Punta in basso al centro
  popupAnchor: [0, -28],
});

// Pulsing Blue Dot (Current Location)
const CurrentLocationIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-sm"></span>
         </div>`,
  className: "bg-transparent",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// --- 2. TIPI ---
export interface Hazard {
  id?: string; // Opzionale perché quelli nuovi non hanno ID DB
  location: [number, number];
  type: string;
  confidence?: number;
}

interface BikeMapProps {
  mode: "view" | "edit" | "record"; // Aggiunto 'record' per completezza
  initialCenter?: [number, number];
  recordedPath?: [number, number][]; 
  currentLocation?: [number, number] | null; 
  autoCenter?: boolean; 
  hazards?: Hazard[]; // Ostacoli passati dall'esterno (DB)
  onPathChange?: (path: [number, number][], distance: number, hazards: Hazard[]) => void;
}

// --- 3. HELPER LOGIC ---

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

// Trova il punto più vicino sulla linea (Snapping)
const findNearestPointOnLine = (clickLatLng: L.LatLng, polylinePoints: [number, number][]) => {
  let minDistance = Infinity;
  let nearestPoint: [number, number] | null = null;

  polylinePoints.forEach(pt => {
    const pointLatLng = L.latLng(pt[0], pt[1]);
    const dist = clickLatLng.distanceTo(pointLatLng); // Distanza in metri
    if (dist < minDistance) {
      minDistance = dist;
      nearestPoint = pt;
    }
  });

  // Accetta solo se entro 50 metri dalla linea
  return minDistance < 50 ? nearestPoint : null;
};

// Calcolo Distanza Totale (in metri)
const calculateTotalDistance = (coords: [number, number][]) => {
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        total += L.latLng(coords[i]).distanceTo(L.latLng(coords[i+1]));
    }
    return total;
};

// --- 4. SOTTO-COMPONENTI INTERNI ---

// Gestisce il movimento della mappa (FlyTo)
const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { animate: true });
  }, [center, map]);
  return null;
};

// Gestisce l'Auto-Center durante il tracking
const AutoCenterMap = ({ center, enabled }: { center: [number, number] | null, enabled: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (center && enabled) {
      map.panTo(center, { animate: true, duration: 0.5 }); 
    }
  }, [center, enabled, map]);
  return null;
};

// Gestisce i Click sulla Mappa (Solo Edit Mode)
const MapInteractionHandler = ({ 
  mode, 
  editorMode, 
  onAddWaypoint, 
  onAddHazard 
}: { 
  mode: string; 
  editorMode: "route" | "hazard";
  onAddWaypoint: (latlng: L.LatLng) => void;
  onAddHazard: (latlng: L.LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      if (mode !== "edit") return;
      
      // Evita click se stiamo cliccando su un marker esistente
      // (Leaflet gestisce la propagazione, ma per sicurezza qui controlliamo il target se necessario)
      
      if (editorMode === "route") {
        onAddWaypoint(e.latlng);
      } else {
        onAddHazard(e.latlng);
      }
    },
  });
  return null;
};

// --- 5. COMPONENTE PRINCIPALE ---
const BikeMap = ({ 
  mode,
  initialCenter, 
  recordedPath = [],
  currentLocation,
  autoCenter = false, 
  hazards: propHazards = [], // Rinominiamo per chiarezza: propHazards vs stateHazards
  onPathChange 
}: BikeMapProps) => {
  
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  // STATO EDITOR (Solo per mode="edit")
  const [waypoints, setWaypoints] = useState<L.LatLng[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]); // La linea blu calcolata
  const [localHazards, setLocalHazards] = useState<Hazard[]>([]); // Ostacoli aggiunti manualmente
  const [editorMode, setEditorMode] = useState<"route" | "hazard">("route");
  
  // STATO RICERCA
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFFETTI ---

  // 1. Sincronizzazione Props -> Stato (Quando si apre un percorso esistente in view)
  useEffect(() => {
    if (mode === "view" || mode === "record") {
       // In view mode, usiamo direttamente le props per il rendering, 
       // non serve settare lo stato locale complesso dell'editor.
    } else if (mode === "edit" && recordedPath.length > 0 && routeGeometry.length === 0) {
       // Se entriamo in edit mode con un percorso precaricato (caso raro ma possibile)
       setRouteGeometry(recordedPath);
       setLocalHazards(propHazards);
    }
  }, [mode, recordedPath, propHazards]);

  // --- LOGICA EDITOR (OSRM) ---
  const fetchRoute = async (points: L.LatLng[]) => {
    if (points.length < 2) return;
    const coordsString = points.map(p => `${p.lng},${p.lat}`).join(";");
    try {
      // Usa OSRM Bike Profile se possibile, altrimenti driving
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
      const data = await response.json();
      
      if (data.routes?.[0]) {
        // OSRM restituisce [lng, lat], Leaflet vuole [lat, lng]
        const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][];
        const dist = data.routes[0].distance;
        
        setRouteGeometry(coords);
        
        // Notifica il genitore
        onPathChange?.(coords, dist, localHazards);
      }
    } catch (e) { 
        console.error("OSRM Error:", e);
        toast.error("Could not calculate route path");
    }
  };

  // --- LOGICA RICERCA ---
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!searchQuery || searchQuery.length < 3) {
        setSuggestions([]);
        return;
    }

    debounceTimerRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
            const data = await res.json();
            setSuggestions(data);
        } catch (e) { console.error(e); }
        setIsLoadingSuggestions(false);
    }, 400);

    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  const selectSuggestion = (item: any) => {
      setMapCenter([parseFloat(item.lat), parseFloat(item.lon)]);
      setIsSearchOpen(false);
      setSearchQuery("");
      setSuggestions([]);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      }, () => toast.error("Position unavailable"));
    }
  };

  // --- HANDLERS AZIONI ---
  
  const handleAddWaypoint = (latlng: L.LatLng) => {
    const newWaypoints = [...waypoints, latlng];
    setWaypoints(newWaypoints);
    
    // Se è il primo punto, non calcoliamo la rotta ma aggiorniamo la UI
    if (newWaypoints.length === 1) {
        setRouteGeometry([]);
        toast.info("Start point set. Click again to draw route.");
    } else {
        fetchRoute(newWaypoints);
    }
  };

const handleUndo = () => {
    if (waypoints.length === 0) return;

    const removedWaypoint = waypoints[waypoints.length - 1];
    const newWaypoints = waypoints.slice(0, -1);
    
    setLocalHazards((prevHazards) => {
      return prevHazards.filter((hazard) => {
        const dist = getDistanceFromLatLonInKm(
          hazard.location[0],
          hazard.location[1],
          removedWaypoint[0],
          removedWaypoint[1]
        );
        return dist > 0.015; 
      });
    });

    setWaypoints(newWaypoints);

    if (newWaypoints.length > 1) {
      fetchRoute(newWaypoints); 
    } else if (newWaypoints.length === 1) {
      setRouteGeometry([]);
      onPathChange?.([], 0, []); 
    } else {
      setRouteGeometry([]);
      setLocalHazards([]); 
      onPathChange?.([], 0, []);
    }
  };

  const handleAddHazard = (latlng: L.LatLng) => {
    if (routeGeometry.length === 0) {
        toast.error("Please draw a path first!");
        return;
    }
    
    // Snapping
    const snappedPoint = findNearestPointOnLine(latlng, routeGeometry);
    
    if (snappedPoint) {
      const newHazard: Hazard = { 
          id: Date.now().toString(), 
          location: snappedPoint, 
          type: "other" // Default type, could be enhanced with a selector dialog
      };
      const newHazards = [...localHazards, newHazard];
      
      setLocalHazards(newHazards);
      // Aggiorniamo il genitore con i nuovi dati
      const dist = calculateTotalDistance(routeGeometry);
      onPathChange?.(routeGeometry, dist, newHazards);
      
      toast.success("Hazard added to path");
    } else {
      toast.warning("Click closer to the blue path line.");
    }
  };

  // --- VARIABILI DI RENDERING ---
  // Determina cosa mostrare in base alla modalità
  const displayPath = mode === "edit" ? routeGeometry : recordedPath;
  const displayHazards = mode === "edit" ? localHazards : propHazards;
  
  // Normalizzazione sicura degli ostacoli (per evitare crash se DB restituisce null)
  const safeHazards = Array.isArray(displayHazards) ? displayHazards : (displayHazards ? [displayHazards] : []);

  // Centro Mappa: Priorità -> Posizione Corrente -> Ricerca -> Centro Iniziale -> Default Milano
  const centerToUse: [number, number] = 
    currentLocation && autoCenter ? [currentLocation[0], currentLocation[1]] :
    (initialCenter || [45.4642, 9.1900]);

  return (
    <div className="relative w-full h-full group overflow-hidden rounded-xl border border-border/50 bg-muted/20">
      
      {/* 1. BARRA DI RICERCA (Top Left) */}
      <div className={`absolute top-4 left-4 z-[1000] flex flex-col gap-2 transition-all duration-300 ${isSearchOpen ? "w-[85%] sm:w-[320px]" : "w-auto"}`}>
        <div className="flex gap-2">
            {!isSearchOpen && (
                <Button 
                    size="icon" 
                    className="bg-background/95 backdrop-blur text-foreground border shadow-sm hover:bg-muted rounded-full w-10 h-10"
                    onClick={() => setIsSearchOpen(true)}
                    title="Search Location"
                >
                    <Search className="w-5 h-5" />
                </Button>
            )}

            {isSearchOpen && (
                <div className="flex-1 relative animate-in fade-in slide-in-from-left-5 duration-200">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search place..." 
                            className="bg-background/95 backdrop-blur shadow-lg pl-9 pr-10 h-10 rounded-full border-border/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <Button 
                            size="icon" variant="ghost" 
                            className="absolute right-1 top-1 h-8 w-8 rounded-full hover:bg-muted"
                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Lista suggerimenti */}
                    {(suggestions.length > 0 || isLoadingSuggestions) && (
                        <Card className="absolute top-12 left-0 w-full bg-background/95 backdrop-blur shadow-xl mt-1 overflow-hidden z-[1001] border-border/50">
                            {isLoadingSuggestions ? (
                                <div className="p-4 flex justify-center"><Loader2 className="animate-spin w-4 h-4 text-primary" /></div>
                            ) : (
                                <ScrollArea className="max-h-[200px]">
                                    {suggestions.map((item: any, idx) => (
                                        <div 
                                            key={idx} 
                                            className="px-4 py-3 hover:bg-muted/50 cursor-pointer text-sm truncate border-b border-border/50 last:border-0 flex items-center gap-2"
                                            onClick={() => selectSuggestion(item)}
                                        >
                                            <MapPin className="w-3 h-3 opacity-50 shrink-0" />
                                            {item.display_name}
                                        </div>
                                    ))}
                                </ScrollArea>
                            )}
                        </Card>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* 2. TOOLBAR EDITOR (Bottom Right - Solo Edit Mode) */}
      {mode === "edit" && (
        <Card className="absolute bottom-6 right-4 z-[1000] p-1.5 flex flex-col gap-2 shadow-xl bg-background/95 backdrop-blur border-border/50 rounded-full">
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-muted" onClick={handleLocateMe} title="My Location">
               <Crosshair className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-muted" onClick={handleUndo} disabled={waypoints.length === 0} title="Undo Last Point">
               <Undo2 className="w-4 h-4" />
            </Button>
            <div className="w-full h-px bg-border my-1" />
            <ToggleGroup type="single" value={editorMode} onValueChange={(v) => v && setEditorMode(v as any)} className="flex flex-col gap-1">
                <ToggleGroupItem value="route" size="sm" className="rounded-full h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground" title="Draw Route">
                    <CheckCircle2 className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="hazard" size="sm" className="rounded-full h-8 w-8 data-[state=on]:bg-red-500 data-[state=on]:text-white" title="Add Hazard">
                    <AlertTriangle className="w-4 h-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </Card>
      )}

      {/* 3. MAPPA LEAFLET */}
      <MapContainer 
        center={centerToUse} 
        zoom={14} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer 
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        {/* Componenti di controllo invisibili */}
        <MapController center={mapCenter} />
        {currentLocation && <AutoCenterMap center={[currentLocation[0], currentLocation[1]]} enabled={autoCenter} />}
        
        {/* Gestore Click (attivo solo in mode='edit') */}
        <MapInteractionHandler 
            mode={mode} 
            editorMode={editorMode} 
            onAddWaypoint={handleAddWaypoint} 
            onAddHazard={handleAddHazard} 
        />

        {/* --- RENDER PERCORSO --- */}
        {displayPath && displayPath.length > 0 && (
            <Polyline 
                positions={displayPath} 
                // Blu in Edit, Verde/Rosso custom in View
                color={mode === "edit" ? "#3b82f6" : "#1E967D"} 
                weight={5}
                opacity={0.9}
            />
        )}

        {/* --- RENDER OSTACOLI --- */}
        {safeHazards.map((h, idx) => {
            if (!h.location || h.location.length < 2) return null;
            return (
                <Marker 
                    key={`hazard-${idx}-${h.location[0]}`} 
                    position={h.location} 
                    icon={HazardIcon}
                >
                    <Popup>
                        <div className="flex flex-col gap-1">
                            <span className="font-bold flex items-center gap-2 text-red-600 uppercase text-xs">
                                <AlertTriangle className="w-3 h-3" /> Hazard
                            </span>
                            <span className="text-sm font-medium capitalize">{h.type || "Obstacle"}</span>
                            {h.confidence && <span className="text-[10px] text-muted-foreground">Confidence: {Math.round(h.confidence * 100)}%</span>}
                        </div>
                    </Popup>
                </Marker>
            );
        })}

        {/* --- RENDER PUNTI INTERMEDI (Solo Edit) --- */}
        {mode === "edit" && waypoints.map((pos, idx) => (
            <Marker key={`wp-${idx}`} position={pos} opacity={0.5} />
        ))}

        {/* --- RENDER POSIZIONE CORRENTE --- */}
        {currentLocation && (mode === "view" || mode === "record") && (
            <Marker position={currentLocation} icon={CurrentLocationIcon} zIndexOffset={1000}>
                 <Popup>You are here</Popup>
            </Marker>
        )}

      </MapContainer>
    </div>
  );
};

export default BikeMap;