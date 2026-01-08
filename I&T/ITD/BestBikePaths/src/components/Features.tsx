import { Route, MapPin, Smartphone, Users, Cloud, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Route,
    title: "Tracciamento GPS",
    description:
      "Registra automaticamente i tuoi percorsi con GPS preciso. Velocità, distanza e durata sempre sotto controllo.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MapPin,
    title: "Segnalazione ostacoli",
    description:
      "Segnala buche, pericoli e manutenzione necessaria. Aiuta altri ciclisti a evitare problemi.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Smartphone,
    title: "Rilevamento automatico",
    description:
      "L'accelerometro rileva automaticamente buche e ostacoli mentre pedali. Conferma o correggi i dati.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Cloud,
    title: "Dati meteo integrati",
    description:
      "Informazioni meteo in tempo reale per ogni viaggio: temperatura, vento e condizioni atmosferiche.",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    icon: Users,
    title: "Community driven",
    description:
      "Le informazioni sui percorsi sono aggregate dalla community. Più utenti confermano, più sono affidabili.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Statistiche dettagliate",
    description:
      "Analizza le tue performance: distanza totale, velocità media, tempo in sella e molto altro.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-6">
            <span className="text-sm font-medium text-secondary-foreground">
              Funzionalità
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Tutto quello che serve per{" "}
            <span className="text-gradient">pedalare meglio</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Best Bike Paths offre strumenti potenti per tracciare i tuoi viaggi,
            scoprire nuovi percorsi e contribuire alla community dei ciclisti.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
