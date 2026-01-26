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

const Settings = () => {
  const user = useAuthStore((state) => state.user);
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
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User"
                  className="w-20 h-20 rounded-full"
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
              <Input value={user?.user_metadata?.full_name.split(" ")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={user?.user_metadata?.full_name.split(" ")[1]} />
            </div>
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
    </div>
  );
};

export default Settings;
