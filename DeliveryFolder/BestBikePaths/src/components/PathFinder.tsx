import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Route, Star, Clock, ArrowRight } from "lucide-react";

const mockPaths = [
  {
    id: 1,
    name: "Via Verde del Lungomare",
    distance: "8.5 km",
    time: "32 min",
    status: "Ottimale",
    statusColor: "text-green-600 bg-green-500/10",
    score: 4.8,
    obstacles: 0,
  },
  {
    id: 2,
    name: "Percorso Parco Centrale",
    distance: "6.2 km",
    time: "25 min",
    status: "Buono",
    statusColor: "text-blue-600 bg-blue-500/10",
    score: 4.2,
    obstacles: 2,
  },
  {
    id: 3,
    name: "Ciclabile Fiume Vecchio",
    distance: "10.1 km",
    time: "42 min",
    status: "Manutenzione",
    statusColor: "text-amber-600 bg-amber-500/10",
    score: 3.5,
    obstacles: 5,
  },
];

const PathFinder = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (origin && destination) {
      setShowResults(true);
    }
  };

  return (
    <section id="paths" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Route className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Trova percorsi
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              Cerca il percorso{" "}
              <span className="text-gradient">perfetto per te</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Inserisci origine e destinazione per scoprire i migliori percorsi
              ciclabili valutati dalla community.
            </p>
          </div>

          {/* Search card */}
          <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                <Input
                  type="text"
                  placeholder="Partenza (es. Piazza Duomo)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-12 h-14 rounded-xl bg-secondary border-0 text-base"
                />
              </div>
              
              <div className="hidden lg:flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div className="flex-1 relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type="text"
                  placeholder="Destinazione (es. Parco Centrale)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-12 h-14 rounded-xl bg-secondary border-0 text-base"
                />
              </div>
              
              <Button
                variant="hero"
                size="lg"
                className="h-14 px-8"
                onClick={handleSearch}
              >
                Cerca percorsi
              </Button>
            </div>
          </div>

          {/* Results */}
          {showResults && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-foreground">
                  Percorsi trovati
                </h3>
                <span className="text-sm text-muted-foreground">
                  {mockPaths.length} risultati
                </span>
              </div>

              {mockPaths.map((path, index) => (
                <div
                  key={path.id}
                  className="bg-card rounded-2xl p-5 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Route className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="text-lg font-display font-bold text-foreground mb-1">
                          {path.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {path.distance}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {path.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            {path.score}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${path.statusColor}`}
                      >
                        {path.status}
                      </span>
                      {path.obstacles > 0 && (
                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/10 text-amber-600">
                          {path.obstacles} ostacoli
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PathFinder;
