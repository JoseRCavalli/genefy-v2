import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dna,
  ArrowRight,
  Database,
  Cpu,
  TrendingUp,
  Target,
  Layers,
  PieChart,
  ShieldCheck,
  Zap,
  Globe,
  Check,
  Star,
  Quote,
  Mail,
  Phone,
  ChevronRight,
  Linkedin,
  Instagram,
  Menu,
  X
} from 'lucide-react';

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Smooth scroll helper
  const handleScroll = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll listener for header transparency
  useEffect(() => {
    const handleScrollEvent = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    handleScrollEvent(); // Check initial position
    return () => window.removeEventListener('scroll', handleScrollEvent);
  }, []);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  // Particle Canvas system
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      reset: () => void;
      update: () => void;
      draw: () => void;
    }> = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const createParticle = () => {
      const p = {
        x: 0,
        y: 0,
        size: 0,
        speedX: 0,
        speedY: 0,
        opacity: 0,
        reset() {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.size = Math.random() * 2 + 1;
          p.speedX = (Math.random() - 0.5) * 0.3;
          p.speedY = (Math.random() - 0.5) * 0.3;
          p.opacity = Math.random() * 0.4;
        },
        update() {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            p.reset();
          }
        },
        draw() {
          if (!ctx) return;
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      p.reset();
      return p;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push(createParticle());
      }
    };

    let animationId: number;
    const animateParticles = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animateParticles);
    };

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      initParticles();
      animateParticles();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Form submission for contact
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = (document.getElementById('contact-nome') as HTMLInputElement)?.value;
    const email = (document.getElementById('contact-email') as HTMLInputElement)?.value;
    const rebanho = (document.getElementById('contact-rebanho') as HTMLSelectElement)?.value;

    if (!nome?.trim() || !email?.trim()) {
      alert('Por favor, preencha o seu nome e e-mail.');
      return;
    }

    const whatsappNumber = '5545999999999'; // Número comercial padrão do Genefy
    const textMessage = `Olá, gostaria de solicitar uma consultoria gratuita sobre o Genefy.
- Nome: ${nome}
- E-mail: ${email}
- Tamanho do Rebanho: ${rebanho}`;

    const encodedMessage = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm h-20">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/genefy-logo-dark.png"
                alt="Genefy Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-md lg:gap-xl">
            <button onClick={() => handleScroll('como-funciona')} className="text-primary border-b-2 border-primary pb-1 font-label-md text-label-md cursor-pointer transition-all duration-200">Genética</button>
            <button onClick={() => handleScroll('funcionalidades')} className="text-on-surface-variant/80 font-label-md text-label-md hover:text-primary transition-colors duration-200 cursor-pointer">Resultados</button>
            <button onClick={() => handleScroll('beef-on-dairy')} className="text-on-surface-variant/80 font-label-md text-label-md hover:text-primary transition-colors duration-200 cursor-pointer">Metodologia</button>
            <button onClick={() => handleScroll('depoimentos')} className="text-on-surface-variant/80 font-label-md text-label-md hover:text-primary transition-colors duration-200 cursor-pointer">Sobre</button>
          </nav>

          <div className="flex items-center gap-md">
            <Link to="/solicitar" className="hidden lg:block text-primary font-label-md text-label-md px-md py-sm hover:opacity-80 transition-all font-semibold">
              Solicitar Acesso
            </Link>
            <Link to="/login" className="bg-primary text-on-primary px-md py-sm rounded-xl font-label-md text-label-md hover:scale-95 duration-150 transition-all font-semibold">
              Acessar Plataforma
            </Link>
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-primary hover:opacity-80 transition-all cursor-pointer"
              aria-label="Abrir Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Slideout */}
      {isMobileMenuOpen && (
        <div className="fixed top-20 left-0 right-0 bg-surface border-b border-outline-variant/30 p-6 flex flex-col gap-4 z-40 shadow-lg md:hidden">
          <button onClick={() => handleScroll('como-funciona')} className="text-left font-semibold text-on-surface-variant hover:text-primary transition-colors">Genética</button>
          <button onClick={() => handleScroll('funcionalidades')} className="text-left font-semibold text-on-surface-variant hover:text-primary transition-colors">Resultados</button>
          <button onClick={() => handleScroll('beef-on-dairy')} className="text-left font-semibold text-on-surface-variant hover:text-primary transition-colors">Metodologia</button>
          <button onClick={() => handleScroll('depoimentos')} className="text-left font-semibold text-on-surface-variant hover:text-primary transition-colors">Sobre</button>
          <hr className="border-outline-variant/20" />
          <Link to="/solicitar" className="w-full py-2.5 text-center font-semibold text-primary border border-primary rounded-xl hover:bg-surface-container transition-colors">
            Solicitar Acesso
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative flex items-center overflow-hidden min-h-[500px]" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            className="w-full h-full object-cover object-center animate-ken-burns"
            alt="Vaca holandesa em pasto verde ao amanhecer"
            src="/images/hero-cow.jpg"
          />
          {/* Gradient overlay — lateral coverage */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/40 to-transparent"></div>
          {/* Gradient overlay — top coverage (fuses with transparent navbar) */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-primary/60"></div>
        </div>
        
        {/* Ambient Particle Overlay */}
        <canvas id="particle-canvas" className="absolute inset-0 z-0"></canvas>

        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-gutter py-[10vw] pt-28">
          <div className="md:col-span-8 lg:col-span-6 reveal animate-float">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-container text-on-tertiary-fixed rounded-full text-label-sm font-label-sm mb-md">
              <Dna className="w-4 h-4" />
              TECNOLOGIA GENÔMICA AVANÇADA
            </span>
            <h1 className="font-headline-xl text-headline-xl text-white mb-md leading-tight">
              O melhor acasalamento começa antes da inseminação.
            </h1>
            <p className="font-body-lg text-body-lg text-white/90 mb-lg max-w-xl">
              Utilizamos inteligência artificial e análise de dados genômicos para elevar o patamar de produtividade do seu rebanho. Decisões baseadas em ciência, não em intuição.
            </p>
            <div className="flex flex-wrap gap-md">
              <Link to="/solicitar" className="bg-[#1E7E34] text-white px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all flex items-center gap-2 shadow-lg hover:shadow-green-900/20">
                Começar Agora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={() => handleScroll('como-funciona')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-lg py-md rounded-xl font-label-md text-label-md hover:bg-white/20 transition-all cursor-pointer">
                Ver Demonstração
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-xl bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">Como Funciona</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
              Integramos seu fluxo de trabalho atual com nossa camada de inteligência genômica em três etapas simples.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            {/* Step 1 */}
            <div className="relative p-md reveal" style={{ transitionDelay: '100ms' }}>
              <span className="step-watermark">01</span>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-md text-primary">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-sm">Coleta de Dados</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Importamos automaticamente o histórico genético e produtivo das suas matrizes diretamente dos principais softwares de gestão.
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative p-md reveal" style={{ transitionDelay: '200ms' }}>
              <span className="step-watermark">02</span>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-md text-on-secondary-container">
                  <Cpu className="w-8 h-8" />
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-sm">Análise Genofônica</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Nosso algoritmo processa milhares de combinações possíveis para identificar os acasalamentos que maximizam o retorno genético.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="relative p-md reveal" style={{ transitionDelay: '300ms' }}>
              <span className="step-watermark">03</span>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-tertiary-container rounded-2xl flex items-center justify-center mb-md text-on-tertiary-container">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-sm">Execução de Precisão</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Receba relatórios detalhados com sugestões de compra de sêmen e mapas de acasalamento individuais por fêmea.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Grid */}
      <section id="funcionalidades" className="py-xl bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-xl reveal">
            <div className="max-w-xl">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">Tecnologia que impulsiona resultados</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Ferramentas avançadas desenvolvidas para geneticistas e produtores que buscam a excelência em cada nova geração.
              </p>
            </div>
            <button onClick={() => handleScroll('planos')} className="mt-md md:mt-0 text-primary font-label-md flex items-center gap-2 hover:gap-3 transition-all cursor-pointer">
              Ver todas funcionalidades <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {/* Feature Cards */}
            <div className="glass-card p-md rounded-xl shadow-sm reveal group hover:-translate-y-2 transition-all">
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <Target className="text-primary w-6 h-6" />
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-sm">Matching Individual</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Algoritmos proprietários que analisam 14+ características lineares para sugerir o touro ideal para cada vaca.
              </p>
            </div>
            <div className="glass-card p-md rounded-xl shadow-sm reveal group hover:-translate-y-2 transition-all" style={{ transitionDelay: '100ms' }}>
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <Layers className="text-primary w-6 h-6" />
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-sm">Consanguinidade</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Controle rigoroso do coeficiente de endogamia (inbreeding) para garantir a saúde e vigor híbrido do rebanho.
              </p>
            </div>
            <div className="glass-card p-md rounded-xl shadow-sm reveal group hover:-translate-y-2 transition-all" style={{ transitionDelay: '200ms' }}>
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <PieChart className="text-primary w-6 h-6" />
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-sm">Análise de Lucratividade</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Projeção financeira baseada no mérito líquido (NM$) e índice de fertilidade das gerações futuras.
              </p>
            </div>
            <div className="glass-card p-md rounded-xl shadow-sm reveal group hover:-translate-y-2 transition-all" style={{ transitionDelay: '300ms' }}>
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-primary w-6 h-6" />
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-sm">Certificação Genômica</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Selos de qualidade para animais que atingem o top 1% de desempenho genômico do mercado.
              </p>
            </div>
            <div className="glass-card p-md rounded-xl shadow-sm reveal group hover:-translate-y-2 transition-all" style={{ transitionDelay: '400ms' }}>
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <Zap className="text-primary w-6 h-6" />
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-sm">Integração Real-time</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Sincronização imediata com plataformas de registro e laboratórios de genotipagem parceiros.
              </p>
            </div>
            <div className="glass-card p-md rounded-xl shadow-sm reveal group hover:-translate-y-2 transition-all" style={{ transitionDelay: '500ms' }}>
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <Globe className="text-primary w-6 h-6" />
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-sm">Benchmarking Global</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Compare seus resultados com a média dos melhores produtores do mundo em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beef on Dairy Section */}
      <section id="beef-on-dairy" className="relative py-xl overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            alt="A powerful dark-furred Angus beef bull silhouetted against a dramatic sky."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMvfD_m32GdyUE1itxfMTg5MXL5Za-jFdoIqYkeJUjRA4nrvqk15D2By-ExHzeWGSICBQca7b8XFqV6th9xUYcn6sAJ7lvO9jH6ILK-G2d4oseUTF0oSN9eLJcmsj383O2Etur6qRE57IUm5x75LXpU8PRQ0ImjZo2-_J9XH5RySVnYqIYTpX524THsV0yMIULB9zaX4umNUTibAIUq-mabdMzlDYb-bxWw7ZYn2pZk8vliEGklYMAECG-5MVciRkA20vHbftDr2o"
          />
          <div className="absolute inset-0 bg-primary/90"></div>
        </div>
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
          <div className="reveal">
            <span className="text-tertiary-fixed font-label-sm uppercase tracking-widest mb-sm block">Estratégia Avançada</span>
            <h2 className="font-headline-xl text-headline-xl text-white mb-md">Beef on Dairy: Maximize cada bezerro.</h2>
            <p className="font-body-lg text-body-lg text-white/80 mb-lg">
              Transforme suas vacas de menor mérito genético em ativos de alto valor através de cruzamentos industriais estratégicos. Nossa inteligência define exatamente quais animais devem receber sêmen de corte para otimizar sua lucratividade.
            </p>
            <div className="space-y-md mb-lg">
              <div className="flex items-center gap-md text-white">
                <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-body-md text-body-md">Seleção automática de matrizes para cruzamento.</span>
              </div>
              <div className="flex items-center gap-md text-white">
                <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-body-md text-body-md">Sinalização de mercado para raças de corte (Angus, Wagyu).</span>
              </div>
              <div className="flex items-center gap-md text-white">
                <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-body-md text-body-md">Acompanhamento de ganho médio diário projetado.</span>
              </div>
            </div>
            <button onClick={() => handleScroll('contato')} className="bg-tertiary-container text-on-tertiary-container px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all cursor-pointer">
              Saber mais sobre Beef on Dairy
            </button>
          </div>
          <div className="hidden md:block reveal" style={{ transitionDelay: '200ms' }}>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-lg rounded-2xl transition-all duration-300 hover:border-white/20">
              <div className="text-white text-headline-xl font-bold mb-xs">+24%</div>
              <div className="text-tertiary-fixed font-label-md mb-lg">Aumento médio no Ticket Médio por bezerro</div>
              <div className="h-40 flex items-end gap-2">
                <div className="flex-1 bg-white/10 h-12 rounded-t-lg"></div>
                <div className="flex-1 bg-white/20 h-24 rounded-t-lg"></div>
                <div className="flex-1 bg-white/30 h-32 rounded-t-lg"></div>
                <div className="flex-1 bg-tertiary-container h-full rounded-t-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-xl bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">Planos e Consultoria</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
              Soluções escaláveis para rebanhos de todos os tamanhos, desde produtores familiares a grandes grupos agroindustriais.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter items-stretch">
            {/* Plan 1 */}
            <div className="glass-card pricing-card p-lg rounded-2xl flex flex-col reveal">
              <h3 className="font-headline-md text-headline-md text-primary mb-sm">Starter</h3>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-headline-lg font-bold text-primary">R$ 490</span>
                <span className="text-on-surface-variant text-body-md">/mês</span>
              </div>
              <p className="text-on-surface-variant mb-lg font-body-md">Ideal para rebanhos até 100 matrizes.</p>
              <ul className="space-y-sm mb-xl flex-grow">
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Acasalamento básico</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Dashboard genético</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Suporte via Ticket</span>
                </li>
              </ul>
              <Link to="/solicitar" className="w-full py-md border border-primary text-primary rounded-xl font-label-md hover:bg-primary hover:text-white transition-all text-center block mt-auto">
                Assinar Agora
              </Link>
            </div>
            {/* Plan 2 (Plus) */}
            <div className="glass-card pricing-card p-lg rounded-2xl flex flex-col reveal" style={{ transitionDelay: '100ms' }}>
              <h3 className="font-headline-md text-headline-md text-primary mb-sm">Plus</h3>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-headline-lg font-bold text-primary">R$ 790</span>
                <span className="text-on-surface-variant text-body-md">/mês</span>
              </div>
              <p className="text-on-surface-variant mb-lg font-body-md">Até 250 matrizes com alertas avançados.</p>
              <ul className="space-y-sm mb-xl flex-grow">
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Tudo do Starter</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Alertas genéticos avançados</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Exportação de relatórios PDF</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
              <Link to="/solicitar" className="w-full py-md border border-primary text-primary rounded-xl font-label-md hover:bg-primary hover:text-white transition-all text-center block mt-auto">
                Assinar Agora
              </Link>
            </div>
            {/* Plan 3 (PRO) */}
            <div className="glass-card pricing-card p-lg rounded-2xl flex flex-col border-2 border-tertiary-container relative reveal scale-105 shadow-xl" style={{ transitionDelay: '200ms' }}>
              <div className="absolute top-0 right-md -translate-y-1/2 bg-tertiary-container text-on-tertiary-fixed px-3 py-1 rounded-full text-label-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> MAIS POPULAR
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-sm">Pro</h3>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-headline-lg font-bold text-primary">R$ 1.290</span>
                <span className="text-on-surface-variant text-body-md">/mês</span>
              </div>
              <p className="text-on-surface-variant mb-lg font-body-md">Até 500 matrizes com IA avançada.</p>
              <ul className="space-y-sm mb-xl flex-grow">
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Acasalamento IA Ilimitado</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Módulo Beef on Dairy</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Relatórios de Consanguinidade</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Suporte prioritário 24/7</span>
                </li>
              </ul>
              <Link to="/solicitar" className="w-full py-md bg-primary text-white rounded-xl font-label-md hover:brightness-125 transition-all text-center block mt-auto">
                Assinar Agora
              </Link>
            </div>
            {/* Plan 4 */}
            <div className="glass-card pricing-card p-lg rounded-2xl flex flex-col reveal" style={{ transitionDelay: '300ms' }}>
              <h3 className="font-headline-md text-headline-md text-primary mb-sm">Consultoria</h3>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-headline-lg font-bold text-primary">Sob Consulta</span>
              </div>
              <p className="text-on-surface-variant mb-lg font-body-md">Projetos customizados para grandes grupos.</p>
              <ul className="space-y-sm mb-xl flex-grow">
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Onboarding presencial</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>Auditoria genética anual</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-on-surface-variant">
                  <Check className="text-[#1E7E34] w-4 h-4 shrink-0" />
                  <span>API White-label</span>
                </li>
              </ul>
              <Link to="/solicitar" className="w-full py-md border border-primary text-primary rounded-xl font-label-md hover:bg-primary hover:text-white transition-all text-center block mt-auto">
                Falar com Consultor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Preview Gallery */}
      <section id="depoimentos" className="py-xl bg-surface-container overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">Explore nossa Interface</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
              Uma plataforma robusta desenhada para simplificar a gestão genética complexa com dados reais.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter reveal">
            {/* Screen 1 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg aspect-video cursor-pointer bg-[#002444]">
              <img
                alt="Gerenciar Rebanho"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                src="/images/dashboard-gerenciar-rebanho.png"
              />
              <div className="absolute inset-0 bg-primary/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-md text-center">
                <h4 className="text-white font-headline-md mb-2">Gerenciar Rebanho</h4>
                <p className="text-white/80 text-body-md">Visão detalhada de fêmeas cadastradas, filtragem por lactação, gINB e definição automática de lotes.</p>
              </div>
            </div>
            {/* Screen 2 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg aspect-video cursor-pointer bg-[#002444]">
              <img
                alt="Margem Líquida Anual"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                src="/images/dashboard-margem-liquida.png"
              />
              <div className="absolute inset-0 bg-primary/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-md text-center">
                <h4 className="text-white font-headline-md mb-2">Margem Líquida Anual</h4>
                <p className="text-white/80 text-body-md">Gráfico comparativo de rentabilidade e detalhamento completo de custos e receitas do Beef on Dairy.</p>
              </div>
            </div>
            {/* Screen 3 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg aspect-video cursor-pointer bg-[#002444]">
              <img
                alt="Matching de Touros"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                src="/images/dashboard-matching-touros.png"
              />
              <div className="absolute inset-0 bg-primary/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-md text-center">
                <h4 className="text-white font-headline-md mb-2">Matching de Touros</h4>
                <p className="text-white/80 text-body-md">Recomendação automatizada de touros acoplada por mérito genético individual (GTPI, NM$, inbreeding).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-xl bg-primary text-white">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
            <div className="reveal">
              <h2 className="font-headline-xl text-headline-xl mb-md">Pronto para liderar a próxima revolução genética?</h2>
              <p className="font-body-lg text-body-lg text-white/80 mb-lg">
                Nossa equipe técnica está pronta para analisar seu rebanho e propor a melhor estratégia de crescimento.
              </p>
              <div className="space-y-md">
                <div className="flex items-center gap-md">
                  <Mail className="text-tertiary-container" />
                  <span className="font-body-md">contato@genefy.com.br</span>
                </div>
                <div className="flex items-center gap-md">
                  <Phone className="text-tertiary-container" />
                  <span className="font-body-md">+55 (34) 99876-5432</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 p-lg rounded-2xl backdrop-blur-md border border-white/10 reveal" style={{ transitionDelay: '200ms' }}>
              <form onSubmit={handleContactSubmit} className="space-y-md text-left">
                <div>
                  <label className="block text-label-sm font-label-sm mb-xs text-white/60">Nome Completo</label>
                  <input
                    id="contact-nome"
                    required
                    className="w-full bg-white/10 border-white/20 rounded-lg py-md px-md text-white focus:ring-tertiary-container focus:border-tertiary-container"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm mb-xs text-white/60">E-mail Corporativo</label>
                  <input
                    id="contact-email"
                    required
                    className="w-full bg-white/10 border-white/20 rounded-lg py-md px-md text-white focus:ring-tertiary-container focus:border-tertiary-container"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm mb-xs text-white/60">Tamanho do Rebanho</label>
                  <select
                    id="contact-rebanho"
                    className="w-full bg-white/10 border-white/20 rounded-lg py-md px-md text-white focus:ring-tertiary-container focus:border-tertiary-container"
                  >
                    <option className="bg-primary" value="Até 100 animais">Até 100 animais</option>
                    <option className="bg-primary" value="100 a 500 animais">100 a 500 animais</option>
                    <option className="bg-primary" value="Acima de 500 animais">Acima de 500 animais</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#1E7E34] text-white py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all cursor-pointer">
                  Solicitar Consultoria Gratuita
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary w-full py-xl text-on-primary border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
          <div className="md:col-span-4 mb-lg md:mb-0">
            <div className="text-headline-md font-headline-md text-on-primary mb-md font-bold">Genefy</div>
            <p className="text-on-primary/70 font-body-md text-body-md max-w-xs">
              Elevando a pecuária através de dados genômicos e inteligência de precisão.
            </p>
          </div>
          <div className="md:col-span-2">
            <h5 className="font-label-md text-label-md mb-md font-bold">Produto</h5>
            <ul className="space-y-sm">
              <li><button onClick={() => handleScroll('como-funciona')} className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all cursor-pointer text-left">Genética</button></li>
              <li><button onClick={() => handleScroll('depoimentos')} className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all cursor-pointer text-left">Resultados</button></li>
              <li><button onClick={() => handleScroll('beef-on-dairy')} className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all cursor-pointer text-left">Metodologia</button></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h5 className="font-label-md text-label-md mb-md font-bold">Empresa</h5>
            <ul className="space-y-sm">
              <li><button onClick={() => handleScroll('depoimentos')} className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all cursor-pointer text-left">Sobre</button></li>
              <li><button onClick={() => handleScroll('contato')} className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all cursor-pointer text-left">Contato</button></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h5 className="font-label-md text-label-md mb-md font-bold">Legal</h5>
            <ul className="space-y-sm">
              <li><a className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all" href="#">Privacidade</a></li>
              <li><a className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all" href="#">Termos</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h5 className="font-label-md text-label-md mb-md font-bold">Social</h5>
            <div className="flex gap-md">
              <a className="text-on-primary/70 hover:text-secondary-fixed" href="#" aria-label="Linkedin"><Linkedin className="w-6 h-6" /></a>
              <a className="text-on-primary/70 hover:text-secondary-fixed" href="#" aria-label="Instagram"><Instagram className="w-6 h-6" /></a>
            </div>
          </div>
          <div className="md:col-span-12 border-t border-white/10 mt-xl pt-lg flex flex-col md:flex-row justify-between items-center gap-md">
            <p className="text-on-primary/50 text-label-sm font-label-sm">
              © 2026 Genefy. Todos os direitos reservados. Precisão genômica para o setor pecuário.
            </p>
            <div className="flex gap-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-label-sm font-label-sm text-on-primary/50">Sistemas operacionais</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
