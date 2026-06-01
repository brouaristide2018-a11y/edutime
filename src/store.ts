import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContractType = 'Temps plein' | 'Vacataire';
export type ProfessorStatus = 'Actif' | 'Inactif';
export type Gender = 'M' | 'F' | 'Autre';

export interface Availability {
  id: string;
  dayOfWeek: number; // 1 (Lundi) - 7 (Dimanche)
  startTime: string;
  endTime: string;
}

export interface Professor {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  specialty: string;
  contractType: ContractType;
  hourlyRate: number;
  status: ProfessorStatus;
  hireDate: string;
  subjectIds: string[];
  availabilities: Availability[];
  userId?: string;
  photoUrl?: string;
}

export type ClassLevel = 'Primaire' | 'Collège' | 'Lycée';
export type ClassStatus = 'Actif' | 'Inactif';

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  level: ClassLevel;
  description?: string;
  capacity?: number;
  mainTeacherId?: string;
  chefDeClasse?: string;
  sousChefDeClasse?: string;
  status: ClassStatus;
  createdAt: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  description: string;
  weeklyHours: number;
  color: string;
  createdAt: string;
}

export interface ClassSubjectProfessor {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  professorId: string;
}

export interface Room {
  id: string;
  schoolId: string;
  name: string;
  capacity: number;
  type: string;
}

export type CourseStatus = 'scheduled' | 'present' | 'absent' | 'late';

export type AttendanceStatus = 'present' | 'retard' | 'absent' | 'remplacement';

export interface Attendance {
  id: string;
  schoolId: string;
  courseId?: string;
  professorId: string;
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: AttendanceStatus;
  replacementProfessorId?: string;
  calculatedHours: number;
  createdAt: string;
  scannedAt?: string;
  validatedByAdmin?: boolean;
}

export type RequestType = 'absence' | 'retard';
export type RequestStatus = 'en attente' | 'approuvé' | 'rejeté';

export interface ProfessorRequest {
  id: string;
  schoolId: string;
  professorId: string;
  type: RequestType;
  date: string; // YYYY-MM-DD
  courseId?: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'Espèces' | 'Mobile Money' | 'Virement';

export interface Payment {
  id: string;
  schoolId: string;
  professorId: string;
  month: string; // YYYY-MM
  amount: number;
  hours: number;
  normalHours?: number;
  overtimeHours?: number;
  missedHours?: number;
  plannedHours?: number;
  status: 'pending' | 'awaiting_approval' | 'paid';
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
}

export interface TimeSlot {
  id: string;
  schoolId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  name?: string;
  type?: 'Cours' | 'Recréation' | 'Après-Midi' | 'Devoir';
}

export interface Course {
  id: string;
  schoolId: string;
  professorId: string;
  professorEmail?: string;
  classId: string;
  subjectId: string;
  roomId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: CourseStatus;
  schoolName?: string;
}

export interface SchoolSubscription {
  id: string;
  schoolId: string;
  planId: string;
  status: 'pending_payment' | 'awaiting_approval' | 'active' | 'expired';
  paymentReference?: string;
  paymentProofUrl?: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  updatedAt: string;
}

export interface PublicSiteConfig {
  logoUrl: string;
  heroBgImages: string[];
  sliderDuration: number;
  heroTitle: string;
  heroSubtitle: string;
}

export interface PlatformSettings {
  paymentLink: string;
  paymentQrCode: string;
  supportContact: string;
  publicSite?: PublicSiteConfig;
}

export interface Settings {
  schoolName: string;
  schoolYear?: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  toleranceTime: number;
  autoLateAfter: number;
  mandatoryAttendance: boolean;
  allowedMethods: {
    manual: boolean;
    qrCode: boolean;
    geolocation: boolean;
  };
  validation: {
    auto: boolean;
    admin: boolean;
  };
  defaultHourlyRate: number;
  overtimeEnabled: boolean;
  overtimeCoefficient: number;
  deductions: {
    absence: boolean;
    lateness: boolean;
    advance: boolean;
  };
  rounding: '15' | '30' | '60';
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    triggers: {
      professorAbsence: boolean;
      scheduleChange: boolean;
      paymentMade: boolean;
    };
  };
  security: {
    minPasswordLength: number;
    twoFactorAuth: boolean;
    sessionExpiration: number;
  };
  integrations: {
    googleCalendar: boolean;
    excelExport: boolean;
    mobileMoney: boolean;
  };
  modules?: {
    professors?: boolean;
    classes?: boolean;
    schedule?: boolean;
    attendance?: boolean;
    requests?: boolean;
    payroll?: boolean;
    support?: boolean;
  };
  subscription?: {
    plan: 'Essai' | 'Basique' | 'Pro' | 'Premium';
    trialStartDate: string;
    trialEndDate: string;
    status: 'Essai' | 'Suspension Imminente' | 'Actif' | 'Suspendu';
    maxClasses: number;
    maxProfessors: number;
  };
}

