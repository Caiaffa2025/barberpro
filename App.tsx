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
  Calendar as CalendarIcon,
  UserCheck,
  CheckCircle2,
  Sparkles
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

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

const getQuickDays = () => {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    let title = `${day}/${month}`;
    let subtitle = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
    if (i === 0) subtitle = 'HOJE';
    if (i === 1) subtitle = 'AMANHÃ';
    
    days.push({ dateStr, title, subtitle });
  }
  return days;
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest ${
      active 
      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black' 
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
    <div className="bg-slate-900 p-5 sm:p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center shadow-xl hover:border-slate-700 transition-colors group">
      <div>
        <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest group-hover:text-slate-400 transition-colors">{label}</p>
        <h4 className="text-xl sm:text-2xl md:text-3xl font-black italic text-white leading-none tracking-tighter">{value}</h4>
      </div>
      <div className={`p-3.5 sm:p-4 rounded-2xl border ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
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

  // Booking form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingServiceId, setBookingServiceId] = useState('');
  const [bookingMemberId, setBookingMemberId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Sync Services with Firestore Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'services'),
      async (snapshot) => {
        if (snapshot.empty) {
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
        loadedBookings.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
        setBookings(loadedBookings);
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

  const openBookingView = (member?: TeamMember) => {
    setPreselectedMember(member || null);
    if (member) setBookingMemberId(member.id);
    else setBookingMemberId('');
    if (services.length > 0 && !bookingServiceId) {
      setBookingServiceId(services[0].id);
    }
    setActiveView('client-booking');
  };

  const revenue = bookings.reduce((a, c) => a + (services.find(s => s.id === c.serviceId)?.price || 0), 0);

  if (activeView === 'landing') return (
    <LandingPage 
      services={services.length > 0 ? services : INITIAL_SERVICES} 
      team={team.length > 0 ? team : INITIAL_TEAM} 
      onBookNow={() => openBookingView()} 
      onBookWithMember={(member) => openBookingView(member)}
      onAdminAccess={() => setActiveView('login')} 
    />
  );

  if (activeView === 'success-feedback') return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 md:p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500 my-auto box-border">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <Check size={36} className="text-green-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mb-3">RESERVA <span className="text-amber-500">CONCLUÍDA</span></h2>
        <p className="text-slate-400 font-medium mb-8 uppercase text-xs md:text-sm tracking-widest leading-relaxed">Seu agendamento foi gravado no banco de dados com sucesso. Envie a confirmação:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button onClick={triggerWhatsApp} className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-[#25D366] text-white font-black rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl text-xs sm:text-sm"><MessageSquare size={18} /> WhatsApp</button>
          <button onClick={triggerSMS} className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-slate-800 text-white font-black rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl text-xs sm:text-sm border border-slate-700"><Smartphone size={18} /> SMS</button>
        </div>
        <button onClick={() => setActiveView('landing')} className="mt-8 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-[0.3em]">Voltar ao Início</button>
      </div>
    </div>
  );

  if (activeView === 'login') return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl my-auto box-border">
        <button onClick={() => setActiveView('landing')} className="text-slate-500 mb-6 flex items-center gap-2 uppercase font-black text-[10px] tracking-widest hover:text-white transition-colors"><ArrowLeft size={16}/> Sair</button>
        <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter text-center mb-8 leading-none">Acesso <span className="text-amber-500">Master</span></h2>
        <form onSubmit={e => {
          e.preventDefault();
          if (new FormData(e.currentTarget).get('password') === "1966") setActiveView('dashboard');
          else alert("Senha incorreta.");
        }} className="space-y-4">
          <input name="password" type="password" placeholder="SENHA" required className="w-full bg-slate-800 border border-slate-700 text-white p-4 sm:p-5 rounded-2xl outline-none focus:border-amber-500 transition-all text-center text-lg tracking-[0.5em]" />
          <button type="submit" className="w-full py-4 sm:py-5 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all text-xs sm:text-sm">Entrar</button>
        </form>
      </div>
    </div>
  );

  if (activeView === 'client-booking') {
    const selectedService = services.find(s => s.id === bookingServiceId) || services[0];
    const selectedMember = team.find(m => m.id === (preselectedMember?.id || bookingMemberId));
    const quickDays = getQuickDays();

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!bookingName.trim()) return alert("Por favor, informe seu nome.");
      if (!selectedService) return alert("Por favor, selecione um serviço.");
      if (!selectedDate) return alert("Por favor, selecione a data.");
      if (!selectedTime) return alert("Por favor, selecione o horário.");

      handleBookingConfirm({
        id: `b${Date.now()}`,
        clientName: bookingName,
        clientEmail: bookingEmail || 'cliente@barberpro.com',
        serviceId: selectedService.id,
        memberId: preselectedMember?.id || bookingMemberId || '',
        date: selectedDate,
        time: selectedTime,
        status: 'pending'
      });
    };

    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start py-6 px-3 sm:px-6">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6 overflow-x-hidden box-border my-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <button 
              type="button"
              onClick={() => { setActiveView('landing'); setPreselectedMember(null); }} 
              className="text-slate-400 hover:text-white flex items-center gap-2 uppercase font-black text-xs tracking-wider transition-colors bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 shrink-0"
            >
              <ArrowLeft size={16}/> Voltar
            </button>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">Reserva Rápida</span>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter leading-none">AGENDAR <span className="text-amber-500">HORÁRIO</span></h2>
            </div>
          </div>

          {preselectedMember && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3">
              <img src={preselectedMember.image} alt={preselectedMember.name} className="w-10 h-10 rounded-xl object-cover border border-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 block">Atendimento Exclusivo</span>
                <p className="text-xs font-black uppercase text-white truncate">{preselectedMember.name} ({preselectedMember.role})</p>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* 1. SEUS DADOS */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <UserCheck size={16} className="text-amber-500 shrink-0" /> 1. Seus Dados de Contato
              </label>
              <div className="space-y-2.5">
                <input 
                  type="text"
                  value={bookingName}
                  onChange={e => setBookingName(e.target.value)}
                  placeholder="Seu Nome Completo *" 
                  required 
                  className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-medium text-xs sm:text-sm placeholder-slate-500" 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input 
                    type="tel"
                    value={bookingPhone}
                    onChange={e => setBookingPhone(e.target.value)}
                    placeholder="WhatsApp / Celular (Opcional)" 
                    className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-medium text-xs sm:text-sm placeholder-slate-500" 
                  />
                  <input 
                    type="email"
                    value={bookingEmail}
                    onChange={e => setBookingEmail(e.target.value)}
                    placeholder="Seu E-mail (Opcional)" 
                    className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-medium text-xs sm:text-sm placeholder-slate-500" 
                  />
                </div>
              </div>
            </div>

            {/* 2. SELEÇÃO DE SERVIÇO & BARBEIRO */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Scissors size={16} className="text-amber-500 shrink-0" /> 2. Serviço & Profissional
              </label>
              <div className="space-y-2.5">
                <select 
                  value={bookingServiceId} 
                  onChange={e => setBookingServiceId(e.target.value)}
                  required 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-bold text-xs sm:text-sm"
                >
                  <option value="">Selecione o Serviço *</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — R$ {s.price.toFixed(2)} ({s.duration} min)
                    </option>
                  ))}
                </select>

                {!preselectedMember && team.length > 0 && (
                  <select 
                    value={bookingMemberId} 
                    onChange={e => setBookingMemberId(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-bold text-xs sm:text-sm"
                  >
                    <option value="">Selecione o Barbeiro (Qualquer Profissional)</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 3. SELEÇÃO DE DIA (DATA) */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CalendarIcon size={16} className="text-amber-500 shrink-0" /> 3. Selecione o Dia (Data)
              </label>
              
              {/* Carrossel de atalhos rápidos com barra de rolagem horizontal nativa limpa */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 w-full max-w-full">
                {quickDays.map((qd) => {
                  const isSelected = selectedDate === qd.dateStr;
                  return (
                    <button
                      key={qd.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(qd.dateStr)}
                      className={`py-2.5 px-3.5 rounded-2xl border text-center transition-all shrink-0 flex flex-col items-center justify-center min-w-[75px] ${
                        isSelected 
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider">{qd.subtitle}</span>
                      <span className="text-xs font-black italic">{qd.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Seletor Manual de Data */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Ou escolha outra data no calendário:
                </div>
                <input 
                  type="date"
                  value={selectedDate}
                  min={todayStr}
                  onChange={e => setSelectedDate(e.target.value)}
                  required 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-black text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* 4. SELEÇÃO DE HORÁRIO */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Clock size={16} className="text-amber-500 shrink-0" /> 4. Selecione o Horário
              </label>

              {/* Grade de Horários */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2.5 px-1 rounded-xl text-center text-xs font-black transition-all ${
                        isSelected 
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Horário Personalizado */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Ou digite um horário específico:
                </div>
                <input 
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  required 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-slate-800 p-3.5 rounded-2xl text-white outline-none border border-slate-700 focus:border-amber-500 transition-all font-black text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* RESUMO DO AGENDAMENTO */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resumo da Reserva</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <Sparkles size={12} /> Confirmação Imediata
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-white italic truncate">
                {selectedService ? selectedService.name : 'Selecione um serviço'} {selectedService && `(R$ ${selectedService.price.toFixed(2)})`}
              </div>
              <div className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex flex-wrap items-center gap-2">
                <span>📅 {selectedDate.split('-').reverse().join('/')}</span>
                <span>⏰ {selectedTime}</span>
                {selectedMember && <span>💈 {selectedMember.name}</span>}
              </div>
            </div>

            {/* Botão de Envio */}
            <button 
              type="submit" 
              className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> Gravar Agendamento em Tempo Real
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-white overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] lg:hidden"
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[100] w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 sm:p-8 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-10 sm:mb-12">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('landing')}>
                <div className="p-2 bg-amber-500 rounded-xl"><Scissors size={22} className="text-slate-950" /></div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter">BARBER<span className="text-amber-500">PRO</span></h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white"><X size={22}/></button>
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
            <button onClick={() => setActiveView('landing')} className="flex items-center gap-3 p-3.5 text-slate-500 hover:text-red-500 uppercase font-black text-[10px] tracking-widest w-full transition-colors"><LogOut size={18} /> Sair</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col justify-between">
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-800 rounded-xl text-amber-500 border border-slate-700"><Menu size={22} /></button>
          <h1 className="text-lg font-black italic uppercase tracking-tighter">BARBER<span className="text-amber-500">PRO</span></h1>
          <div className="w-10"></div>
        </header>

        <div className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-8 sm:space-y-12 w-full">
          {activeView === 'dashboard' && (
            <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter">GESTÃO <span className="text-amber-500">PRO</span></h2>
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-2xl border border-emerald-500/20 w-fit"><Database size={14} /> <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Banco Gratuito Conectado</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Faturamento" value={`R$ ${revenue.toFixed(2)}`} icon={<DollarSign size={22} />} color="green" />
                <StatCard label="Agendas" value={bookings.length.toString()} icon={<TrendingUp size={22} />} color="amber" />
                <StatCard label="Time" value={team.length.toString()} icon={<Users size={22} />} color="blue" />
                <StatCard label="Serviços" value={services.length.toString()} icon={<Scissors size={22} />} color="indigo" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                  <h3 className="text-base sm:text-lg font-black uppercase italic flex items-center gap-2 text-white"><CalendarDays size={20} className="text-amber-500" /> Próximos Clientes</h3>
                  <div className="grid gap-3 sm:gap-4">
                    {bookings.slice(0, 5).map(b => {
                      const s = services.find(srv => srv.id === b.serviceId);
                      return (
                        <div key={b.id} className="p-3.5 sm:p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-amber-500/30 transition-all">
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-white uppercase italic">{b.clientName}</p>
                            <p className="text-[9px] sm:text-[10px] text-amber-500 font-black uppercase">{s?.name || 'Serviço'} — R$ {s?.price.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-black text-white italic">{b.time}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase">{b.date.split('-').reverse().join('/')}</p>
                          </div>
                        </div>
                      );
                    })}
                    {bookings.length === 0 && <p className="text-slate-600 text-center py-8 uppercase font-black text-xs italic">Sem agendamentos no banco de dados</p>}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                  <h3 className="text-base sm:text-lg font-black uppercase italic flex items-center gap-2 text-white"><Scissors size={20} className="text-amber-500" /> Catálogo Ativo</h3>
                  <div className="grid gap-3 sm:gap-4">
                    {services.slice(0, 6).map(s => (
                      <div key={s.id} className="p-3.5 sm:p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white uppercase italic">{s.name}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase">{s.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-black text-white italic">R$ {s.price.toFixed(2)}</p>
                          <p className="text-[9px] sm:text-[10px] text-amber-500 font-bold uppercase"><Clock size={11} className="inline mr-1 text-amber-500" /> {s.duration} MIN</p>
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
            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter">TIME <span className="text-amber-500">MESTRES</span></h2>
                <button onClick={() => { resetMemberForm(); }} className="px-6 py-3 bg-amber-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest">Novo Mestre</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] h-fit">
                  <form onSubmit={handleSaveMember} className="space-y-4 sm:space-y-5">
                    <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nome" required className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm" />
                    <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Cargo / Título (ex: Master Barber)" className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm" />
                    <input value={newMemberSpecialty} onChange={e => setNewMemberSpecialty(e.target.value)} placeholder="Especialidade (ex: Cortes Clássicos)" className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm" />
                    <label className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-xl text-slate-400 border border-dashed border-slate-700 hover:border-amber-500 cursor-pointer flex items-center justify-center gap-2">
                      <Upload size={18} /> <span className="text-[10px] font-black uppercase">FOTO</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {newMemberImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-500">
                        <img src={newMemberImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button type="submit" className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-xl uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all text-xs">{editingMemberId ? 'Salvar em Tempo Real' : 'Cadastrar no Banco'}</button>
                  </form>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {team.map(m => (
                    <div key={m.id} className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center gap-4 sm:gap-6 group hover:border-amber-500/50 transition-all">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                        {m.image ? <img src={m.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={m.name} /> : <ImageIcon size={24} className="text-slate-600 m-auto" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-xl font-black italic uppercase text-white truncate">{m.name}</h4>
                        <p className="text-amber-500 text-[10px] font-black uppercase">{m.role}</p>
                        <p className="text-slate-500 text-[10px] font-medium uppercase mb-3 truncate">{m.specialty}</p>
                        <div className="flex gap-2">
                          <button onClick={() => startEditingMember(m)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white"><Pencil size={14}/></button>
                          <button onClick={() => deleteMember(m.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {team.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-600 font-black uppercase italic text-xs">Nenhum barbeiro cadastrado</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'services' && (
            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter">CATÁLOGO <span className="text-amber-500">PRO</span></h2>
                <button onClick={resetForm} className="px-6 py-3.5 bg-amber-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 shadow-xl"><Plus size={16} className="inline mr-1.5"/> Novo Serviço</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border bg-slate-900 border-slate-800 h-fit lg:sticky lg:top-10">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest">{editingServiceId ? 'Editar' : 'Cadastrar'}</h3>
                  <form onSubmit={handleSaveService} className="space-y-4 sm:space-y-5">
                    <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Nome do Serviço" required className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm" />
                    <select value={newServiceCategory} onChange={e => setNewServiceCategory(e.target.value)} className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} placeholder="Preço (R$)" className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm" />
                      <input type="number" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} placeholder="Duração (min)" className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 text-xs sm:text-sm" />
                    </div>
                    <textarea value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} rows={3} placeholder="Descrição curta..." className="w-full bg-slate-800 p-3.5 sm:p-4 rounded-2xl text-white outline-none border border-transparent focus:border-amber-500 resize-none text-xs sm:text-sm" />
                    <button type="submit" className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest hover:bg-amber-400 shadow-xl text-xs">Salvar no Banco Gratuito</button>
                  </form>
                </div>
                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                  {services.map(s => (
                    <div key={s.id} className="p-5 sm:p-6 rounded-[2rem] border bg-slate-900 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                      <div className="flex-1">
                        <span className="text-[9px] font-black uppercase text-amber-500 mb-1 block">{s.category}</span>
                        <h4 className="text-xl sm:text-2xl font-black italic uppercase text-white mb-1">{s.name}</h4>
                        <p className="text-slate-500 text-xs sm:text-sm line-clamp-1 italic">{s.description}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xl sm:text-2xl font-black text-white italic">R$ {s.price.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase"><Clock size={11} className="inline mr-1 text-amber-500" /> {s.duration} MIN</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditingService(s)} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white"><Pencil size={16}/></button>
                          <button onClick={() => deleteService(s.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="py-12 text-center text-slate-600 font-black uppercase italic text-xs">Nenhum serviço no banco de dados</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'bookings' && (
            <div className="space-y-8 sm:space-y-10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter">AGENDA <span className="text-amber-500">PRO</span></h2>
              <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[650px]">
                    <thead className="bg-slate-950/50 border-b border-slate-800">
                      <tr>
                        <th className="p-5 sm:p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Cliente</th>
                        <th className="p-5 sm:p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Serviço</th>
                        <th className="p-5 sm:p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Valor</th>
                        <th className="p-5 sm:p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Data & Hora</th>
                        <th className="p-5 sm:p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {bookings.map(b => {
                        const s = services.find(srv => srv.id === b.serviceId);
                        return (
                          <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-5 sm:p-6 font-bold uppercase italic text-white text-xs sm:text-sm">{b.clientName}</td>
                            <td className="p-5 sm:p-6 text-amber-500 font-black uppercase text-xs sm:text-sm">{s?.name || 'Serviço Personalizado'}</td>
                            <td className="p-5 sm:p-6 text-white font-black italic text-xs sm:text-sm">R$ {s?.price.toFixed(2) || '0.00'}</td>
                            <td className="p-5 sm:p-6 text-slate-400 font-medium italic text-xs sm:text-sm">{b.date.split('-').reverse().join('/')} às {b.time}</td>
                            <td className="p-5 sm:p-6 text-right">
                              <button onClick={() => deleteBooking(b.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                      {bookings.length === 0 && <tr><td colSpan={5} className="p-16 text-center text-slate-600 font-black uppercase italic text-xs">Nenhum agendamento gravado</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="p-6 border-t border-slate-900 text-center bg-slate-950 mt-auto">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-amber-500">Desenvolvimento Agencia Stc Mobile / Sydney Caiaffa. 11 98493-7529.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
