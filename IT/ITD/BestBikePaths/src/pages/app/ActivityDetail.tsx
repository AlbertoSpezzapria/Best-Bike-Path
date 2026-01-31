import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import BikeMap from "@/components/BikeMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Clock, Zap, MapPin, CloudSun, AlertTriangle, 
  Wind, Droplets, Activity, Gauge, CheckCircle2, ThumbsUp, AlertCircle, ThumbsDown,
  CheckCircle // Importata per lo stato "Zero Ostacoli"
} from "lucide-react";

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, paths(name)')
        .eq('id', id)
        .single();

      if (error) console.error("Error fetching activity:", error);
      else setActivity(data);
      setLoading(false);
    };
    fetchActivity();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin text-primary text-2xl">⏳</div></div>;
  if (!activity) return <div className="p-10 text-center">Activity not found.</div>;

  // Helpers Data
  const dateObj = new Date(activity.started_at);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Normalizza gli ostacoli
  const detectedHazards = activity.obstacles_detected || activity.hazards || [];
  const hasHazards = detectedHazards.length > 0;

  // Helper per colori/icone Status
  const getStatusConfig = (status: string) => {
    switch(status) {
        case 'optimal': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Optimal' };
        case 'good': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ThumbsUp, label: 'Good' };
        case 'fair': return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle, label: 'Fair/Bumpy' };
        case 'bad': return { color: 'bg-red-100 text-red-700 border-red-200', icon: ThumbsDown, label: 'Bad/Gravel' };
        default: return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Gauge, label: 'Unknown' };
    }
  };

  // Helper per colori Difficoltà
  const getDifficultyColor = (diff: string) => {
    switch(diff) {
        case 'easy': return 'bg-green-100 text-green-800 border-green-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'expert': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const statusConfig = getStatusConfig(activity.status);
  const diffColor = getDifficultyColor(activity.difficulty);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit pl-0 hover:pl-2 text-muted-foreground -ml-2 mb-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to list
        </Button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground uppercase tracking-tight">
                Ride of {dateStr} at {timeStr}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Path: <span className="font-semibold text-foreground">{activity.paths?.name || "Unlinked Path"}</span>
            </p>
            </div>
            
            {/* Quick Badges for Mobile */}
            <div className="flex gap-2 md:hidden">
                <Badge variant="outline" className={`capitalize ${diffColor}`}>{activity.difficulty || 'Medium'}</Badge>
                <Badge variant="outline" className={`capitalize ${statusConfig.color}`}>{activity.status || 'Good'}</Badge>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* COLONNA SINISTRA: Mappa e Ostacoli */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* MAPPA */}
          <Card className="overflow-hidden border-border/50 relative h-[450px] shadow-md bg-muted/20">
            <BikeMap 
                mode="view" 
                recordedPath={activity.raw_data || []} 
                initialCenter={activity.raw_data?.[0] || [45.4642, 9.1900]} 
                hazards={detectedHazards} 
            />
          </Card>

          {/* CARD OSTACOLI (DINAMICA) */}
          <Card className={`shadow-sm transition-colors ${
              hasHazards 
                ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" 
                : "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10"
          }`}>
            <CardHeader className={`pb-2 border-b ${hasHazards ? "border-amber-100 dark:border-amber-900/50" : "border-emerald-100 dark:border-emerald-900/50"}`}>
              <CardTitle className={`text-base flex items-center gap-2 ${hasHazards ? "text-amber-700 dark:text-amber-500" : "text-emerald-700 dark:text-emerald-500"}`}>
                {hasHazards ? (
                   <><AlertTriangle className="w-5 h-5" /> Hazards Detected ({detectedHazards.length})</>
                ) : (
                   <><CheckCircle className="w-5 h-5" /> Track Safety Report</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {hasHazards ? (
                // CASO 1: Ci sono ostacoli
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detectedHazards.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-background/80 backdrop-blur p-3 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 flex items-center justify-center shrink-0">
                           <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{h.type}</p>
                          <p className="text-xs text-muted-foreground">Lat: {h.location[0].toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // CASO 2: Nessun ostacolo rilevato
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-full mb-3">
                        <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Smooth Ride!</h3>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 max-w-xs mt-1">
                        No significant hazards were detected during this activity. The path appears to be clear.
                    </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLONNA DESTRA: Stats, Meteo & Info */}
        <div className="space-y-6">
          
          {/* RIDE EXPERIENCE */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
               <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Ride Experience
               </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
                {/* Difficulty Box */}
                <div className={`p-3 rounded-xl border ${diffColor} flex flex-col items-center justify-center text-center gap-1`}>
                    <Activity className="w-5 h-5 mb-1 opacity-80" />
                    <span className="text-[10px] uppercase font-bold opacity-70">Difficulty</span>
                    <span className="text-lg font-bold capitalize">{activity.difficulty || 'Medium'}</span>
                </div>

                {/* Status Box */}
                <div className={`p-3 rounded-xl border ${statusConfig.color} flex flex-col items-center justify-center text-center gap-1`}>
                    <statusConfig.icon className="w-5 h-5 mb-1 opacity-80" />
                    <span className="text-[10px] uppercase font-bold opacity-70">Condition</span>
                    <span className="text-lg font-bold capitalize">{statusConfig.label}</span>
                </div>
            </CardContent>
          </Card>

          {/* CARD METEO */}
          <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-border shadow-sm">
            <CardHeader className="pb-2 border-b border-border/50">
               <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                 <CloudSun className="w-4 h-4" /> Weather Conditions
               </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {activity.weather_data ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-4xl font-bold">{activity.weather_data.temp}°</span>
                        <span className="text-sm text-muted-foreground font-medium capitalize mt-1">
                          {activity.weather_data.condition || "Unknown"}
                        </span>
                     </div>
                     <CloudSun className="w-14 h-14 text-primary/80" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                     <div className="bg-muted/40 p-3 rounded-xl flex flex-col gap-1 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
                            <Wind className="w-3 h-3 text-blue-500" /> Wind
                        </div>
                        <p className="text-lg font-semibold">{activity.weather_data.wind || 0} <span className="text-xs font-normal">km/h</span></p>
                     </div>
                     <div className="bg-muted/40 p-3 rounded-xl flex flex-col gap-1 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
                            <Droplets className="w-3 h-3 text-cyan-500" /> Humidity
                        </div>
                        <p className="text-lg font-semibold">{activity.weather_data.humidity || 0}%</p>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CloudSun className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No weather data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD STATISTICHE */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><Clock className="w-4 h-4" /></div>
                    <span className="text-sm font-medium">Duration</span>
                 </div>
                 <span className="text-lg font-bold font-mono">
                    {Math.floor(activity.duration_second / 60)}<span className="text-xs font-normal text-muted-foreground">m</span> {activity.duration_second % 60}<span className="text-xs font-normal text-muted-foreground">s</span>
                 </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><MapPin className="w-4 h-4" /></div>
                    <span className="text-sm font-medium">Distance</span>
                 </div>
                 <span className="text-lg font-bold font-mono">
                    {(activity.duration_meters / 1000).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">km</span>
                 </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><Zap className="w-4 h-4" /></div>
                    <span className="text-sm font-medium">Avg Speed</span>
                 </div>
                 <span className="text-lg font-bold font-mono text-primary">
                    {activity.average_speed ? activity.average_speed.toFixed(1) : '-'} <span className="text-xs font-normal text-muted-foreground">km/h</span>
                 </span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;