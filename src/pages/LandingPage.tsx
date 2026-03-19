import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Upload, BarChart3, Sparkles, Briefcase, CheckCircle2, Target, Globe, ArrowRight, ChevronDown, Shield, Clock, Brain } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Upload, title: "Resume Upload", desc: "Drag and drop your resume. We parse it instantly." },
  { icon: BarChart3, title: "ATS Score Checker", desc: "Know your resume's ATS compatibility before applying." },
  { icon: Target, title: "Job Compatibility", desc: "See exactly how well you match each opportunity." },
  { icon: Sparkles, title: "Resume Customizer", desc: "Optimize your resume for each specific role." },
  { icon: Briefcase, title: "Daily Discovery", desc: "Fresh jobs and internships matched to your profile." },
  { icon: Zap, title: "Smart Auto Apply", desc: "Automated applications on supported direct-apply platforms." },
  { icon: CheckCircle2, title: "Job Tracking", desc: "Track every application status in one dashboard." },
  { icon: Globe, title: "Source-Aware", desc: "Know which platforms support auto-apply vs account-required." },
];

const howItWorks = [
  { step: "01", title: "Upload Your Resume", desc: "Upload PDF or DOCX. Our parser extracts your data instantly." },
  { step: "02", title: "Set Preferences", desc: "Choose roles, locations, salary range, and opportunity types." },
  { step: "03", title: "Review Matches", desc: "See jobs and internships ranked by compatibility score." },
  { step: "04", title: "Auto Apply", desc: "We apply to eligible direct-apply sources automatically." },
];

const faqs = [
  { q: "Does every source support auto-apply?", a: "No. We clearly distinguish between direct auto-apply sources (like Lever, Greenhouse) and account-required sources (like LinkedIn, Internshala) where you need to connect your account." },
  { q: "Do you support internships?", a: "Yes! We match both full-time jobs and internships, with clear labels for each opportunity type." },
  { q: "Is this US-only?", a: "No. We support global job search with flexible location, currency, and work authorization fields." },
  { q: "How is the compatibility score calculated?", a: "We analyze your skills, experience, keywords, and preferences against each job's requirements to produce a match percentage." },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">JobMatch AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-3.5 w-3.5" />Source-aware automation for jobs & internships
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Upload Resume. Match Jobs.
              <br />
              <span className="text-primary">Auto Apply Smarter.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              AI-powered job matching with source-aware automation. We know which platforms support direct auto-apply
              and which need your account — so you always know what's happening.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup"><Button size="lg" className="gap-2 px-8">Start Free <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/login"><Button variant="outline" size="lg" className="px-8">Sign In</Button></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.8 }} className="mt-12">
            <ChevronDown className="h-6 w-6 mx-auto text-muted-foreground animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
            <p className="text-muted-foreground">From resume parsing to automated applications — all in one platform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.05, duration: 0.3 }}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow duration-150"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps to automate your job search.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-xl border border-border bg-card"
              >
                <div className="text-3xl font-extrabold text-primary/20">{item.step}</div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why JobMatch AI?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Source Transparency", desc: "Always know whether a source supports direct auto-apply, requires an account, or is coming soon." },
              { icon: Clock, title: "Save 10+ Hours/Week", desc: "Stop manually applying. Let automation handle eligible applications while you focus on interviews." },
              { icon: Brain, title: "AI-Powered Matching", desc: "Our compatibility engine analyzes skills, keywords, and experience to find your best-fit opportunities." },
            ].map((b) => (
              <div key={b.title} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-card border border-border rounded-xl p-5">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-sm text-muted-foreground mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Job Search?</h2>
          <p className="text-muted-foreground mb-8">Upload your resume and start matching with opportunities in minutes.</p>
          <Link to="/signup"><Button size="lg" className="gap-2 px-8">Get Started Free <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">JobMatch AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 JobMatch AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
