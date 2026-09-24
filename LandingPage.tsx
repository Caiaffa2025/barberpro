import React from 'react';
import { Scissors, Clock, MapPin, Phone, Instagram, Facebook, ChevronRight, Download, CalendarDays, ChevronDown } from 'lucide-react';
import { Service, TeamMember } from './types';

const TeamCard: React.FC<{ member: TeamMember; onBookWithMember: (member: TeamMember) => void }> = ({ member, onBookWithMember }) => {
  const { name, role, specialty, image } = member;
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mestre_${name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(image, '_blank');
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 transition-all hover:border-amber-500 flex flex-col h-full">
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110"
        />
        <button 
          onClick={handleDownload}
          title="Baixar Foto"
          className="absolute top-6 left-6 p-3 bg-slate-950/80 backdrop-blur-md text-amber-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-amber-500 hover:text-slate-950 shadow-2xl z-20"
        >
          <Download size={20} />
        </button>
      </div>
      <div className="p-8 relative flex-1 flex flex-col">
        <div className="absolute top-0 right-10 -translate-y-1/2 p-4 bg-amber-500 rounded-2xl shadow-xl text-slate-950">
          <Scissors size={20} />
        </div>
        <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">{role}</p>
        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">{name}</h4>
        <p className="text-slate-500 text-[11px] font-medium italic uppercase tracking-widest mb-6">{specialty}</p>
        
        <button 
          onClick={() => onBookWithMember(member)}
          className="mt-auto w-full py-4 bg-slate-800 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-slate-950 transition-all group-hover:shadow-lg"
        >
          <CalendarDays size={14} /> Agendar com {name.split(' ')[0]}
        </button>
      </div>
    </div>
  );
};

interface LandingPageProps {
  services: Service[];
  team: TeamMember[];
  onBookNow: () => void;
  onBookWithMember: (member: TeamMember) => void;
  onAdminAccess: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ services, team, onBookNow, onBookWithMember, onAdminAccess }) => {
  return (
    <div className="bg-slate-950 text-white min-h-screen scroll-smooth selection:bg-amber-500 selection:text-slate-950">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-amber-500 rounded-lg">
              <Scissors size={18} className="text-slate-950 md:w-5 md:h-5" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter italic uppercase leading-none">BARBER<span className="text-amber-500">PRO</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#services" className="hover:text-amber-500 transition-colors">Serviços</a>
            <a href="#team" className="hover:text-amber-500 transition-colors">O Time</a>
            <a href="#contact" className="hover:text-amber-500 transition-colors">Contato</a>
          </div>
          <button 
            onClick={onAdminAccess}
            className="text-[10px] md:text-xs font-black text-slate-500 border border-slate-800 px-4 py-2.5 rounded-full hover:bg-slate-900 transition-all uppercase tracking-widest"
          >
            Acesso Restrito
          </button>
        </div>
      </nav>

      <section className="relative pt-20 min-h-[90dvh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 grayscale scale-105"
            alt="Barbershop Atmosphere"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <p className="text-amber-500 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] mb-6 animate-pulse">ESTILO • TRADIÇÃO • EXCELÊNCIA</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 md:mb-10 leading-tight md:leading-[0.9] italic uppercase tracking-tighter">
            O SEU VISUAL, <br />
            <span className="text-amber-500">NOSSA ARTE.</span>
          </h1>
          <p className="text-sm md:text-lg lg:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Desde 2015 elevando o padrão de cuidados masculinos. <br className="hidden md:block" /> Agende seu horário com os mestres da navalha.
          </p>
          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={onBookNow}
              className="w-full sm:w-auto px-10 md:px-14 py-6 md:py-7 bg-amber-500 text-slate-950 font-black rounded-2xl text-base md:text-xl hover:bg-amber-400 transform hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-4 mx-auto uppercase tracking-[0.1em]"
            >
              RESERVAR AGORA <ChevronRight size={22} />
            </button>
            <div className="animate-subtle-bounce">
              <ChevronDown size={40} className="text-white opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-24 md:py-40 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 md:mb-28 gap-8">
          <div className="max-w-xl">
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Experiência BarberPro</p>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic leading-none">ESCOLHA SEU <span className="text-amber-500">ESTILO</span></h2>
          </div>
          <div className="w-full md:w-32 h-1 bg-amber-500"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {services.map(s => (
            <div key={s.id} className="p-8 md:p-12 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-amber-500 transition-all group relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <div className="flex-1">
                  <span className="text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2 block">{s.category}</span>
                  <h4 className="text-3xl font-black italic uppercase tracking-tight text-white group-hover:text-amber-500 transition-colors leading-none">{s.name}</h4>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-3xl font-black italic text-white leading-none">R$ {s.price.toFixed(2)}</span>
                  <div className="flex items-center justify-start sm:justify-end gap-1.5 text-[10px] font-bold text-slate-500 uppercase mt-2">
                    <Clock size={12} className="text-amber-500" /> {s.duration} min
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 max-w-md">{s.description}</p>
              <button 
                onClick={onBookNow}
                className="w-full sm:w-auto px-8 py-4 border-2 border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 hover:border-white transition-all shadow-lg"
              >
                Agendar este serviço
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="py-24 md:py-40 bg-slate-900/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 md:mb-32">
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Expertise</p>
            <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter">MESTRES DA <span className="text-amber-500">NAVALHA</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {team.map(member => (
              <TeamCard key={member.id} member={member} onBookWithMember={onBookWithMember} />
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="py-24 md:py-40 bg-slate-950 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">BARBER<span className="text-amber-500">PRO</span></h3>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">Referência em estética masculina. Unindo a tradição da barbearia clássica com a sofisticação moderna para o homem contemporâneo.</p>
            <div className="flex gap-4">
              <a href="#" className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-amber-500 transition-all border border-slate-800"><Instagram size={20} /></a>
              <a href="#" className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-amber-500 transition-all border border-slate-800"><Facebook size={20} /></a>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">CONTATO</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium italic">
              <li className="flex items-center gap-3"><MapPin size={16} className="text-amber-500" /> Av. Paulista, 1000 - SP</li>
              <li className="flex items-center gap-3"><Phone size={16} className="text-amber-500" /> (11) 99999-9999</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">HORÁRIOS</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium italic">
              <li className="flex justify-between"><span>Seg - Sex</span> <span className="text-white">09:00 - 20:00</span></li>
              <li className="flex justify-between"><span>Sábado</span> <span className="text-white">08:00 - 18:00</span></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-900 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-700">© 2024 BARBERPRO • TODOS OS DIREITOS RESERVADOS</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;