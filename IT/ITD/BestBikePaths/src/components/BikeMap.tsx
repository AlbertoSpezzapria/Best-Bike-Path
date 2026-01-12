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
import { Search, Undo2, Crosshair, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- CONFIGURAZIONE ICONE ---
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const HazardIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
         </div>`,
  className: "bg-transparent",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// --- TIPI ---
export interface Hazard {
  id: string;
  location: [number, number];
  type: "pothole" | "obstacle" | "other";
}

interface BikeMapProps {
  mode: "view" | "edit";
  initialCenter?: [number, number];
  recordedPath?: [number, number][];
  onPathChange?: (path: [number, number][], distance: number, hazards: Hazard[]) => void;
}

// --- HELPER FUNZIONI ---
// Trova il punto più vicino sulla polilinea rispetto al click (Logica semplificata per prototipo)
const findNearestPointOnLine = (clickLatLng: L.LatLng, polylinePoints: [number, number][]) => {
  let minDistance = Infinity;
  let nearestPoint = null;

  polylinePoints.forEach(pt => {
    const pointLatLng = L.latLng(pt[0], pt[1]);
    const dist = clickLatLng.distanceTo(pointLatLng); // Distanza in metri
    if (dist < minDistance) {
      minDistance = dist;
      nearestPoint = pt;
    }
  });

  // Accettiamo il punto solo se è entro 50 metri dalla linea (per evitare click sbagliati)
  return minDistance < 50 ? nearestPoint : null;
};

// --- SOTTO-COMPONENTI INTERNI ---

// Controller per muovere la mappa (FlyTo)
const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15);
  }, [center, map]);
  return null;
};

// Gestore Click
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
      if (editorMode === "route") {
        onAddWaypoint(e.latlng);
      } else {
        onAddHazard(e.latlng);
      }
    },
  });
  return null;
};

// --- COMPONENTE PRINCIPALE ---
const BikeMap = ({ mode, initialCenter = [45.4642, 9.1900], recordedPath = [], onPathChange }: BikeMapProps) => {
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  // STATO EDITOR
  const [waypoints, setWaypoints] = useState<L.LatLng[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [editorMode, setEditorMode] = useState<"route" | "hazard">("route");
  
  // STATO SEARCH
const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean Orphaned Hazards ***
  // Questa funzione controlla se gli ostacoli sono ancora validi rispetto alla nuova geometria
  const validateHazardsAgainstRoute = (newRoute: [number, number][], currentHazards: Hazard[]) => {
    if (newRoute.length === 0) return []; // Se non c'è percorso, via tutti gli ostacoli
    
    return currentHazards.filter(h => {
        const hazardLatLng = L.latLng(h.location[0], h.location[1]);
        // Controlliamo se l'ostacolo è ancora "vicino" (snapped) a qualche punto del nuovo percorso
        const point = findNearestPointOnLine(hazardLatLng, newRoute);
        return point !== null; // Se torna null, vuol dire che è > 50m dalla linea
    });
  };

  // Calcolo Rotta (OSRM)
  const fetchRoute = async (points: L.LatLng[]) => {
    if (points.length < 2) return;
    const coordsString = points.map(p => `${p.lng},${p.lat}`).join(";");
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][];
        setRouteGeometry(coords);
        onPathChange?.(coords, data.routes[0].distance, hazards);
      }
    } catch (e) { console.error(e); }
  };

  // Autocomplete Search with Debounce ***
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
    }, 300); // 300ms di attesa

    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  const selectSuggestion = (item: any) => {
      setMapCenter([parseFloat(item.lat), parseFloat(item.lon)]);
      setIsSearchOpen(false);
      setSearchQuery("");
      setSuggestions([]);
  };

  // Geolocalizzazione Browser
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  // Aggiunta Punto Percorso
  const handleAddWaypoint = (latlng: L.LatLng) => {
    const newWaypoints = [...waypoints, latlng];
    setWaypoints(newWaypoints);
    if (newWaypoints.length > 1) fetchRoute(newWaypoints);
    else {
        setRouteGeometry([]);
        setHazards([]); // Niente percorso, niente hazard
    }
  };

  // Undo Ultimo Punto
  const handleUndo = () => {
    if (waypoints.length === 0) return;
    const newWaypoints = waypoints.slice(0, -1);
    setWaypoints(newWaypoints);
    
    if (newWaypoints.length > 1) {
        fetchRoute(newWaypoints); 
    } else {
      setRouteGeometry([]);
      setHazards([]); 
    }
  };

  const handleAddHazard = (latlng: L.LatLng) => {
    if (routeGeometry.length === 0) return alert("Add waypoints to create a route first.");
    const snappedPoint = findNearestPointOnLine(latlng, routeGeometry);
    if (snappedPoint) {
      const newHazards = [...hazards, { id: Date.now().toString(), location: snappedPoint, type: "pothole" as const }];
      setHazards(newHazards);
      onPathChange?.(routeGeometry, 0, newHazards);
    } else {
      alert("Too far from the route. Please click closer to the blue line.");
    }
  };

  return (
    <div className="relative w-full h-full group overflow-hidden rounded-md">
      
      {/* *** FIX UI: Collapsible Search Bar *** */}
      <div className={`absolute top-4 left-4 z-[1000] flex flex-col gap-2 transition-all duration-300 ${isSearchOpen ? "w-[80%] max-w-sm" : "w-auto"}`}>
        <div className="flex gap-2">
            {!isSearchOpen && (
                <Button 
                    size="icon" 
                    className="bg-white text-foreground hover:bg-white/90 shadow-md rounded-full w-10 h-10"
                    onClick={() => setIsSearchOpen(true)}
                >
                    <Search className="w-5 h-5" />
                </Button>
            )}

            {isSearchOpen && (
                <div className="flex-1 relative animate-in fade-in slide-in-from-left-5 duration-200">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search location..." 
                            className="bg-white shadow-md pl-9 pr-10 h-10 rounded-full border-none"
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

                    {/* Suggestions Dropdown */}
                    {(suggestions.length > 0 || isLoadingSuggestions) && (
                        <Card className="absolute top-12 left-0 w-full bg-white shadow-xl mt-1 overflow-hidden z-[1001]">
                            {isLoadingSuggestions ? (
                                <div className="p-4 flex justify-center"><Loader2 className="animate-spin w-4 h-4 text-primary" /></div>
                            ) : (
                                <ScrollArea className="max-h-[200px]">
                                    {suggestions.map((item: any, idx) => (
                                        <div 
                                            key={idx} 
                                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm truncate border-b last:border-0"
                                            onClick={() => selectSuggestion(item)}
                                        >
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

      {/* Toolbar Azioni (Resta uguale, ma assicuriamoci che non sia coperta) */}
      {mode === "edit" && (
        <Card className="absolute bottom-6 right-4 z-[1000] p-2 flex flex-col gap-2 shadow-xl bg-white/90 backdrop-blur rounded-full">
            <Button size="icon" variant="outline" className="rounded-full" onClick={() => navigator.geolocation.getCurrentPosition(p => setMapCenter([p.coords.latitude, p.coords.longitude]))}>
               <Crosshair className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full" onClick={handleUndo} disabled={waypoints.length === 0}>
               <Undo2 className="w-4 h-4" />
            </Button>
            <div className="w-full h-px bg-border my-1" />
            <ToggleGroup type="single" value={editorMode} onValueChange={(v) => v && setEditorMode(v as any)} className="flex flex-col gap-1">
                <ToggleGroupItem value="route" size="sm" className="rounded-full data-[state=on]:bg-primary data-[state=on]:text-white">
                    <CheckCircle2 className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="hazard" size="sm" className="rounded-full data-[state=on]:bg-destructive data-[state=on]:text-white">
                    <AlertTriangle className="w-4 h-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </Card>
      )}

      {/* MAPPA */}
      <MapContainer 
        center={initialCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        zoomControl={false} // Nascondiamo quello di default per spostarlo se necessario, o lasciamo false perché coperto
        className="w-full h-full z-0"
      >
        <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Usiamo i controlli zoom in basso a sinistra per non confliggere con la search bar */}
        {/* Nota: React-Leaflet non espone facile ZoomControl position nelle nuove versioni, 
            ma la search bar a scomparsa risolve il problema dello spazio. */}
        
        <MapController center={mapCenter} />
        <MapInteractionHandler mode={mode} editorMode={editorMode} onAddWaypoint={handleAddWaypoint} onAddHazard={handleAddHazard} />

        {mode === "edit" && (
            <>
                {waypoints.map((pos, idx) => <Marker key={`wp-${idx}`} position={pos} opacity={0.6} />)}
                {routeGeometry.length > 0 && <Polyline positions={routeGeometry} color="#2563eb" weight={5} opacity={0.8} />}
                {hazards.map((h) => (
                    <Marker key={h.id} position={h.location} icon={HazardIcon}>
                         <Popup>⚠️ Pothole</Popup>
                    </Marker>
                ))}
            </>
        )}
        {mode === "view" && recordedPath.length > 0 && <Polyline positions={recordedPath} color="red" weight={4} />}
      </MapContainer>
    </div>
  );
};

export default BikeMap;