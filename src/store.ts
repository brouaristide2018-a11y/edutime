import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { firestoreActions } from './firebaseSync';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

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
  courseId?: string; // Optional, if it's for a specific course
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
  name?: string; // e.g., "M1", "S1"
  type?: 'Cours' | 'Recréation' | 'Après-Midi' | 'Devoir';
}

export interface Course {
  id: string;
  schoolId: string;
  professorId: string;
  professorEmail?: string; // For cross-school conflict detection
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
  sliderDuration: number; // in milliseconds
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
  // Établissement
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

  // Règles de pointage
  toleranceTime: number; // minutes
  autoLateAfter: number; // minutes
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

  // Règles de paie
  defaultHourlyRate: number;
  overtimeEnabled: boolean;
  overtimeCoefficient: number;
  deductions: {
    absence: boolean;
    lateness: boolean;
    advance: boolean;
  };
  rounding: '15' | '30' | '60'; // minutes

  // Notifications
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

  // Sécurité
  security: {
    minPasswordLength: number;
    twoFactorAuth: boolean;
    sessionExpiration: number; // minutes
  };

  // Intégrations
  integrations: {
    googleCalendar: boolean;
    excelExport: boolean;
    mobileMoney: boolean;
  };

  // Modules (Toggle features for schools)
  modules?: {
    professors?: boolean;
    classes?: boolean;
    schedule?: boolean;
    attendance?: boolean;
    requests?: boolean;
    payroll?: boolean;
    support?: boolean;
  };

  // Abonnement (Subscription limits and status)
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
  
  addTimeSlot: (slot: Omit<TimeSlot, 'id' | 'schoolId'>) => void;
  updateTimeSlot: (id: string, slot: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  clearAssignments: () => Promise<void>;

  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setStore: (state: Partial<AppState>) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  
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
        firestoreActions.updateSettings(newSettings);
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
      },

      addProfessor: (prof) => {
        firestoreActions.addProfessor(prof);
      },
      updateProfessor: (id, updatedProf) => {
        firestoreActions.updateProfessor(id, updatedProf);
      },
      deleteProfessor: async (id) => {
        await firestoreActions.deleteProfessor(id);
      },

      addClass: (cls) => {
        firestoreActions.addClass({ ...cls, createdAt: new Date().toISOString() });
      },
      updateClass: (id, updatedCls) => {
        firestoreActions.updateClass(id, updatedCls);
      },
      deleteClass: (id) => {
        firestoreActions.deleteClass(id);
      },

      addSubject: (sub) => {
        firestoreActions.addSubject({ ...sub, createdAt: new Date().toISOString() });
      },
      updateSubject: (id, updatedSub) => {
        firestoreActions.updateSubject(id, updatedSub);
      },
      deleteSubject: (id) => {
        firestoreActions.deleteSubject(id);
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
        firestoreActions.addCourse({ ...course, status: 'scheduled' });
      },
      updateCourse: (id, updatedCourse) => {
        firestoreActions.updateCourse(id, updatedCourse);
      },
      updateCourseStatus: (id, status) => {
        firestoreActions.updateCourse(id, { status });
      },
      deleteCourse: (id) => {
        firestoreActions.deleteCourse(id);
      },

      addRoom: (room) => {
        firestoreActions.addRoom(room);
      },
      updateRoom: (id, updatedRoom) => {
        firestoreActions.updateRoom(id, updatedRoom);
      },
      deleteRoom: (id) => {
        firestoreActions.deleteRoom(id);
      },

      addAttendance: (attendance) => {
        firestoreActions.addAttendance(attendance);
      },
      updateAttendance: (id, updatedAttendance) => {
        firestoreActions.updateAttendance(id, updatedAttendance);
      },
      deleteAttendance: (id) => {
        firestoreActions.deleteAttendance(id);
      },

      addPayment: (payment) => {
        firestoreActions.addPayment(payment);
      },
      updatePayment: (id, updatedPayment) => {
        firestoreActions.updatePayment(id, updatedPayment);
      },
      deletePayment: (id) => {
        firestoreActions.deletePayment(id);
      },

      addUser: (user) => {
        const id = user.email || user.loginId || Math.random().toString(36).substr(2, 9);
        firestoreActions.addUser({ ...user, id });
        return id;
      },
      updateUser: (id, user) => {
        firestoreActions.updateUser(id, user);
      },
      deleteUser: async (id) => {
        await firestoreActions.deleteUser(id);
      },

      addTimeSlot: (slot) => {
        firestoreActions.addTimeSlot(slot);
      },
      updateTimeSlot: (id, slot) => {
        firestoreActions.updateTimeSlot(id, slot);
      },
      deleteTimeSlot: (id) => {
        firestoreActions.deleteTimeSlot(id);
      },

      addProfessorRequest: (request) => {
        firestoreActions.addProfessorRequest(request);
      },
      updateProfessorRequest: (id, request) => {
        firestoreActions.updateProfessorRequest(id, request);
      },
      deleteProfessorRequest: (id) => {
        firestoreActions.deleteProfessorRequest(id);
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      setStore: (newState) => set(newState),
      login: () => {
        // Obsolete: authentication is handled in Login.tsx via Firebase Auth
        return false;
      },
      logout: () => {
        signOut(auth).catch(console.error);
        set({ currentUser: null });
      },
    }),
    {
      name: 'edutime-storage-v2',
    }
  )
);
