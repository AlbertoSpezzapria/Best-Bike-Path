import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import BikeMap from "@/components/BikeMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calendar, Clock, Route as RouteIcon } from "lucide-react";

const PathDetail = () => {
  const { id } = useParams(); // Prende "1" dall'URL
  const navigate = useNavigate();
  const [pathData, setPathData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPath = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('paths')
        .select('*')
        .eq('id', id)
        .single(); // Prende un solo risultato

      if (error) {
        console.error("Errore fetch:", error);
      } else {
        setPathData(data);
      }
      setLoading(false);
    };

    fetchPath();
  }, [id]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!pathData) return <div className="p-10">Percorso non trovato.</div>;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Header con tasto Indietro */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-display">{pathData.name}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><RouteIcon className="w-3 h-3"/> {pathData.distance} km</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {pathData.duration}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(pathData.created_at).toLocaleDateString()}</span>
            </div>
        </div>
      </div>

      {/* Mappa in sola lettura */}
      <Card className="flex-1 overflow-hidden border-border/50 relative min-h-[400px]">
        <BikeMap 
            mode="view"
            // Se path_data è salvato come JSONB, lo passiamo direttamente
            recordedPath={pathData.path_data || []} 
            initialCenter={pathData.path_data?.[0] || [45.4642, 9.1900]}
        />
      </Card>
      
      <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-1">Descrizione</h3>
          <p className="text-muted-foreground text-sm">{pathData.description || "Nessuna descrizione."}</p>
      </div>
    </div>
  );
};

export default PathDetail;