
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  date: string; // ISO string
  time: string; // "HH:mm"
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export type ViewType = 'landing' | 'client-booking' | 'dashboard' | 'services' | 'bookings' | 'ai-assistant' | 'team' | 'login' | 'register';
