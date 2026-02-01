import { User, Bug, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  // Get authenticated user from global auth store
  const user = useAuthStore((state) => state.user);

  // Get debug configuration and actions from debug store
  const { isDebugMode, debugPathType, toggleDebugMode, setDebugPathType } = useDebugStore();

  return (
    <div className="mx-2 lg:mx-4 p-6 lg:p-8 space-y-8 max-w-4xl">
      
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and app preferences
        </p>
      </div>

      {/* Profile section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="w-5 h-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar display */}
          <div className="flex items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {/* Render user avatar if available, otherwise fallback icon */}
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

          {/* Name fields (read-only) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={user?.user_metadata?.full_name?.split(" ")[0] || ""}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={user?.user_metadata?.full_name?.split(" ")[1] || ""}
                readOnly
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email} />
          </div>
        </CardContent>
      </Card>

      {/* Developer options section */}
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
          {/* Debug mode toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-amber-900 dark:text-amber-100">
                Enable Mock Location
              </Label>
              <p className="text-sm text-muted-foreground">
                Override real GPS with simulated data
              </p>
            </div>

            {/* Controlled switch bound to debug store */}
            <Switch
              checked={isDebugMode}
              onCheckedChange={toggleDebugMode}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>

          {/* Render extra options only when debug mode is enabled */}
          {isDebugMode && (
            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
              <Separator className="mb-4 bg-amber-500/20" />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Simulation Type
                  </Label>

                  {/* Path simulation selector */}
                  <Select
                    value={debugPathType}
                    onValueChange={(v: any) => setDebugPathType(v)}
                  >
                    <SelectTrigger className="border-amber-200 focus:ring-amber-500">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="fixed">
                        Fixed Path (Deterministic)
                      </SelectItem>
                      <SelectItem value="random">
                        Random Walk (Stochastic)
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Dynamic description based on selected type */}
                  <p className="text-xs text-muted-foreground">
                    {debugPathType === "fixed"
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