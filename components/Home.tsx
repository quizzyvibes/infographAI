
import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Share2, Layers, BarChart, BookOpen, PenTool } from 'lucide-react';

interface HomeProps {
  onStartCreate: () => void;
}

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
    title: "Data Visualization Made Simple",
    subtitle: "Turn complex datasets into stunning visual stories in seconds using the power of Gemini 3."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2604&auto=format&fit=crop",
    title: "Educational Content Reimagined",
    subtitle: "Create engaging posters and summaries for any grade level, from kindergarten to PhD."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2670&auto=format&fit=crop",
    title: "Business Insights at a Glance",
    subtitle: "Generate professional flowcharts, mindmaps, and infographics for your next big presentation."
  }
];

export const Home: React.FC<HomeProps> = ({ onStartCreate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full animate-fade-in -mt-10">
      {/* Hero Slider Section */}
      <div className="relative h-[650px] w-full overflow-hidden bg-slate-900">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Darker Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" /> 
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform scale-105"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4">
              <div className="max-w-4xl space-y-6 animate-slide-up">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-semibold tracking-wider uppercase mb-2 backdrop-blur-sm">
                  AI-Powered Generation
                </span>
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl text-slate-100 font-light max-w-2xl mx-auto drop-shadow-md">
                  {slide.subtitle}
                </p>
                <div className="pt-4 flex justify-center gap-4">
                    <button
                      onClick={onStartCreate}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-blue-900/20 flex items-center gap-2"
                    >
                      Start Creating <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({behavior: 'smooth'}) }}
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-bold text-lg transition-all backdrop-blur-md"
                    >
                      Learn More
                    </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slider Dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-blue-500 w-8' : 'bg-white/40 w-2 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 border-b border-slate-800 relative z-20">
          <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                  <div className="text-4xl font-bold text-white mb-1">10k+</div>
                  <div className="text-slate-400 text-sm uppercase tracking-wide">Infographics</div>
              </div>
              <div>
                  <div className="text-4xl font-bold text-white mb-1">200+</div>
                  <div className="text-slate-400 text-sm uppercase tracking-wide">Topics</div>
              </div>
              <div>
                  <div className="text-4xl font-bold text-white mb-1">4K</div>
                  <div className="text-slate-400 text-sm uppercase tracking-wide">Resolution</div>
              </div>
              <div>
                  <div className="text-4xl font-bold text-white mb-1">100%</div>
                  <div className="text-slate-400 text-sm uppercase tracking-wide">AI Generated</div>
              </div>
          </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Why Choose InfographAI?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We bridge the gap between raw data and visual understanding using the most advanced Gemini models available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Instant Generation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Just enter a topic and audience level. Our AI drafts the layout, content, and visuals in seconds, saving you hours of design time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Multi-Format Support</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Need a flowchart? A mindmap? A standard poster? Switch formats instantly to suit your data representation needs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Share2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Share & Export</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Download in high-resolution 4K or generate a companion article and audio podcast automatically to distribute your content.
            </p>
          </div>

           {/* Card 4 */}
           <div className="group p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Educational Content</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
               Tailored to specific grade levels. Whether it's for Grade 1 or a PhD thesis, the content complexity adjusts automatically.
            </p>
          </div>

           {/* Card 5 */}
           <div className="group p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <BarChart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Data to Story</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
               We don't just paste charts. We analyze the context of your subject and build a narrative flow that explains the "Why" behind the "What".
            </p>
          </div>

           {/* Card 6 */}
           <div className="group p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <PenTool className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Complete Customization</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
               Unlock Pro features to add QR codes, change aspect ratios for social media (9:16) or presentations (16:9), and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