export type Role = 'SuperAdmin' | 'Admin' | 'Gestionnaire' | 'Professeur';

export interface User {
  id: string;
  schoolId?: string;
  schoolCode?: string;
  schoolEmail?: string;
  name: string;
  email: string;
  loginId?: string;
  password?: string;
  role: Role;
  status: 'Actif' | 'Inactif' | 'En attente' | 'Rejeté' | 'Suspendu';
  subscriptionStatus?: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  permissions: {
    planning: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    payroll: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    users: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    settings: { view: boolean; add: boolean; edit: boolean; delete: boolean };
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'ad';
  createdAt: number;
  isPublic: boolean;
  status: 'active' | 'inactive';
}

export interface Registration {
  id: string;
  nomEtablissement: string;
  emailEtablissement: string;
  codeEtablissement?: string;
  directeurNom?: string;
  directeurPrenom?: string;
  directeurEmail?: string;
  etablissementContact1?: string;
  drena?: string;
  adresse?: string;
  ville?: string;
  schoolId: string;
  status: 'En attente' | 'Validé' | 'Rejeté' | 'Suspendu';
  createdAt: string;
  [key: string]: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  status: 'active' | 'inactive';
  paymentLink?: string;
  paymentQrCode?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  status: 'Ouvert' | 'Fermé';
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

interface AppState {
  professors: Professor[];
  classes: Class[];
  subjects: Subject[];
  courses: Course[];
  rooms: Room[];
  classSubjectProfessors: ClassSubjectProfessor[];
  attendances: Attendance[];
  payments: Payment[];
  settings: Settings;
  users: User[];
  timeSlots: TimeSlot[];
  professorRequests: ProfessorRequest[];
  schoolSubscription: SchoolSubscription | null;
  platformSettings: PlatformSettings | null;
  registrations: Registration[];
  subscriptions: any[];
  announcements: Announcement[];
  subscriptionPlans: SubscriptionPlan[];
  supportTickets: SupportTicket[];

