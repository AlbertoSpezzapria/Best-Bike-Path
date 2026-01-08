import { Users, Route, MapPin, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,234",
    label: "Ciclisti registrati",
    trend: "+12%",
    color: "text-primary",
  },
  {
    icon: Route,
    value: "5,847",
    label: "Percorsi mappati",
    trend: "+8%",
    color: "text-accent",
  },
  {
    icon: MapPin,
    value: "23,156",
    label: "Segnalazioni attive",
    trend: "+25%",
    color: "text-blue-600",
  },
  {
    icon: TrendingUp,
    value: "142,389",
    label: "Km percorsi oggi",
    trend: "+18%",
    color: "text-emerald-600",
  },
];

const Community = () => {
  return (
    <section id="community" className="py-24 gradient-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <Users className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Community</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Una community in costante crescita
          </h2>
          <p className="text-lg text-white/80">
            Migliaia di ciclisti contribuiscono ogni giorno a migliorare i dati
            sui percorsi della loro città.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Community;
