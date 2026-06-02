import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setToken, removeToken } from './api';

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

  addTimeSlot: (slot: Omit<TimeSlot, 'id' | 'schoolId'>) => void | Promise<void>;
  updateTimeSlot: (id: string, slot: Partial<TimeSlot>) => void | Promise<void>;
  deleteTimeSlot: (id: string) => void | Promise<void>;
  clearAssignments: () => Promise<void>;

  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setStore: (state: Partial<AppState>) => void;

  updateSettings: (settings: Partial<Settings>) => void | Promise<void>;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void | Promise<void>;

  addProfessor: (prof: Omit<Professor, 'id' | 'schoolId'>) => void | Promise<void>;
  updateProfessor: (id: string, prof: Partial<Professor>) => void | Promise<void>;
  deleteProfessor: (id: string) => Promise<void>;

  addClass: (cls: Omit<Class, 'id' | 'schoolId'>) => void | Promise<void>;
  updateClass: (id: string, cls: Partial<Class>) => void | Promise<void>;
  deleteClass: (id: string) => void | Promise<void>;

  addSubject: (sub: Omit<Subject, 'id' | 'schoolId'>) => void | Promise<void>;
  updateSubject: (id: string, sub: Partial<Subject>) => void | Promise<void>;
  deleteSubject: (id: string) => void | Promise<void>;

  assignProfessorToClassSubject: (assignment: Omit<ClassSubjectProfessor, 'id' | 'schoolId'>) => void;
  removeAssignment: (id: string) => void;

  addCourse: (course: Omit<Course, 'id' | 'status' | 'schoolId'>) => void | Promise<void>;
  updateCourse: (id: string, course: Partial<Course>) => void | Promise<void>;
  updateCourseStatus: (id: string, status: CourseStatus) => void | Promise<void>;
  deleteCourse: (id: string) => void | Promise<void>;

  addRoom: (room: Omit<Room, 'id' | 'schoolId'>) => void | Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => void | Promise<void>;
  deleteRoom: (id: string) => void | Promise<void>;

  addAttendance: (attendance: Omit<Attendance, 'id' | 'createdAt' | 'schoolId'> & { schoolId?: string }) => void | Promise<void>;
  updateAttendance: (id: string, attendance: Partial<Attendance>) => void | Promise<void>;
  deleteAttendance: (id: string) => void | Promise<void>;

  addPayment: (payment: Omit<Payment, 'id' | 'schoolId'>) => void | Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => void | Promise<void>;
  deletePayment: (id: string) => void | Promise<void>;

  addProfessorRequest: (request: Omit<ProfessorRequest, 'id' | 'createdAt' | 'updatedAt' | 'schoolId'>) => void | Promise<void>;
  updateProfessorRequest: (id: string, request: Partial<ProfessorRequest>) => void | Promise<void>;
  deleteProfessorRequest: (id: string) => void | Promise<void>;

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

  login: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => void;
  syncFromAPI: (schoolId: string) => Promise<void>;
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

      addProfessor: async (prof) => {
        const schoolId = get().currentUser?.schoolId || '';
        try {
          const created = await api.professors.create({ ...prof, school_id: schoolId });
          const newProf = { ...prof, id: created.id || created.data?.id || generateId(), schoolId };
          set((state) => ({ professors: [...state.professors, newProf] }));
        } catch {
          // Fallback local si API indisponible
          const id = generateId();
          set((state) => ({ professors: [...state.professors, { ...prof, id, schoolId }] }));
        }
      },
      updateProfessor: async (id, updatedProf) => {
        try {
          await api.professors.update(id, updatedProf);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          professors: state.professors.map(p => p.id === id ? { ...p, ...updatedProf } : p)
        }));
      },
      deleteProfessor: async (id) => {
        try {
          await api.professors.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          professors: state.professors.filter(p => p.id !== id)
        }));
      },

      addClass: async (cls) => {
        const schoolId = get().currentUser?.schoolId || '';
        try {
          const created = await api.classes.create({ ...cls, school_id: schoolId });
          const newCls = { ...cls, id: created.id || created.data?.id || generateId(), schoolId, createdAt: new Date().toISOString() };
          set((state) => ({ classes: [...state.classes, newCls] }));
        } catch {
          const id = generateId();
          set((state) => ({ classes: [...state.classes, { ...cls, id, schoolId, createdAt: new Date().toISOString() }] }));
        }
      },
      updateClass: async (id, updatedCls) => {
        try {
          await api.classes.update(id, updatedCls);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          classes: state.classes.map(c => c.id === id ? { ...c, ...updatedCls } : c)
        }));
      },
      deleteClass: async (id) => {
        try {
          await api.classes.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          classes: state.classes.filter(c => c.id !== id)
        }));
      },

      addSubject: async (sub) => {
        const schoolId = get().currentUser?.schoolId || '';
        try {
          const created = await api.subjects.create({ ...sub, school_id: schoolId });
          const newSub = { ...sub, id: created.id || created.data?.id || generateId(), schoolId, createdAt: new Date().toISOString() };
          set((state) => ({ subjects: [...state.subjects, newSub] }));
        } catch {
          const id = generateId();
          set((state) => ({ subjects: [...state.subjects, { ...sub, id, schoolId, createdAt: new Date().toISOString() }] }));
        }
      },
      updateSubject: async (id, updatedSub) => {
        try {
          await api.subjects.update(id, updatedSub);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? { ...s, ...updatedSub } : s)
        }));
      },
      deleteSubject: async (id) => {
        try {
          await api.subjects.delete(id);
        } catch {
          // Continue with local delete
        }
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

      addCourse: async (course) => {
        const state = get();
        const schoolId = state.currentUser?.schoolId || '';
        const professor = state.professors.find(p => p.id === course.professorId);
        try {
          const created = await api.courses.create({ ...course, school_id: schoolId });
          const newCourse = { ...course, id: created.id || created.data?.id || generateId(), schoolId, status: 'scheduled' as const, professorEmail: professor?.email };
          set((s) => ({ courses: [...s.courses, newCourse] }));
        } catch {
          const id = generateId();
          set((s) => ({
            courses: [...s.courses, { ...course, id, schoolId, status: 'scheduled' as const, professorEmail: professor?.email }]
          }));
        }
      },
      updateCourse: async (id, updatedCourse) => {
        try {
          await api.courses.update(id, updatedCourse);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          courses: state.courses.map(c => c.id === id ? { ...c, ...updatedCourse } : c)
        }));
      },
      updateCourseStatus: async (id, status) => {
        try {
          await api.courses.updateStatus(id, status);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          courses: state.courses.map(c => c.id === id ? { ...c, status } : c)
        }));
      },
      deleteCourse: async (id) => {
        try {
          await api.courses.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          courses: state.courses.filter(c => c.id !== id)
        }));
      },

      addRoom: async (room) => {
        const schoolId = get().currentUser?.schoolId || '';
        try {
          const created = await api.rooms.create({ ...room, school_id: schoolId });
          const newRoom = { ...room, id: created.id || created.data?.id || generateId(), schoolId };
          set((state) => ({ rooms: [...state.rooms, newRoom] }));
        } catch {
          const id = generateId();
          set((state) => ({ rooms: [...state.rooms, { ...room, id, schoolId }] }));
        }
      },
      updateRoom: async (id, updatedRoom) => {
        try {
          await api.rooms.update(id, updatedRoom);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          rooms: state.rooms.map(r => r.id === id ? { ...r, ...updatedRoom } : r)
        }));
      },
      deleteRoom: async (id) => {
        try {
          await api.rooms.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          rooms: state.rooms.filter(r => r.id !== id)
        }));
      },

      addAttendance: async (attendance) => {
        const schoolId = attendance.schoolId || get().currentUser?.schoolId || '';
        try {
          const created = await api.attendances.create({ ...attendance, school_id: schoolId });
          const newAttendance = { ...attendance, id: created.id || created.data?.id || generateId(), schoolId, createdAt: new Date().toISOString() };
          set((state) => ({ attendances: [...state.attendances, newAttendance] }));
        } catch {
          const id = generateId();
          set((state) => ({ attendances: [...state.attendances, { ...attendance, id, schoolId, createdAt: new Date().toISOString() }] }));
        }
      },
      updateAttendance: async (id, updatedAttendance) => {
        try {
          await api.attendances.update(id, updatedAttendance);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          attendances: state.attendances.map(a => a.id === id ? { ...a, ...updatedAttendance } : a)
        }));
      },
      deleteAttendance: async (id) => {
        try {
          await api.attendances.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          attendances: state.attendances.filter(a => a.id !== id)
        }));
      },

      addPayment: async (payment) => {
        const schoolId = get().currentUser?.schoolId || '';
        try {
          const created = await api.payments.create({ ...payment, school_id: schoolId });
          const newPayment = { ...payment, id: created.id || created.data?.id || generateId(), schoolId };
          set((state) => ({ payments: [...state.payments, newPayment] }));
        } catch {
          const id = generateId();
          set((state) => ({ payments: [...state.payments, { ...payment, id, schoolId }] }));
        }
      },
      updatePayment: async (id, updatedPayment) => {
        try {
          await api.payments.update(id, updatedPayment);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          payments: state.payments.map(p => p.id === id ? { ...p, ...updatedPayment } : p)
        }));
      },
      deletePayment: async (id) => {
        try {
          await api.payments.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          payments: state.payments.filter(p => p.id !== id)
        }));
      },

      addUser: (user) => {
        const id = (user as any).id || (user as any).email || (user as any).loginId || generateId();
        const schoolId = get().currentUser?.schoolId || (user as any).schoolId || '';
        // Try API in background (non-blocking for backwards compat — addUser returns id synchronously)
        api.users.create({ ...user, id, school_id: schoolId }).catch(() => {});
        set((state) => ({
          users: [...state.users.filter(u => u.id !== id), { ...user, id, schoolId } as User]
        }));
        return id;
      },
      updateUser: async (id, user) => {
        try {
          await api.users.update(id, user);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...user } : u)
        }));
      },
      deleteUser: async (id) => {
        try {
          await api.users.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          users: state.users.filter(u => u.id !== id)
        }));
      },

      addTimeSlot: async (slot) => {
        const schoolId = get().currentUser?.schoolId || '';
        try {
          const created = await api.timeslots.create({ ...slot, school_id: schoolId });
          const newSlot = { ...slot, id: created.id || created.data?.id || generateId(), schoolId };
          set((state) => ({ timeSlots: [...state.timeSlots, newSlot] }));
        } catch {
          const id = generateId();
          set((state) => ({ timeSlots: [...state.timeSlots, { ...slot, id, schoolId }] }));
        }
      },
      updateTimeSlot: async (id, slot) => {
        try {
          await api.timeslots.update(id, slot);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          timeSlots: state.timeSlots.map(t => t.id === id ? { ...t, ...slot } : t)
        }));
      },
      deleteTimeSlot: async (id) => {
        try {
          await api.timeslots.delete(id);
        } catch {
          // Continue with local delete
        }
        set((state) => ({
          timeSlots: state.timeSlots.filter(t => t.id !== id)
        }));
      },

      addProfessorRequest: async (request) => {
        const schoolId = get().currentUser?.schoolId || '';
        const now = new Date().toISOString();
        try {
          const created = await api.requests.create({ ...request, school_id: schoolId });
          const newReq = { ...request, id: created.id || created.data?.id || generateId(), schoolId, createdAt: now, updatedAt: now };
          set((state) => ({ professorRequests: [...state.professorRequests, newReq] }));
        } catch {
          const id = generateId();
          set((state) => ({ professorRequests: [...state.professorRequests, { ...request, id, schoolId, createdAt: now, updatedAt: now }] }));
        }
      },
      updateProfessorRequest: async (id, request) => {
        try {
          await api.requests.update(id, request);
        } catch {
          // Continue with local update
        }
        set((state) => ({
          professorRequests: state.professorRequests.map(r =>
            r.id === id ? { ...r, ...request, updatedAt: new Date().toISOString() } : r
          )
        }));
      },
      deleteProfessorRequest: async (id) => {
        try {
          await api.requests.delete(id);
        } catch {
          // Continue with local delete
        }
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

      login: async (identifier: string, password?: string) => {
        try {
          const response = await api.auth.login(identifier, password || '');
          const token = response.token || response.data?.token;
          const userData = response.user || response.data?.user;
          if (token) {
            setToken(token);
          }
          if (userData) {
            // Normalize snake_case → camelCase
            const user: User = {
              id: userData.id,
              schoolId: userData.school_id || userData.schoolId,
              schoolCode: userData.school_code || userData.schoolCode,
              schoolEmail: userData.school_email || userData.schoolEmail,
              name: userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
              email: userData.email,
              loginId: userData.login_id || userData.loginId || identifier,
              role: userData.role as Role,
              status: userData.status || 'Actif',
              permissions: userData.permissions || {
                planning: { view: true, add: true, edit: true, delete: true },
                payroll: { view: true, add: true, edit: true, delete: true },
                users: { view: true, add: true, edit: true, delete: true },
                settings: { view: true, add: true, edit: true, delete: true },
              },
            };
            set({ currentUser: user });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      logout: () => {
        removeToken();
        set({ currentUser: null });
      },

      syncFromAPI: async (schoolId: string) => {
        const params = { school_id: schoolId };
        try {
          const [
            professorsRes,
            classesRes,
            subjectsRes,
            roomsRes,
            coursesRes,
            attendancesRes,
            paymentsRes,
            timeslotsRes,
            requestsRes,
          ] = await Promise.allSettled([
            api.professors.list(params),
            api.classes.list(params),
            api.subjects.list(params),
            api.rooms.list(params),
            api.courses.list(params),
            api.attendances.list(params),
            api.payments.list(params),
            api.timeslots.list(params),
            api.requests.list(params),
          ]);

          const extract = (res: PromiseSettledResult<any>) =>
            res.status === 'fulfilled'
              ? (Array.isArray(res.value) ? res.value : res.value?.data || res.value?.items || [])
              : [];

          // Map snake_case fields to camelCase for each entity
          const mapProfessor = (p: any) => ({ ...p, schoolId: p.school_id || p.schoolId, subjectIds: p.subject_ids || p.subjectIds || [], availabilities: p.availabilities || [], contractType: p.contract_type || p.contractType, hourlyRate: p.hourly_rate || p.hourlyRate, hireDate: p.hire_date || p.hireDate, birthDate: p.birth_date || p.birthDate, photoUrl: p.photo_url || p.photoUrl });
          const mapClass = (c: any) => ({ ...c, schoolId: c.school_id || c.schoolId, createdAt: c.created_at || c.createdAt, mainTeacherId: c.main_teacher_id || c.mainTeacherId });
          const mapSubject = (s: any) => ({ ...s, schoolId: s.school_id || s.schoolId, createdAt: s.created_at || s.createdAt, weeklyHours: s.weekly_hours || s.weeklyHours });
          const mapRoom = (r: any) => ({ ...r, schoolId: r.school_id || r.schoolId });
          const mapCourse = (c: any) => ({ ...c, schoolId: c.school_id || c.schoolId, professorId: c.professor_id || c.professorId, classId: c.class_id || c.classId, subjectId: c.subject_id || c.subjectId, roomId: c.room_id || c.roomId, startTime: c.start_time || c.startTime, endTime: c.end_time || c.endTime, professorEmail: c.professor_email || c.professorEmail });
          const mapAttendance = (a: any) => ({ ...a, schoolId: a.school_id || a.schoolId, professorId: a.professor_id || a.professorId, classId: a.class_id || a.classId, subjectId: a.subject_id || a.subjectId, courseId: a.course_id || a.courseId, plannedStartTime: a.planned_start_time || a.plannedStartTime, plannedEndTime: a.planned_end_time || a.plannedEndTime, actualStartTime: a.actual_start_time || a.actualStartTime, actualEndTime: a.actual_end_time || a.actualEndTime, replacementProfessorId: a.replacement_professor_id || a.replacementProfessorId, calculatedHours: a.calculated_hours || a.calculatedHours, createdAt: a.created_at || a.createdAt, scannedAt: a.scanned_at || a.scannedAt, validatedByAdmin: a.validated_by_admin || a.validatedByAdmin });
          const mapPayment = (p: any) => ({ ...p, schoolId: p.school_id || p.schoolId, professorId: p.professor_id || p.professorId, normalHours: p.normal_hours || p.normalHours, overtimeHours: p.overtime_hours || p.overtimeHours, missedHours: p.missed_hours || p.missedHours, plannedHours: p.planned_hours || p.plannedHours, paidAt: p.paid_at || p.paidAt, paymentMethod: p.payment_method || p.paymentMethod });
          const mapTimeslot = (t: any) => ({ ...t, schoolId: t.school_id || t.schoolId, startTime: t.start_time || t.startTime, endTime: t.end_time || t.endTime });
          const mapRequest = (r: any) => ({ ...r, schoolId: r.school_id || r.schoolId, professorId: r.professor_id || r.professorId, courseId: r.course_id || r.courseId, createdAt: r.created_at || r.createdAt, updatedAt: r.updated_at || r.updatedAt });

          set({
            professors: extract(professorsRes).map(mapProfessor),
            classes: extract(classesRes).map(mapClass),
            subjects: extract(subjectsRes).map(mapSubject),
            rooms: extract(roomsRes).map(mapRoom),
            courses: extract(coursesRes).map(mapCourse),
            attendances: extract(attendancesRes).map(mapAttendance),
            payments: extract(paymentsRes).map(mapPayment),
            timeSlots: extract(timeslotsRes).map(mapTimeslot),
            professorRequests: extract(requestsRes).map(mapRequest),
          });
        } catch (err) {
          console.warn('[syncFromAPI] Failed to sync data:', err);
        }
      },
    }),
    {
      name: 'edutime-storage-v2',
    }
  )
);
