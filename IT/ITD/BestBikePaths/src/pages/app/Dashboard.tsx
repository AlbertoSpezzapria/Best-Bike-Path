import {
  Bike,
  Route,
  Clock,
  Flame,
  TrendingUp,
  Calendar,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    label: "Total Distance",
    value: "1,248",
    change: "+12%",
    icon: Route,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Completed Trips",
    value: "86",
    change: "+5",
    icon: Bike,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Hours in Saddle",
    value: "142",
    change: "+8h",
    icon: Clock,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    label: "Calories Burned",
    value: "32,450",
    change: "+1,200",
    icon: Flame,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

const recentTrips = [
  {
    id: 1,
    name: "Milano Centro - Navigli",
    date: "Today, 08:30",
    distance: "12.4 km",
    duration: "42 min",
    avgSpeed: "17.7 km/h",
  },
  {
    id: 2,
    name: "Parco Sempione Loop",
    date: "Yesterday, 17:00",
    distance: "8.2 km",
    duration: "28 min",
    avgSpeed: "17.5 km/h",
  },
  {
    id: 3,
    name: "Milano - Monza",
    date: "3 days ago",
    distance: "24.6 km",
    duration: "1h 15min",
    avgSpeed: "19.6 km/h",
  },
];

const weeklyGoals = [
  { label: "Weekly Distance", current: 45, target: 100, unit: "km" },
  { label: "Weekly Trips", current: 4, target: 5, unit: "trips" },
  { label: "Time in Saddle", current: 3.5, target: 5, unit: "hours" },
];

const Dashboard = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Hi, Mario! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's a summary of your cycling activities
          </p>
        </div>
        <Button className="w-fit">
          <Bike className="w-4 h-4 mr-2" />
          Start New Trip
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-primary mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} this month
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
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
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
            ))}
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Weekly Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {weeklyGoals.map((goal) => (
              <div key={goal.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{goal.label}</span>
                  <span className="font-medium text-foreground">
                    {goal.current} / {goal.target} {goal.unit}
                  </span>
                </div>
                <Progress
                  value={(goal.current / goal.target) * 100}
                  className="h-2"
                />
              </div>
            ))}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Keep it up! You're on track to reach your goals
                🎯
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
