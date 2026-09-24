import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Scissors, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Clock, 
  DollarSign,
  Menu,
  X,
  ArrowLeft,
  Check,
  LogOut,
  TrendingUp,
  Pencil,
  Users,
  Image as ImageIcon,
  Upload,
  Database,
  MessageSquare,
  Smartphone,
  CloudCheck
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Service, Booking, ViewType, TeamMember } from './types';
import { INITIAL_SERVICES, INITIAL_BOOKINGS, CATEGORIES, INITIAL_TEAM } from './constants';
import LandingPage from './LandingPage';

const playSuccessSound = () => {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  } catch (e) {}
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest ${
      active 
      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon} <span className="flex-1 text-left">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color = "amber" }: any) => {
  const colors: any = {
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    green: 'text-green-500 bg-green-500/10 border-green-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
  };
  return (
    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center shadow-xl hover:border-slate-700 transition-colors group">
      <div>
        <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest group-hover:text-slate-400 transition-colors">{label}</p>
        <h4 className="text-2xl md:text-3xl font-black italic text-white leading-none tracking-tighter">{value}</h4>
      </div>
      <div className={`p-4 rounded-2xl border ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType | 'success-feedback'>('landing');
  const [lastBooking, setLastBooking] = useState<{b: Booking, s: Service | undefined} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preselectedMember, setPreselectedMember] = useState<TeamMember | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Sync Services with Firestore Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'services'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed default services into Firestore if database is empty
          try {
            for (const s of INITIAL_SERVICES) {
              await setDoc(doc(db, 'services', s.id), s);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'services');
          }
        } else {
          const loadedServices: Service[] = [];
          snapshot.forEach((docSnap) => {
            loadedServices.push({ id: docSnap.id, ...docSnap.data() } as Service);
          });
          setServices(loadedServices);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'services')
    );
    return () => unsubscribe();
  }, []);

  // Sync Team with Firestore Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'team'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed default team members into Firestore if empty
          try {
            for (const t of INITIAL_TEAM) {
              await setDoc(doc(db, 'team', t.id), t);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'team');
          }
        } else {
          const loadedTeam: TeamMember[] = [];
          snapshot.forEach((docSnap) => {
            loadedTeam.push({ id: docSnap.id, ...docSnap.data() } as TeamMember);
          });
          setTeam(loadedTeam);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'team')
    );
    return () => unsubscribe();
  }, []);

  // Sync Bookings with Firestore Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const loadedBookings: Booking[] = [];
        snapshot.forEach((docSnap) => {
          loadedBookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });
        // Sort bookings by date and time descending or ascending
        loadedBookings.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
        setBookings(loadedBookings);
        setIsDataLoaded(true);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'bookings')
    );
    return () => unsubscribe();
  }, []);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState(CATEGORIES[0]);
  const [newServicePrice, setNewServicePrice] = useState("50");
  const [newServiceDuration, setNewServiceDuration] = useState("45");
  const [newServiceDesc, setNewServiceDesc] = useState("");

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberImage, setNewMemberImage] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberSpecialty, setNewMemberSpecialty] = useState("");

  const handleBookingConfirm = async (b: Booking) => {
    const service = services.find(s => s.id === b.serviceId);
    try {
      await setDoc(doc(db, 'bookings', b.id), b);
      playSuccessSound();
      setLastBooking({ b, s: service });
      setActiveView('success-feedback');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookings/${b.id}`);
    }
  };

  const getNotificationMessage = (b: Booking, s: Service | undefined) => {
    return `💈 NOVO AGENDAMENTO BARBERPRO!\n\n👤 Cliente: ${b.clientName}\n✂️ Serviço: ${s?.name}\n📅 Data: ${b.date.split('-').reverse().join('/')}\n⏰ Horário: ${b.time}\n💰 Valor: R$ ${s?.price.toFixed(2)}`;
  };

  const triggerWhatsApp = () => {
    if (!lastBooking) return;
    const msg = encodeURIComponent(getNotificationMessage(lastBooking.b, lastBooking.s));
    window.open(`https://api.whatsapp.com/send?phone=5511984937529&text=${msg}`, '_blank');
  };

  const triggerSMS = () => {
    if (!lastBooking) return;
    const msg = encodeURIComponent(getNotificationMessage(lastBooking.b, lastBooking.s));
    window.location.href = `sms:+5511984937529?body=${msg}`;
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = editingServiceId || `s${Date.now()}`;
    const service: Service = {
      id: serviceId,
      name: newServiceName,
      category: newServiceCategory,
      price: parseFloat(newServicePrice) || 0,
      duration: parseInt(newServiceDuration) || 30,
      description: newServiceDesc
    };

    try {
      await setDoc(doc(db, 'services', serviceId), service);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `services/${serviceId}`);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberImage) return alert("Selecione uma foto para o mestre.");
    
    const memberId = editingMemberId || `t${Date.now()}`;
    const member: TeamMember = {
      id: memberId,
      name: newMemberName,
      image: newMemberImage,
      role: newMemberRole || "Barbeiro",
      specialty: newMemberSpecialty || "Cortes Modernos"
    };

    try {
      await setDoc(doc(db, 'team', memberId), member);
      resetMemberForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `team/${memberId}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewMemberImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingServiceId(null); setNewServiceName(""); setNewServiceCategory(CATEGORIES[0]);
    setNewServicePrice("50"); setNewServiceDuration("45"); setNewServiceDesc("");
  };

  const resetMemberForm = () => {
    setEditingMemberId(null); setNewMemberName(""); setNewMemberImage("");
    setNewMemberRole(""); setNewMemberSpecialty("");
  };

  const startEditingMember = (m: TeamMember) => {
    setEditingMemberId(m.id); setNewMemberName(m.name); setNewMemberImage(m.image);
    setNewMemberRole(m.role); setNewMemberSpecialty(m.specialty);
  };

  const deleteMember = async (id: string) => {
    if (confirm("Remover este mestre do banco de dados?")) {
      try {
        await deleteDoc(doc(db, 'team', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `team/${id}`);
      }
    }
  };

  const deleteService = async (id: string) => {
    if (confirm("Remover este serviço do banco de dados?")) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
      }
    }
  };

  const deleteBooking = async (id: string) => {
    if (confirm("Remover este agendamento do banco de dados?")) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
      }
    }
  };

  const startEditingService = (s: Service) => {
    setEditingServiceId(s.id); setNewServiceName(s.name); setNewServiceCategory(s.category);
    setNewServicePrice(s.price.toString()); setNewServiceDuration(s.duration.toString());
    setNewServiceDesc(s.description); setActiveView('services');
  };

  const revenue = bookings.reduce((a, c) => a + (services.find(s => s.id === c.serviceId)?.price || 0), 0);

  if (activeView === 'landing') return (
    <LandingPage 
      services={services.length > 0 ? services : INITIAL_SERVICES} 
      team={team.length > 0 ? team : INITIAL_TEAM} 
      onBookNow={() => { setPreselectedMember(null); setActiveView('client-booking'); }} 
      onBookWithMember={(member) => { setPreselectedMember(member); setActiveView('client-booking'); }}
      onAdminAccess={() => setActiveView('login')} 
    />
  );

  if (activeView === 'success-feedback') return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
          <Check size={48} className="text-green-500" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">RESERVA <span className="text-amber-500">CONCLUÍDA</span></h2>
        <p className="text-slate-400 font-medium mb-12 uppercase text-xs md:text-sm tracking-widest">Seu agendamento foi gravado no banco de dados em tempo real. Envie a confirmação:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={triggerWhatsApp} className="flex items-center justify-center gap-3 py-5 bg-[#25D366] text-white font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all shadow-xl text-sm"><MessageSquare size={20} /> WhatsApp</button>
          <button onClick={triggerSMS} className="flex items-center justify-center gap-3 py-5 bg-slate-800 text-white font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all shadow-xl text-sm border border-slate-700"><Smartphone size={20} /> SMS</button>
        </div>
        <button onClick={() => setActiveView('landing')} className="mt-12 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-[0.3em]">Voltar ao Início</button>
      </div>
    </div>
  );

  if (activeView === 'login') return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
        <button onClick={() => setActiveView('landing')} className="text-slate-500 mb-8 flex items-center gap-2 uppercase font-black text-[10px] tracking-widest hover:text-white transition-colors"><ArrowLeft size={16}/> Sair</button>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center mb-10 leading-none">Acesso <span className="text-amber-500">Master</span></h2>
        <form onSubmit={e => {
          e.preventDefault();
          if (new FormData(e.currentTarget).get('password') === "1966") setActiveView('dashboard');
          else alert("Senha incorreta.");
        }} className="space-y-4">
          <input name="password" type="password" placeholder="SENHA" required className="w-full bg-slate-800 border border-slate-700 text-white p-5 rounded-2xl outline-none focus:border-amber-500 transition-all text-center text-lg tracking-[0.5em]" />
          <button type="submit" className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all">Entrar</button>
        </form>
      </div>
    </div>
  );

  if (activeView === 'client-booking') return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button onClick={() => { setActiveView('landing'); setPreselectedMember(null); }} className="text-slate-500 mb-8 flex items-center gap-2 uppercase font-black text-[10px] tracking-widest hover:text-white transition-colors"><ArrowLeft size={16}/> Voltar</button>
        <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase mb-2 tracking-tighter leading-none">Agendar <span className="text-amber-500">Horário</span></h2>
        {preselectedMember && (
          <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-4">Mestre selecionado: {preselectedMember.name}</p>
        )}
        <form onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          handleBookingConfirm({
            id: `b${Date.now()}`, 
            clientName: fd.get('name') as string, 
            clientEmail: fd.get('email') as string,
            serviceId: fd.get('service') as string, 
            memberId: preselectedMember?.id || fd.get('member') as string || '',
            date: fd.get('date') as string, 
            time: fd.get('time') as string,
            status: 'pending'
          });
        }} className="space-y-4 md:space-y-5">
          <input name="name" placeholder="Nome Completo" required className="w-full bg-slate-800 p-4 md:p-5 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 transition-all" />
          <input name="email" type="email" placeholder="E-mail" required className="w-full bg-slate-800 p-4 md:p-5 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 transition-all" />
          <select name="service" required className="w-full bg-slate-800 p-4 md:p-5 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 transition-all">
            <option value="">Selecione o Serviço</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} — R$ {s.price.toFixed(2)}</option>)}
          </select>
          {!preselectedMember && team.length > 0 && (
            <select name="member" className="w-full bg-slate-800 p-4 md:p-5 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 transition-all">
              <option value="">Selecione o Barbeiro (Opcional)</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-4">
            <input name="date" type="date" required className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 transition-all" />
            <input name="time" type="time" required className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 transition-all" />
          </div>
          <button type="submit" className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl transform active:scale-95 transition-all">Finalizar e Notificar</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-white overflow-hidden">
      <aside className={`fixed lg:static inset-y-0 left-0 z-[100] w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('landing')}>
                <div className="p-2 bg-amber-500 rounded-xl"><Scissors size={22} className="text-slate-950" /></div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter">BARBER<span className="text-amber-500">PRO</span></h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500"><X size={24}/></button>
            </div>
            <nav className="space-y-2 flex-1">
              <SidebarLink icon={<LayoutDashboard size={18} />} label="Painel" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} />
              <SidebarLink icon={<Scissors size={18} />} label="Serviços" active={activeView === 'services'} onClick={() => { setActiveView('services'); setIsSidebarOpen(false); }} />
              <SidebarLink icon={<Users size={18} />} label="Equipe" active={activeView === 'team'} onClick={() => { setActiveView('team'); setIsSidebarOpen(false); }} />
              <SidebarLink icon={<CalendarDays size={18} />} label="Agenda" active={activeView === 'bookings'} onClick={() => { setActiveView('bookings'); setIsSidebarOpen(false); }} />
            </nav>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-emerald-400">
              <Database size={14} className="shrink-0 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider">Firestore Cloud Ativo</span>
            </div>
            <button onClick={() => setActiveView('landing')} className="flex items-center gap-3 p-4 text-slate-500 hover:text-red-500 uppercase font-black text-[10px] tracking-widest w-full"><LogOut size={18} /> Sair</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col justify-between">
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-800 rounded-xl text-amber-500"><Menu size={24} /></button>
          <h1 className="text-lg font-black italic uppercase tracking-tighter">BARBER<span className="text-amber-500">PRO</span></h1>
          <div className="w-10"></div>
        </header>

        <div className="p-5 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-12 w-full">
          {activeView === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">GESTÃO <span className="text-amber-500">PRO</span></h2>
                <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20"><Database size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Banco Gratuito Conectado</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Faturamento" value={`R$ ${revenue.toFixed(2)}`} icon={<DollarSign size={24} />} color="green" />
                <StatCard label="Agendas" value={bookings.length.toString()} icon={<TrendingUp size={24} />} color="amber" />
                <StatCard label="Time" value={team.length.toString()} icon={<Users size={24} />} color="blue" />
                <StatCard label="Serviços" value={services.length.toString()} icon={<Scissors size={24} />} color="indigo" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                  <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-white"><CalendarDays size={20} className="text-amber-500" /> Próximos Clientes</h3>
                  <div className="grid gap-4">
                    {bookings.slice(0, 5).map(b => {
                      const s = services.find(srv => srv.id === b.serviceId);
                      return (
                        <div key={b.id} className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-amber-500/30 transition-all">
                          <div>
                            <p className="text-sm font-bold text-white uppercase italic">{b.clientName}</p>
                            <p className="text-[10px] text-amber-500 font-black uppercase">{s?.name || 'Serviço'} — R$ {s?.price.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white italic">{b.time}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{b.date.split('-').reverse().join('/')}</p>
                          </div>
                        </div>
                      );
                    })}
                    {bookings.length === 0 && <p className="text-slate-600 text-center py-10 uppercase font-black text-xs italic">Sem agendamentos no banco de dados</p>}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                  <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-white"><Scissors size={20} className="text-amber-500" /> Catálogo Ativo</h3>
                  <div className="grid gap-4">
                    {services.slice(0, 6).map(s => (
                      <div key={s.id} className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                        <div>
                          <p className="text-sm font-bold text-white uppercase italic">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase">{s.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white italic">R$ {s.price.toFixed(2)}</p>
                          <p className="text-[10px] text-amber-500 font-bold uppercase">{s.duration} min</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setActiveView('services')} className="w-full py-3 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Ver todos</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'team' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">TIME <span className="text-amber-500">MESTRES</span></h2>
                <button onClick={() => { resetMemberForm(); }} className="px-6 py-3 bg-amber-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest">Novo Mestre</button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] h-fit">
                  <form onSubmit={handleSaveMember} className="space-y-5">
                    <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nome" required className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none border border-transparent focus:border-amber-500" />
                    <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Cargo / Título (ex: Master Barber)" className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none border border-transparent focus:border-amber-500" />
                    <input value={newMemberSpecialty} onChange={e => setNewMemberSpecialty(e.target.value)} placeholder="Especialidade (ex: Cortes Clássicos)" className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none border border-transparent focus:border-amber-500" />
                    <label className="w-full bg-slate-800 p-4 rounded-xl text-slate-400 border border-dashed border-slate-700 hover:border-amber-500 cursor-pointer flex items-center justify-center gap-2">
                      <Upload size={18} /> <span className="text-[10px] font-black uppercase">FOTO</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {newMemberImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-500">
                        <img src={newMemberImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button type="submit" className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-xl uppercase tracking-widest hover:bg-amber-400">{editingMemberId ? 'Salvar em Tempo Real' : 'Cadastrar no Banco'}</button>
                  </form>
                </div>
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {team.map(m => (
                    <div key={m.id} className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center gap-6 group hover:border-amber-500/50 transition-all">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                        {m.image ? <img src={m.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={m.name} /> : <ImageIcon size={24} className="text-slate-600 m-auto" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black italic uppercase text-white">{m.name}</h4>
                        <p className="text-amber-500 text-[10px] font-black uppercase">{m.role}</p>
                        <p className="text-slate-500 text-[10px] font-medium uppercase mb-4">{m.specialty}</p>
                        <div className="flex gap-2">
                          <button onClick={() => startEditingMember(m)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white"><Pencil size={14}/></button>
                          <button onClick={() => deleteMember(m.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {team.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-600 font-black uppercase italic">Nenhum barbeiro cadastrado</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'services' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">CATÁLOGO <span className="text-amber-500">PRO</span></h2>
                <button onClick={resetForm} className="px-8 py-4 bg-amber-500 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 shadow-xl"><Plus size={18} className="inline mr-2"/> Novo Serviço</button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="p-8 rounded-[2.5rem] border bg-slate-900 border-slate-800 h-fit sticky top-10">
                  <h3 className="text-[11px] font-black uppercase text-slate-500 mb-8 tracking-widest">{editingServiceId ? 'Editar' : 'Cadastrar'}</h3>
                  <form onSubmit={handleSaveService} className="space-y-5">
                    <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Nome do Serviço" required className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500" />
                    <select value={newServiceCategory} onChange={e => setNewServiceCategory(e.target.value)} className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} placeholder="Preço (R$)" className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500" />
                      <input type="number" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} placeholder="Duração (min)" className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500" />
                    </div>
                    <textarea value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} rows={3} placeholder="Descrição curta..." className="w-full bg-slate-800 p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 resize-none" />
                    <button type="submit" className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest hover:bg-amber-400 shadow-xl">Salvar no Banco Gratuito</button>
                  </form>
                </div>
                <div className="xl:col-span-2 space-y-4">
                  {services.map(s => (
                    <div key={s.id} className="p-6 rounded-[2rem] border bg-slate-900 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/30 transition-all">
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase text-amber-500 mb-1 block">{s.category}</span>
                        <h4 className="text-2xl font-black italic uppercase text-white mb-1">{s.name}</h4>
                        <p className="text-slate-500 text-sm line-clamp-1 italic">{s.description}</p>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-white italic">R$ {s.price.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase"><Clock size={12} className="inline mr-1 text-amber-500" /> {s.duration} MIN</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditingService(s)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white"><Pencil size={18}/></button>
                          <button onClick={() => deleteService(s.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="py-16 text-center text-slate-600 font-black uppercase italic">Nenhum serviço no banco de dados</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'bookings' && (
            <div className="space-y-10">
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">AGENDA <span className="text-amber-500">PRO</span></h2>
              <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-slate-950/50 border-b border-slate-800">
                      <tr>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-widest">Cliente</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-widest">Serviço</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-widest">Valor</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-widest">Data & Hora</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {bookings.map(b => {
                        const s = services.find(srv => srv.id === b.serviceId);
                        return (
                          <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-8 font-bold uppercase italic text-white">{b.clientName}</td>
                            <td className="p-8 text-amber-500 font-black uppercase">{s?.name || 'Serviço Personalizado'}</td>
                            <td className="p-8 text-white font-black italic">R$ {s?.price.toFixed(2) || '0.00'}</td>
                            <td className="p-8 text-slate-400 font-medium italic">{b.date.split('-').reverse().join('/')} às {b.time}</td>
                            <td className="p-8 text-right">
                              <button onClick={() => deleteBooking(b.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                      {bookings.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-black uppercase italic">Nenhum agendamento gravado</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="p-8 border-t border-slate-900 text-center bg-slate-950 mt-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Desenvolvimento Agencia Stc Mobile / Sydney Caiaffa. 11 98493-7529.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
