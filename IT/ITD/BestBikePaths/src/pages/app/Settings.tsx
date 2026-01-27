import {
  User,
  Bell,
  Shield,
  MapPin,
  Gauge,
  Moon,
  Globe,
  Smartphone,
  Save,
  Bug,
  Cpu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDebugStore } from "@/stores/useDebugStore";

const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const { isDebugMode, debugPathType, toggleDebugMode, setDebugPathType } = useDebugStore();
  
  return (
    <div className="mx-2 lg:mx-4 p-6 lg:p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and app preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="w-5 h-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {/* Verifica esatta della proprietà: Supabase usa spesso 'avatar_url' o 'picture' */}
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={user?.user_metadata?.full_name?.split(" ")[0] || ""} readOnly />            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={user?.user_metadata?.full_name?.split(" ")[1] || ""} readOnly />            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email} />
          </div>
        </CardContent>
      </Card>

      {/* Tracking Preferences */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <MapPin className="w-5 h-5 text-primary" />
            Tracking Preferences
          </CardTitle>
          <CardDescription>
            Configure the behavior of automatic tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pothole Detection</Label>
              <p className="text-sm text-muted-foreground">
                Use accelerometer to detect road issues
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Detection Sensitivity</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit of Measurement</Label>
              <Select defaultValue="metric">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (km, m)</SelectItem>
                  <SelectItem value="imperial">Imperial (mi, ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Moon className="w-5 h-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Shield className="w-5 h-5 text-primary" />
            Privacy and Security
          </CardTitle>
          <CardDescription>
            Manage your data privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Paths by Default</Label>
              <p className="text-sm text-muted-foreground">
                New paths are public by default
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-amber-700 dark:text-amber-500">
            <Bug className="w-5 h-5" />
            Developer Options
          </CardTitle>
          <CardDescription>
            Simulation tools for testing GPS tracking without moving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-amber-900 dark:text-amber-100">Enable Mock Location</Label>
              <p className="text-sm text-muted-foreground">
                Override real GPS with simulated data
              </p>
            </div>
            {/* Switch controllato dallo Store */}
            <Switch 
              checked={isDebugMode} 
              onCheckedChange={toggleDebugMode} 
              className="data-[state=checked]:bg-amber-600"
            />
          </div>

          {/* Mostra le opzioni extra solo se il debug è attivo */}
          {isDebugMode && (
            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                <Separator className="mb-4 bg-amber-500/20" />
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Simulation Type
                    </Label>
                    <Select 
                        value={debugPathType} 
                        onValueChange={(v: any) => setDebugPathType(v)}
                    >
                        <SelectTrigger className="border-amber-200 focus:ring-amber-500">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="fixed">Fixed Path (Deterministic)</SelectItem>
                        <SelectItem value="random">Random Walk (Stochastic)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {debugPathType === 'fixed' 
                        ? "Repeats the exact same route every time." 
                        : "Generates a random path nearby."}
                    </p>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Settings;
