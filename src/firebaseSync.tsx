import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { useStore } from './store';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirebaseSync() {
  const setStore = useStore.setState;
  const currentUser = useStore(state => state.currentUser);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        // User is signed in to Firebase
        const userDoc = await getDoc(doc(db, 'users', user.email));
        if (userDoc.exists()) {
          setStore({ currentUser: { id: user.email, ...userDoc.data() } as any });
        } else {
          // User document doesn't exist in Firestore, but they are authenticated.
          // Try to find them in local store and sync to Firestore.
          const localUser = useStore.getState().currentUser;
          if (localUser && (localUser.email === user.email || `${localUser.loginId}@edutime.local` === user.email)) {
            try {
              const userId = localUser.id || localUser.loginId || localUser.email || `user_${Math.random().toString(36).substr(2, 9)}`;
              await setDoc(doc(db, 'auth_mappings', user.uid), { userId: userId });
              await setDoc(doc(db, 'users', userId), { ...localUser, id: userId, authUid: user.uid }, { merge: true });
              setStore({ currentUser: { ...localUser, id: userId } });
            } catch (e) {
              console.warn("Could not sync local user to Firestore on auth state change", e);
            }
          }
        }
      } else {
        // User is signed out of Firebase
        setStore({ currentUser: null });
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, [setStore]);

  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    // SuperAdmin listens to global system status
    if (currentUser.role === 'SuperAdmin') {
      const unsubscribes: (() => void)[] = [];
      
      unsubscribes.push(onSnapshot(collection(db, 'registrations'), (snapshot) => {
        const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Registrations aren't directly in store, but we might want them if we add them later
      }, (error) => handleFirestoreError(error, OperationType.GET, 'registrations')));

      unsubscribes.push(onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
        // ... handled in pages for SuperAdmin
      }, (error) => handleFirestoreError(error, OperationType.GET, 'subscriptions')));

      unsubscribes.push(onSnapshot(doc(db, 'platform', 'settings'), (doc) => {
        if (doc.exists()) {
          setStore({ platformSettings: doc.data() as any });
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'platform/settings')));

      return () => unsubscribes.forEach(unsub => unsub());
    }

    const unsubscribes: (() => void)[] = [];
    const schoolId = currentUser.schoolId;
    if (!schoolId) return;

    // Filtered Queries for Multi-tenancy
    const qProfessors = query(collection(db, 'professors'), where('schoolId', '==', schoolId));
    const qClasses = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
    const qCourses = query(collection(db, 'courses'), where('schoolId', '==', schoolId));
    const qAttendances = query(collection(db, 'attendances'), where('schoolId', '==', schoolId));
    const qPayments = query(collection(db, 'payments'), where('schoolId', '==', schoolId));
    const qRooms = query(collection(db, 'rooms'), where('schoolId', '==', schoolId));
    const qUsers = query(collection(db, 'users'), where('schoolId', '==', schoolId));
    const qTimeSlots = query(collection(db, 'timeSlots'), where('schoolId', '==', schoolId));
    const qProfessorRequests = query(collection(db, 'professor_requests'), where('schoolId', '==', schoolId));

    // Sync Professors
    unsubscribes.push(onSnapshot(qProfessors, (snapshot) => {
      const professors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ professors });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'professors')));

    // Sync Classes
    unsubscribes.push(onSnapshot(qClasses, (snapshot) => {
      const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ classes });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'classes')));

    // Sync Subjects
    unsubscribes.push(onSnapshot(qSubjects, (snapshot) => {
      const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ subjects });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'subjects')));

    // Sync Courses
    unsubscribes.push(onSnapshot(qCourses, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ courses });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'courses')));

    // Sync Attendances
    unsubscribes.push(onSnapshot(qAttendances, (snapshot) => {
      const attendances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ attendances });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'attendances')));

    // Sync Payments
    unsubscribes.push(onSnapshot(qPayments, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ payments });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'payments')));

    // Sync Rooms
    unsubscribes.push(onSnapshot(qRooms, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ rooms });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'rooms')));

    // Sync Users
    unsubscribes.push(onSnapshot(qUsers, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ users });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users')));

    // Sync TimeSlots
    unsubscribes.push(onSnapshot(qTimeSlots, (snapshot) => {
      const timeSlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setStore({ timeSlots });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'timeSlots')));

    // Sync Professor Requests
    unsubscribes.push(onSnapshot(qProfessorRequests, (snapshot) => {
      const professorRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStore({ professorRequests });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'professor_requests')));

    // Sync Platform Settings
    unsubscribes.push(onSnapshot(doc(db, 'platform', 'settings'), (doc) => {
      if (doc.exists()) {
        setStore({ platformSettings: doc.data() as any });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'platform/settings')));

    // Sync School Subscription
    unsubscribes.push(onSnapshot(doc(db, 'subscriptions', schoolId!), (doc) => {
      if (doc.exists()) {
        setStore({ schoolSubscription: doc.data() as any });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `subscriptions/${schoolId}`)));

    // Sync Settings
    unsubscribes.push(onSnapshot(doc(db, 'settings', schoolId!), (doc) => {
      if (doc.exists()) {
        setStore({ settings: doc.data() as any });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${schoolId}`)));

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, isAuthReady]);
}

// Helper functions to write to Firestore
export const firestoreActions = {
  addTimeSlot: async (slot: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'timeSlots'));
      await setDoc(newDoc, { ...slot, id: newDoc.id, schoolId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'timeSlots');
    }
  },
  updateTimeSlot: async (id: string, slot: any) => {
    try {
      await updateDoc(doc(db, 'timeSlots', id), slot);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `timeSlots/${id}`);
    }
  },
  deleteTimeSlot: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'timeSlots', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `timeSlots/${id}`);
    }
  },
  addProfessor: async (prof: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'professors'));
      await setDoc(newDoc, { ...prof, id: newDoc.id, schoolId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'professors');
    }
  },
  updateProfessor: async (id: string, prof: any) => {
    try {
      await updateDoc(doc(db, 'professors', id), prof);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `professors/${id}`);
    }
  },
  deleteProfessor: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'professors', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `professors/${id}`);
    }
  },

  addClass: async (cls: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'classes'));
      await setDoc(newDoc, { ...cls, id: newDoc.id, schoolId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    }
  },
  updateClass: async (id: string, cls: any) => {
    try {
      await updateDoc(doc(db, 'classes', id), cls);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${id}`);
    }
  },
  deleteClass: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classes/${id}`);
    }
  },

  addSubject: async (sub: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'subjects'));
      await setDoc(newDoc, { ...sub, id: newDoc.id, schoolId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subjects');
    }
  },
  updateSubject: async (id: string, sub: any) => {
    try {
      await updateDoc(doc(db, 'subjects', id), sub);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subjects/${id}`);
    }
  },
  deleteSubject: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subjects/${id}`);
    }
  },

  addCourse: async (course: any) => {
    try {
      const state = useStore.getState();
      const schoolId = state.currentUser?.schoolId;
      const professor = state.professors.find(p => p.id === course.professorId);
      const newDoc = doc(collection(db, 'courses'));
      await setDoc(newDoc, { 
        ...course, 
        id: newDoc.id, 
        schoolId,
        professorEmail: professor?.email // Add email for cross-school conflict detection
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'courses');
    }
  },
  updateCourse: async (id: string, course: any) => {
    try {
      await updateDoc(doc(db, 'courses', id), course);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${id}`);
    }
  },
  deleteCourse: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'courses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
    }
  },

  addAttendance: async (attendance: any) => {
    try {
      const schoolId = attendance.schoolId || useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'attendances'));
      await setDoc(newDoc, { ...attendance, id: newDoc.id, schoolId, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendances');
    }
  },
  updateAttendance: async (id: string, attendance: any) => {
    try {
      await updateDoc(doc(db, 'attendances', id), attendance);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendances/${id}`);
    }
  },
  deleteAttendance: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'attendances', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `attendances/${id}`);
    }
  },

  addPayment: async (payment: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'payments'));
      await setDoc(newDoc, { ...payment, id: newDoc.id, schoolId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  },
  updatePayment: async (id: string, payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', id), payment);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payments/${id}`);
    }
  },
  deletePayment: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `payments/${id}`);
    }
  },

  addRoom: async (room: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'rooms'));
      await setDoc(newDoc, { ...room, id: newDoc.id, schoolId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rooms');
    }
  },
  updateRoom: async (id: string, room: any) => {
    try {
      await updateDoc(doc(db, 'rooms', id), room);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${id}`);
    }
  },
  deleteRoom: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `rooms/${id}`);
    }
  },

  addUser: async (user: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const id = user.id || user.email || user.loginId;
      await setDoc(doc(db, 'users', id), { ...user, id, schoolId });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
      return null;
    }
  },
  updateUser: async (id: string, user: any) => {
    try {
      await updateDoc(doc(db, 'users', id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  },
  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  },

  updateSettings: async (settings: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      if (!schoolId) return;
      await setDoc(doc(db, 'settings', schoolId), settings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${useStore.getState().currentUser?.schoolId}`);
    }
  },

  addProfessorRequest: async (request: any) => {
    try {
      const schoolId = useStore.getState().currentUser?.schoolId;
      const newDoc = doc(collection(db, 'professor_requests'));
      await setDoc(newDoc, { 
        ...request, 
        id: newDoc.id, 
        schoolId,
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'professor_requests');
    }
  },
  updateProfessorRequest: async (id: string, request: any) => {
    try {
      await updateDoc(doc(db, 'professor_requests', id), { ...request, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `professor_requests/${id}`);
    }
  },
  deleteProfessorRequest: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'professor_requests', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `professor_requests/${id}`);
    }
  }
};
