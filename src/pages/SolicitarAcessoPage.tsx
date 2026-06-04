import { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function SolicitarAcessoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [farm, setFarm] = useState('');
  const [state, setState] = useState('');
  const [females, setFemales] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtle parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const bgElement = document.getElementById('biotech-bg');
      if (bgElement) {
        bgElement.style.transform = `translateY(${scrolled * 0.15}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // WhatsApp Mask
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const x = val.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    if (!x) {
      setWhatsapp('');
      return;
    }
    const formatted = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    setWhatsapp(formatted);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const text = `Olá Genefy! Gostaria de solicitar acesso à plataforma.
            
*Nome:* ${name}
*Fazenda:* ${farm}
*Estado:* ${state}
*Nº de Fêmeas:* ${females}
*Mensagem:* ${message || 'Tenho interesse na consultoria genética da Genefy.'}`;

    const encodedText = encodeURIComponent(text);
    const whatsappNumber = '5545999999999'; // Commercial number from landing page
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

    // Simulate slight delay for professional feel
    setTimeout(() => {
      window.location.href = whatsappUrl;
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="bg-surface-container-low text-on-surface min-h-screen flex flex-col font-sans">
      {/* Top Navigation Shell */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm h-20">
        <div className="flex justify-between items-center px-margin-desktop h-full max-w-[1440px] mx-auto w-full">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/genefy-logo-dark.png"
              alt="Genefy Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="hidden md:flex gap-gutter items-center">
            <Link to="/#como-funciona" className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
              Genética
            </Link>
            <Link to="/#funcionalidades" className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
              Resultados
            </Link>
            <Link to="/#beef-on-dairy" className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
              Metodologia
            </Link>
            <Link to="/#depoimentos" className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
              Sobre
            </Link>
            <div className="h-6 w-px bg-outline-variant/50 mx-xs"></div>
            <Link to="/solicitar" className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1">
              Solicitar Acesso
            </Link>
            <Link
              to="/login"
              className="bg-primary-container text-on-primary-container px-md py-sm rounded-xl font-label-md text-label-md hover:scale-95 transition-all text-center"
            >
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop flex justify-center items-center">
        <div className="w-full max-w-2xl">
          {/* Premium Form Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_-10px_rgba(27,58,92,0.12)] border border-outline-variant/20 overflow-hidden">
            {/* Scientific Header */}
            <div className="bg-primary p-md md:p-lg text-on-primary relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="font-headline-lg text-headline-lg mb-xs">Solicitar Acesso</h1>
                <p className="font-body-md text-body-md opacity-80 max-w-md">
                  Inicie sua jornada rumo à excelência genética pecuária. Nossa equipe de especialistas entrará em contato em até 24 horas.
                </p>
              </div>
              {/* Decorative Background Element */}
              <div
                id="biotech-bg"
                className="absolute -right-10 -top-10 opacity-10 transition-transform duration-100 ease-out"
                style={{ willChange: 'transform' }}
              >
                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  biotech
                </span>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-md md:p-lg space-y-md" id="leadForm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Name Field */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="name">
                    Nome Completo
                  </label>
                  <input
                    className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all"
                    id="name"
                    name="name"
                    placeholder="Ex: Dr. Roberto Silva"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="email">
                    E-mail Corporativo
                  </label>
                  <input
                    className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all"
                    id="email"
                    name="email"
                    placeholder="roberto@fazenda.com.br"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* WhatsApp Field */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="whatsapp">
                    WhatsApp
                  </label>
                  <input
                    className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all"
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="(00) 00000-0000"
                    required
                    type="text"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                  />
                </div>

                {/* Farm Name Field */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="farm">
                    Nome da Fazenda
                  </label>
                  <input
                    className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all"
                    id="farm"
                    name="farm"
                    placeholder="Fazenda Santa Luzia"
                    required
                    type="text"
                    value={farm}
                    onChange={(e) => setFarm(e.target.value)}
                  />
                </div>

                {/* State Field */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="state">
                    Estado (UF)
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all appearance-none pr-10"
                      id="state"
                      name="state"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option disabled value="">
                        Selecione...
                      </option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>

                {/* Females Count Field */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="females">
                    Número de Fêmeas
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all appearance-none pr-10"
                      id="females"
                      name="females"
                      required
                      value={females}
                      onChange={(e) => setFemales(e.target.value)}
                    >
                      <option disabled value="">
                        Faixa de rebanho...
                      </option>
                      <option value="0-100">Até 100</option>
                      <option value="101-500">101 a 500</option>
                      <option value="501-1000">501 a 1000</option>
                      <option value="1000+">Mais de 1000</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="message">
                  Mensagem (Opcional)
                </label>
                <textarea
                  className="w-full bg-surface-container border border-outline-variant rounded-xl p-sm font-body-md text-body-md input-focus-ring transition-all resize-none"
                  id="message"
                  name="message"
                  placeholder="Descreva seus principais objetivos genéticos..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Submit Action */}
              <div className="pt-sm">
                <button
                  className="w-full bg-primary text-on-primary py-md rounded-xl font-label-md text-label-md flex items-center justify-center gap-base hover:opacity-90 active:scale-[0.98] transition-all group disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                  id="submitBtn"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <span>Solicitar Consultoria Estratégica</span>
                      <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
                <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-sm opacity-60 italic">
                  Seus dados estão protegidos sob nossa política de privacidade de dados genômicos.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="bg-primary dark:bg-primary-container py-xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-margin-desktop max-w-[1440px] mx-auto w-full">
          <div className="md:col-span-4 mb-md md:mb-0">
            <span className="text-headline-md font-headline-md text-on-primary mb-sm block">Genefy</span>
            <p className="text-on-primary/70 font-body-md text-body-md mb-md">
              Precisão genômica para o setor pecuário de alta performance.
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-md">
            <div className="flex flex-col gap-xs">
              <span className="text-secondary-fixed font-bold font-label-sm text-label-sm uppercase mb-xs">Links</span>
              <Link to="/#privacidade" className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all">
                Privacidade
              </Link>
              <Link to="/#termos" className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all">
                Termos
              </Link>
              <Link to="/#contato" className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all">
                Contato
              </Link>
              <Link to="/#suporte" className="text-on-primary/70 font-body-md text-body-md hover:text-secondary-fixed transition-all">
                Suporte
              </Link>
            </div>
          </div>
          <div className="md:col-span-12 border-t border-on-primary/10 pt-md mt-lg">
            <p className="text-on-primary/70 font-label-sm text-label-sm">
              © 2024 Genefy. Todos os direitos reservados. Precisão genômica para o setor pecuário.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