  addTimeSlot: (slot: Omit<TimeSlot, 'id' | 'schoolId'>) => void;
  updateTimeSlot: (id: string, slot: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  clearAssignments: () => Promise<void>;

  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setStore: (state: Partial<AppState>) => void;

  updateSettings: (settings: Partial<Settings>) => void;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;

  addProfessor: (prof: Omit<Professor, 'id' | 'schoolId'>) => void;
  updateProfessor: (id: string, prof: Partial<Professor>) => void;
  deleteProfessor: (id: string) => Promise<void>;

  addClass: (cls: Omit<Class, 'id' | 'schoolId'>) => void;
  updateClass: (id: string, cls: Partial<Class>) => void;
  deleteClass: (id: string) => void;

  addSubject: (sub: Omit<Subject, 'id' | 'schoolId'>) => void;
  updateSubject: (id: string, sub: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  assignProfessorToClassSubject: (assignment: Omit<ClassSubjectProfessor, 'id' | 'schoolId'>) => void;
  removeAssignment: (id: string) => void;

  addCourse: (course: Omit<Course, 'id' | 'status' | 'schoolId'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  updateCourseStatus: (id: string, status: CourseStatus) => void;
  deleteCourse: (id: string) => void;

  addRoom: (room: Omit<Room, 'id' | 'schoolId'>) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  addAttendance: (attendance: Omit<Attendance, 'id' | 'createdAt' | 'schoolId'> & { schoolId?: string }) => void;
  updateAttendance: (id: string, attendance: Partial<Attendance>) => void;
  deleteAttendance: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id' | 'schoolId'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  addProfessorRequest: (request: Omit<ProfessorRequest, 'id' | 'createdAt' | 'updatedAt' | 'schoolId'>) => void;
  updateProfessorRequest: (id: string, request: Partial<ProfessorRequest>) => void;
  deleteProfessorRequest: (id: string) => void;

  addUser: (user: Omit<User, 'id'> | User) => string;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => Promise<void>;

  addRegistration: (registration: Omit<Registration, 'id'>) => string;
  updateRegistration: (id: string, registration: Partial<Registration>) => void;
  deleteRegistration: (id: string) => void;

  addSubscription: (subscription: any) => string;
  updateSubscription: (id: string, subscription: any) => void;
  deleteSubscription: (id: string) => void;

  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => string;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;

  addSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'>) => string;
  updateSubscriptionPlan: (id: string, plan: Partial<SubscriptionPlan>) => void;
  deleteSubscriptionPlan: (id: string) => void;

  addSupportTicket: (ticket: Omit<SupportTicket, 'id'>) => string;
  updateSupportTicket: (id: string, ticket: Partial<SupportTicket>) => void;
  deleteSupportTicket: (id: string) => void;

  login: (identifier: string, password?: string) => boolean;
  logout: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      professors: [],
      classes: [],
      subjects: [],
      rooms: [],
      classSubjectProfessors: [],
      courses: [],
      attendances: [],
      payments: [],
      timeSlots: [],
      professorRequests: [],
      currentUser: null,
      users: [],
      schoolSubscription: null,
      platformSettings: null,
      registrations: [],
      subscriptions: [],
      announcements: [],
      subscriptionPlans: [],
      supportTickets: [],
      settings: {
        schoolName: 'EduTime Academy',
        logo: '',
        address: '123 Rue de l\'Éducation',
        phone: '+33 1 23 45 67 89',
        email: 'contact@edutime.fr',
        currency: 'FCFA',
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY',
        language: 'fr',
        toleranceTime: 10,
        autoLateAfter: 15,
        mandatoryAttendance: true,
        allowedMethods: {
          manual: true,
          qrCode: false,
          geolocation: false,
        },
        validation: {
          auto: true,
          admin: false,
        },
        defaultHourlyRate: 5000,
        overtimeEnabled: true,
        overtimeCoefficient: 1.25,
        deductions: {
          absence: true,
          lateness: true,
          advance: true,
        },
        rounding: '15',
        notifications: {
          email: true,
          sms: false,
          whatsapp: false,
          triggers: {
            professorAbsence: true,
            scheduleChange: true,
            paymentMade: true,
          },
        },
        security: {
          minPasswordLength: 8,
          twoFactorAuth: false,
          sessionExpiration: 120,
        },
        integrations: {
          googleCalendar: false,
          excelExport: true,
          mobileMoney: false,
        },
      },

      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
      },

      updatePlatformSettings: (newSettings) => {
        set((state) => ({
          platformSettings: state.platformSettings
            ? { ...state.platformSettings, ...newSettings }
            : { paymentLink: '', paymentQrCode: '', supportContact: '', ...newSettings }
        }));
      },

      addProfessor: (prof) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          professors: [...state.professors, { ...prof, id, schoolId }]
        }));
      },
      updateProfessor: (id, updatedProf) => {
        set((state) => ({
          professors: state.professors.map(p => p.id === id ? { ...p, ...updatedProf } : p)
        }));
      },
      deleteProfessor: async (id) => {
        set((state) => ({
          professors: state.professors.filter(p => p.id !== id)
        }));
      },

