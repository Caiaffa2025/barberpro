
import { Service, Booking, TeamMember } from './types.ts';

export const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Corte Degradê (Fade)',
    description: 'Corte moderno com acabamento perfeito, usando máquinas e tesoura com foco nas laterais.',
    duration: 45,
    price: 50.00,
    category: 'Cabelo'
  },
  {
    id: '2',
    name: 'Barba Terapia',
    description: 'Tratamento completo com toalha quente, óleos essenciais e massagem facial relaxante.',
    duration: 30,
    price: 35.00,
    category: 'Barba'
  },
  {
    id: '3',
    name: 'Combo Premium (Cabelo + Barba)',
    description: 'O serviço completo para renovar o visual com direito a uma bebida e finalização premium.',
    duration: 80,
    price: 75.00,
    category: 'Combos'
  },
  {
    id: '4',
    name: 'Corte Social',
    description: 'Corte clássico feito inteiramente na tesoura ou com acabamento mais tradicional.',
    duration: 40,
    price: 45.00,
    category: 'Cabelo'
  },
  {
    id: '5',
    name: 'Sobrancelha na Navalha',
    description: 'Design e limpeza da sobrancelha utilizando navalha para um acabamento limpo.',
    duration: 15,
    price: 20.00,
    category: 'Estética'
  },
  {
    id: '6',
    name: 'Limpeza de Pele Express',
    description: 'Remoção de impurezas e hidratação rápida para manter o rosto revigorado.',
    duration: 25,
    price: 40.00,
    category: 'Estética'
  },
  {
    id: '7',
    name: 'Pigmentação de Barba',
    description: 'Correção de falhas e realce do contorno da barba com tintura especializada.',
    duration: 35,
    price: 30.00,
    category: 'Barba'
  },
  {
    id: '8',
    name: 'Corte Infantil',
    description: 'Atendimento especial para crianças com paciência e agilidade.',
    duration: 35,
    price: 40.00,
    category: 'Infantil'
  }
];

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 't1',
    name: 'Ricardo Silva',
    role: 'Master Barber',
    specialty: 'Cortes Clássicos & Fade',
    image: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=2080&auto=format&fit=crop'
  },
  {
    id: 't2',
    name: 'Lucas Menezes',
    role: 'Grooming Specialist',
    specialty: 'Barba Terapia & Estética',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 't3',
    name: 'André Costa',
    role: 'Hair Stylist',
    specialty: 'Modern Cuts & Coloring',
    image: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?q=80&w=1974&auto=format&fit=crop'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];

export const CATEGORIES = ['Cabelo', 'Barba', 'Combos', 'Estética', 'Infantil', 'Outros'];
