import {
  Bike,
  Route,
  Clock,
  Calendar,
  ChevronRight,
  Flame,
  MapPin,
  Timer,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Data States
  const [stats, setStats] = useState({
    distance: 0,
    time: "0h 0m",
    calories: 0,
    monthlyDist: 0
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState({ current: 0, target: 50 }); // Target 50km hardcoded for now

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      
      // 1. Fetch All Activities for Stats
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*, path:paths(name)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
        return;
      }

      if (!activities) return;

      // --- CALCULATIONS ---
      let totalMeters = 0;
      let totalSeconds = 0;
      let monthMeters = 0;
      let weekMeters = 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Start of week (Monday)
      const day = now.getDay() || 7; // Get current day number, converting Sun. to 7
      if (day !== 1) now.setHours(-24 * (day - 1)); 
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);

      activities.forEach((act: any) => {
        const dist = act.duration_meters || 0;
        const dur = act.duration_second || 0;
        const date = new Date(act.started_at);

        totalMeters += dist;
        totalSeconds += dur;

        if (date >= startOfMonth) monthMeters += dist;
        if (date >= startOfWeek) weekMeters += dist;
      });

      // Format Time
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);

      const totalKm = totalMeters / 1000;

      setStats({
        distance: parseFloat(totalKm.toFixed(1)),
        time: `${h}h ${m}m`,
        calories: Math.round(totalKm * 30), // Approx 30 kcal/km
        monthlyDist: parseFloat((monthMeters / 1000).toFixed(1))
      });

      setWeeklyProgress({
        current: parseFloat((weekMeters / 1000).toFixed(1)),
        target: 50
      });

      // Recent Trips (Top 5)
      setRecentTrips(activities.slice(0, 3).map((act: any) => ({
        id: act.id,
        name: act.path?.name || act.name,
        date: new Date(act.started_at).toLocaleDateString('it-IT'),
        distance: `${(act.duration_meters / 1000).toFixed(1)} km`,
        duration: formatDuration(act.duration_second),
        avgSpeed: `${act.average_speed ? act.average_speed.toFixed(1) : 0} km/h`,
        pathId: act.path_id
      })));

      setLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  // Helper
  const formatDuration = (sec: number) => {
      if (!sec) return "0m";
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const statCards = [
    {
      label: "Total Distance",
      value: `${stats.distance} km`,
      change: `+${stats.monthlyDist} km`,
      icon: MapPin,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Time",
      value: stats.time,
      change: "Active time",
      icon: Timer,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Calories Burned",
      value: `${stats.calories}`,
      change: "Estimated",
      icon: Flame,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Activity Count",
      value: recentTrips.length.toString(), // Or total count if we used count()
      change: "Total trips",
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="mx-2 lg:mx-4 p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Hi, {user?.user_metadata?.full_name?.split(" ")[0] || "Cyclist"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's a summary of your cycling activities
          </p>
        </div>
        <Button className="w-full lg:w-fit" onClick={() => navigate("/app/record")}>
          <Bike className="w-4 h-4 mr-2" />
          Start New Trip
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {loading ? "..." : stat.value}
                  </p>
                  <p className="text-sm text-primary mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Trips */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Recent Trips</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/my-paths")}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
               <p className="text-muted-foreground text-center py-4">Loading trips...</p>
            ) : recentTrips.length === 0 ? (
               <p className="text-muted-foreground text-center py-4">No recent trips. Go for a ride!</p>
            ) : (
                recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/path/${trip.pathId}`)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {trip.name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {trip.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{trip.distance}</p>
                      <p className="text-sm text-muted-foreground">
                        {trip.duration} • {trip.avgSpeed}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Weekly Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium text-foreground">
                    {weeklyProgress.current} / {weeklyProgress.target} km
                  </span>
                </div>
                <Progress
                  value={Math.min((weeklyProgress.current / weeklyProgress.target) * 100, 100)}
                  className="h-2"
                />
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                {weeklyProgress.current >= weeklyProgress.target 
                    ? "Goal reached! You're amazing! 🎉" 
                    : "Keep it up! You're on track to reach your goals 🎯"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