      addClass: (cls) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          classes: [...state.classes, { ...cls, id, schoolId, createdAt: new Date().toISOString() }]
        }));
      },
      updateClass: (id, updatedCls) => {
        set((state) => ({
          classes: state.classes.map(c => c.id === id ? { ...c, ...updatedCls } : c)
        }));
      },
      deleteClass: (id) => {
        set((state) => ({
          classes: state.classes.filter(c => c.id !== id)
        }));
      },

      addSubject: (sub) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          subjects: [...state.subjects, { ...sub, id, schoolId, createdAt: new Date().toISOString() }]
        }));
      },
      updateSubject: (id, updatedSub) => {
        set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? { ...s, ...updatedSub } : s)
        }));
      },
      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter(s => s.id !== id)
        }));
      },

      assignProfessorToClassSubject: (assignment) => {
        const schoolId = get().currentUser?.schoolId;
        if (!schoolId) return;
        set((state) => ({
          classSubjectProfessors: [...state.classSubjectProfessors, { ...assignment, id: generateId(), schoolId }]
        }));
      },
      removeAssignment: (id) => set((state) => ({
        classSubjectProfessors: state.classSubjectProfessors.filter(a => a.id !== id)
      })),
      clearAssignments: async () => {
        set({ classSubjectProfessors: [] });
      },

      addCourse: (course) => {
        const state = get();
        const schoolId = state.currentUser?.schoolId || '';
        const professor = state.professors.find(p => p.id === course.professorId);
        const id = generateId();
        set((s) => ({
          courses: [...s.courses, {
            ...course,
            id,
            schoolId,
            status: 'scheduled',
            professorEmail: professor?.email
          }]
        }));
      },
      updateCourse: (id, updatedCourse) => {
        set((state) => ({
          courses: state.courses.map(c => c.id === id ? { ...c, ...updatedCourse } : c)
        }));
      },
      updateCourseStatus: (id, status) => {
        set((state) => ({
          courses: state.courses.map(c => c.id === id ? { ...c, status } : c)
        }));
      },
      deleteCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter(c => c.id !== id)
        }));
      },

      addRoom: (room) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          rooms: [...state.rooms, { ...room, id, schoolId }]
        }));
      },
      updateRoom: (id, updatedRoom) => {
        set((state) => ({
          rooms: state.rooms.map(r => r.id === id ? { ...r, ...updatedRoom } : r)
        }));
      },
      deleteRoom: (id) => {
        set((state) => ({
          rooms: state.rooms.filter(r => r.id !== id)
        }));
      },

      addAttendance: (attendance) => {
        const schoolId = attendance.schoolId || get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          attendances: [...state.attendances, {
            ...attendance,
            id,
            schoolId,
            createdAt: new Date().toISOString()
          }]
        }));
      },
      updateAttendance: (id, updatedAttendance) => {
        set((state) => ({
          attendances: state.attendances.map(a => a.id === id ? { ...a, ...updatedAttendance } : a)
        }));
      },
      deleteAttendance: (id) => {
        set((state) => ({
          attendances: state.attendances.filter(a => a.id !== id)
        }));
      },

      addPayment: (payment) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          payments: [...state.payments, { ...payment, id, schoolId }]
        }));
      },
      updatePayment: (id, updatedPayment) => {
        set((state) => ({
          payments: state.payments.map(p => p.id === id ? { ...p, ...updatedPayment } : p)
        }));
      },
      deletePayment: (id) => {
        set((state) => ({
          payments: state.payments.filter(p => p.id !== id)
        }));
      },

      addUser: (user) => {
        const id = (user as any).id || (user as any).email || (user as any).loginId || generateId();
        const schoolId = get().currentUser?.schoolId || (user as any).schoolId || '';
        set((state) => ({
          users: [...state.users.filter(u => u.id !== id), { ...user, id, schoolId } as User]
        }));
        return id;
      },
      updateUser: (id, user) => {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...user } : u)
        }));
      },
      deleteUser: async (id) => {
        set((state) => ({
          users: state.users.filter(u => u.id !== id)
        }));
      },

      addTimeSlot: (slot) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        set((state) => ({
          timeSlots: [...state.timeSlots, { ...slot, id, schoolId }]
        }));
      },
      updateTimeSlot: (id, slot) => {
        set((state) => ({
          timeSlots: state.timeSlots.map(t => t.id === id ? { ...t, ...slot } : t)
        }));
      },
      deleteTimeSlot: (id) => {
        set((state) => ({
          timeSlots: state.timeSlots.filter(t => t.id !== id)
        }));
      },

      addProfessorRequest: (request) => {
        const schoolId = get().currentUser?.schoolId || '';
        const id = generateId();
        const now = new Date().toISOString();
        set((state) => ({
          professorRequests: [...state.professorRequests, {
            ...request,
            id,
            schoolId,
            createdAt: now,
            updatedAt: now
          }]
        }));
      },
      updateProfessorRequest: (id, request) => {
        set((state) => ({
          professorRequests: state.professorRequests.map(r =>
            r.id === id ? { ...r, ...request, updatedAt: new Date().toISOString() } : r
          )
        }));
      },
      deleteProfessorRequest: (id) => {
        set((state) => ({
          professorRequests: state.professorRequests.filter(r => r.id !== id)
        }));
      },

      addRegistration: (registration) => {
        const id = generateId();
        const fullRegistration: Registration = {
          nomEtablissement: registration.nomEtablissement || '',
          emailEtablissement: registration.emailEtablissement || '',
          schoolId: registration.schoolId || '',
          status: registration.status || 'En attente',
          createdAt: registration.createdAt || new Date().toISOString(),
          ...registration,
          id
        };
        set((state) => ({
          registrations: [...state.registrations, fullRegistration]
        }));
        return id;
      },
      updateRegistration: (id, registration) => {
        set((state) => ({
          registrations: state.registrations.map(r => r.id === id ? { ...r, ...registration } : r)
        }));
      },
      deleteRegistration: (id) => {
        set((state) => ({
          registrations: state.registrations.filter(r => r.id !== id)
        }));
      },

      addSubscription: (subscription) => {
        const id = subscription.id || generateId();
        set((state) => ({
          subscriptions: [...state.subscriptions.filter(s => s.id !== id), { ...subscription, id }]
        }));
        return id;
      },
      updateSubscription: (id, subscription) => {
        set((state) => ({
          subscriptions: state.subscriptions.map(s => s.id === id ? { ...s, ...subscription } : s)
        }));
      },
      deleteSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter(s => s.id !== id)
        }));
      },

      addAnnouncement: (announcement) => {
        const id = generateId();
        set((state) => ({
          announcements: [{ ...announcement, id }, ...state.announcements]
        }));
        return id;
      },
      updateAnnouncement: (id, announcement) => {
        set((state) => ({
          announcements: state.announcements.map(a => a.id === id ? { ...a, ...announcement } : a)
        }));
      },
      deleteAnnouncement: (id) => {
        set((state) => ({
          announcements: state.announcements.filter(a => a.id !== id)
        }));
      },

      addSubscriptionPlan: (plan) => {
        const id = generateId();
        set((state) => ({
          subscriptionPlans: [...state.subscriptionPlans, { ...plan, id }]
        }));
        return id;
      },
      updateSubscriptionPlan: (id, plan) => {
        set((state) => ({
          subscriptionPlans: state.subscriptionPlans.map(p => p.id === id ? { ...p, ...plan } : p)
        }));
      },
      deleteSubscriptionPlan: (id) => {
        set((state) => ({
          subscriptionPlans: state.subscriptionPlans.filter(p => p.id !== id)
        }));
      },

      addSupportTicket: (ticket) => {
        const id = generateId();
        set((state) => ({
          supportTickets: [{ ...ticket, id }, ...state.supportTickets]
        }));
        return id;
      },
      updateSupportTicket: (id, ticket) => {
        set((state) => ({
          supportTickets: state.supportTickets.map(t => t.id === id ? { ...t, ...ticket } : t)
        }));
      },
      deleteSupportTicket: (id) => {
        set((state) => ({
          supportTickets: state.supportTickets.filter(t => t.id !== id)
        }));
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      setStore: (newState) => set(newState),
      login: (identifier: string, password?: string) => {
        const state = get();
        // SuperAdmin shortcut
        if ((identifier === '26' || identifier === 'cydrovis@gmail.com') && password === 'admin123') {
          const superAdmin: User = {
            id: 'super-admin',
            name: 'Super Administrateur',
            role: 'SuperAdmin',
            email: 'cydrovis@gmail.com',
            status: 'Actif',
            permissions: {
              planning: { view: true, add: true, edit: true, delete: true },
              payroll: { view: true, add: true, edit: true, delete: true },
              users: { view: true, add: true, edit: true, delete: true },
              settings: { view: true, add: true, edit: true, delete: true },
            }
          };
          set({ currentUser: superAdmin });
          return true;
        }
        // Search in local users
        const user = state.users.find(u =>
          (u.email === identifier || u.loginId === identifier ||
           u.schoolCode === identifier || u.schoolEmail === identifier) &&
          u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: 'edutime-storage-v2',
    }
  )
);
