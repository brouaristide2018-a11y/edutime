import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BookOpen, Clock, Shield, Users, ArrowRight, CheckCircle, Megaphone, QrCode, Menu, X } from 'lucide-react';
import { useStore } from '../store';

export function LandingPage() {
  const navigate = useNavigate();
  const [currentBg, setCurrentBg] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const platformSettings = useStore(state => state.platformSettings);
  const allAnnouncements = useStore(state => state.announcements);

  // Public active announcements from store
  const announcements = allAnnouncements
    .filter(a => a.status === 'active' && a.isPublic)
    .sort((a, b) => b.createdAt - a.createdAt);

  const defaultImages = [
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2070"
  ];

  const publicSite = platformSettings?.publicSite;
  const bgImages = publicSite?.heroBgImages && publicSite.heroBgImages.length > 0 ? publicSite.heroBgImages : defaultImages;
  const sliderDuration = publicSite?.sliderDuration || 3000;
  const heroTitle = publicSite?.heroTitle || 'La gestion scolaire réinventée pour demain.';
  const heroSubtitle = publicSite?.heroSubtitle || "Optimisez le suivi des professeurs, automatisez la paie et gérez vos emplois du temps avec une simplicité déconcertante. Conçu pour les établissements d'excellence.";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, sliderDuration);
    return () => clearInterval(timer);
  }, [bgImages.length, sliderDuration]);


  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              {publicSite?.logoUrl ? (
                <img src={publicSite.logoUrl} alt="EduTime Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                  <Building2 size={24} />
                </div>
              )}
              <span className="text-xl font-bold text-gray-900 tracking-tight">EduTime</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {announcements.length > 0 && (
                <a href="#announcements" onClick={(e) => { e.preventDefault(); scrollTo('announcements'); }} className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer">Actualités</a>
              )}
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }} className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer">Fonctionnalités</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }} className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer">À propos</a>
              <button 
                onClick={() => navigate('/quick-attendance')}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <QrCode size={18} />
                Pointer
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"
              >
                Connexion/Inscription
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="px-4 pt-2 pb-6 space-y-4">
              {announcements.length > 0 && (
                <button 
                  onClick={() => scrollTo('announcements')} 
                  className="block w-full text-left text-base font-medium text-gray-600 hover:text-indigo-600 py-2 border-b border-gray-50"
                >
                  Actualités
                </button>
              )}
              <button 
                onClick={() => scrollTo('features')} 
                className="block w-full text-left text-base font-medium text-gray-600 hover:text-indigo-600 py-2 border-b border-gray-50"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => scrollTo('about')} 
                className="block w-full text-left text-base font-medium text-gray-600 hover:text-indigo-600 py-2 border-b border-gray-50"
              >
                À propos
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); navigate('/quick-attendance'); }}
                className="flex items-center gap-2 w-full text-left text-base font-bold text-indigo-600 py-2 border-b border-gray-50"
              >
                <QrCode size={20} />
                Pointer
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                className="w-full flex items-center justify-center py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-transform"
              >
                Connexion/Inscription
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0">
          {bgImages.map((img, index) => (
            <div 
              key={img} 
              className={`absolute inset-0 transition-opacity duration-1000 ${currentBg === index ? 'opacity-100' : 'opacity-0'}`} 
              style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
            />
          ))}
          {/* Overlay to ensure text readability while keeping image visible */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
          {/* Gradient to smooth out the bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
            Nouvelle version 2026 disponible
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            {heroTitle.includes('réinventée') ? (
               <>La gestion scolaire <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">réinventée pour demain.</span></>
            ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{heroTitle}</span>
            )}
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed whitespace-pre-wrap">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              Démarrer maintenant
              <ArrowRight size={20} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all">
              Voir la démo
            </button>
          </div>
          
          <div className="mt-20 relative px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2070" 
              alt="Dashboard Preview" 
              className="rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl mx-auto object-cover h-[400px] md:h-[600px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section id="announcements" className="py-20 bg-indigo-50 border-y border-indigo-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-10">
              <Megaphone className="w-8 h-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Actualités & Annonces</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map((ann) => (
                <div key={ann.id} className={`bg-white rounded-2xl shadow-sm border ${ann.type === 'ad' ? 'border-amber-200' : 'border-indigo-100'} p-6 hover:shadow-md transition-shadow relative overflow-hidden`}>
                  {ann.type === 'ad' && (
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Publicité
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 pr-16">{ann.title}</h3>
                  <p className="text-gray-500 text-xs mb-4">{new Date(ann.createdAt).toLocaleDateString('fr-FR')}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: BookOpen, title: "Planification Agile", desc: "Gérez vos emplois du temps complexes en quelques clics." },
              { icon: Clock, title: "Pointage Temps Réel", desc: "Suivez les présences des professeurs avec précision." },
              { icon: Shield, title: "Sécurité Maximale", desc: "Vos données sont chiffrées et protégées en permanence." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">
              Un écosystème complet pour votre établissement.
            </h2>
            <div className="space-y-6">
              {[
                "Gestion automatisée des vacations et salaires",
                "Tableaux de bord analytiques en temps réel",
                "Espace professeur intuitif sur mobile",
                "Notifications multicanales (SMS, Email)"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-indigo-600 rounded-3xl p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-6 italic opacity-90">"La meilleure décision prise pour notre école cette année."</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-400"></div>
                <div>
                  <p className="font-bold">Directeur Académique</p>
                  <p className="text-indigo-200 text-sm">Collège de l'Excellence</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">À propos d'EduTime</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Fondée avec la conviction que la technologie doit libérer le potentiel éducatif, EduTime est née de la volonté de simplifier la charge administrative grandissante des directeurs et du personnel éducatif.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1471" 
                alt="Notre Équipe" 
                className="rounded-2xl shadow-lg object-cover w-full h-[400px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Notre Mission</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Nous concevons des logiciels innovants, sécurisés et intuitifs qui redonnent du temps aux établissements. Fini les plannings sur papier, la gestion des absences approximative et les erreurs de paie. Nous créons le pont manquant entre rigueur administrative et fluidité technologique.
              </p>
              
              <div className="space-y-4">
                 <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-indigo-600 mt-1"><Users size={24} /></div>
                    <div>
                      <h4 className="font-bold text-gray-900">Pour les équipes dirigeantes</h4>
                      <p className="text-sm text-gray-500">Un pilotage clair, financier et humain.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-indigo-600 mt-1"><BookOpen size={24} /></div>
                    <div>
                      <h4 className="font-bold text-gray-900">Pour le corps académique</h4>
                      <p className="text-sm text-gray-500">Des emplois du temps accessibles en temps réel.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Prêt à transformer votre gestion ?</h2>
          <p className="text-xl text-gray-400 mb-12">Rejoignez des centaines d'établissements qui nous font déjà confiance.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Commencer l'aventure gratuitement
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                {publicSite?.logoUrl ? (
                  <img src={publicSite.logoUrl} alt="EduTime Logo" className="h-8 object-contain grayscale opacity-80" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                    <Building2 size={20} />
                  </div>
                )}
                <span className="text-xl font-bold text-gray-900 tracking-tight">EduTime</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Simplifiez la gestion de votre établissement avec notre plateforme tout-en-un conçue pour l'excellence éducative.
              </p>
              {platformSettings?.supportContact && (
                <div className="text-sm font-medium text-gray-600">
                  <span className="block mb-1">Contact:</span>
                  <a href={`mailto:${platformSettings.supportContact}`} className="text-indigo-600 hover:text-indigo-700 hover:underline">
                    {platformSettings.supportContact}
                  </a>
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Produit</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }} className="hover:text-indigo-600 transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Cas clients</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Mises à jour</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Ressources</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Webinaires</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Guides pratiques</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Légal</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Sécurité des données</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} EduTime Academy. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Système opérationnel
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
