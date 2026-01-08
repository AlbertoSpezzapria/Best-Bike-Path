import { UserPlus, Navigation, Share2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Registrati",
    description:
      "Crea il tuo account gratuito in pochi secondi. Accedi subito a tutte le funzionalità dell'app.",
  },
  {
    number: "02",
    icon: Navigation,
    title: "Pedala e traccia",
    description:
      "Avvia il tracciamento mentre pedali. L'app registra automaticamente percorso, velocità e rileva ostacoli.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Condividi",
    description:
      "Pubblica i tuoi percorsi e segnalazioni. Contribuisci alla community e scopri percorsi di altri ciclisti.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">
              Come funziona
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Inizia in <span className="text-gradient">3 semplici passi</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Best Bike Paths è progettato per essere semplice e intuitivo. In
            pochi minuti sarai pronto per pedalare.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2 z-0" />

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* Step card */}
                <div className="bg-card rounded-2xl p-8 border border-border shadow-card w-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {/* Number badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-glow">
                    {index + 1}
                  </div>

                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>

                  <h3 className="text-xl font-display font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
