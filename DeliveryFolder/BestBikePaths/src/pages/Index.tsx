import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import PathFinder from "@/components/PathFinder";
import Community from "@/components/Community";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <PathFinder />
        <Community />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
