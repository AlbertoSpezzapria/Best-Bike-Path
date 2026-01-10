import { Button } from "@/components/ui/button";
import { MapPin, Route, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden pt-16">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 pt-16 lg:pt-24">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-slide-up">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                La community dei ciclisti
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight mb-6 animate-slide-up-delay-1">
              Scopri i migliori{" "}
              <span className="text-gradient">percorsi ciclabili</span> della
              tua città
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed animate-slide-up-delay-2">
              Registra i tuoi viaggi, condividi informazioni sui percorsi e
              trova le strade migliori per pedalare in sicurezza. Tutto in
              un'unica app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up-delay-3">
              <Button variant="hero" size="xl">
                <Route className="w-5 h-5" />
                Inizia ora
              </Button>
              <Button variant="outline" size="xl">
                <MapPin className="w-5 h-5" />
                Esplora percorsi
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 justify-center lg:justify-start animate-slide-up-delay-3">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-display font-bold text-foreground">
                  10K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Ciclisti attivi
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-display font-bold text-foreground">
                  5K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Percorsi mappati
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-display font-bold text-foreground">
                  50K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Km registrati
                </div>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="flex-1 relative animate-float">
            <div className="relative w-full max-w-lg mx-auto">
              {/* Phone mockup */}
              <div className="relative bg-card rounded-[3rem] p-3 shadow-2xl border border-border">
                <div className="bg-foreground/5 rounded-[2.5rem] overflow-hidden aspect-[9/16]">
                  {/* App screen simulation */}
                  <div className="h-full bg-gradient-to-b from-primary/20 to-background p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-20 h-3 bg-foreground/10 rounded-full" />
                      <div className="w-8 h-8 bg-primary/20 rounded-full" />
                    </div>
                    
                    {/* Map simulation */}
                    <div className="flex-1 bg-secondary rounded-2xl relative overflow-hidden">
                      <div className="absolute inset-0 opacity-30">
                        <svg className="w-full h-full" viewBox="0 0 200 300">
                          <path
                            d="M20,280 Q60,200 40,150 T100,50 Q140,100 180,80"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <circle cx="20" cy="280" r="8" fill="hsl(var(--accent))" />
                          <circle cx="180" cy="80" r="8" fill="hsl(var(--primary))" />
                        </svg>
                      </div>
                      
                      {/* Route card */}
                      <div className="absolute bottom-4 left-4 right-4 bg-card rounded-xl p-3 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                            <Route className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              Percorso ottimale
                            </div>
                            <div className="text-xs text-muted-foreground">
                              12.5 km • 45 min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-xl border border-border animate-bounce">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center">
                    <Zap className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Velocità</div>
                    <div className="text-sm font-bold text-foreground">24 km/h</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-4 shadow-xl border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Stato</div>
                    <div className="text-sm font-bold text-green-600">Ottimale</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
