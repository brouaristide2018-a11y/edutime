/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Professors } from './pages/Professors';
import { ProfessorDetail } from './pages/ProfessorDetail';
import { ClassesAndSubjects } from './pages/ClassesAndSubjects';
import { Schedule } from './pages/Schedule';
import { Timetable } from './pages/Timetable';
import { ClassTimetable } from './pages/ClassTimetable';
import { Attendance } from './pages/Attendance';
import { Payroll } from './pages/Payroll';
import { Requests } from './pages/Requests';
import Settings from './pages/Settings';
import { Login } from './pages/Login';
import { ProfLayout } from './components/ProfLayout';
import { ProfDashboard } from './pages/prof/ProfDashboard';
import { ProfSchedule } from './pages/prof/ProfSchedule';
import { ProfAttendance } from './pages/prof/ProfAttendance';
import { ProfPayroll } from './pages/prof/ProfPayroll';
import { ProfProfile } from './pages/prof/ProfProfile';
import { ProfRequests } from './pages/prof/ProfRequests';
import { SuperAdminLayout } from './components/SuperAdminLayout';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { SuperAdminHome } from './pages/super-admin/SuperAdminHome';
import { SuperAdminSchools } from './pages/super-admin/SuperAdminSchools';
import { SuperAdminSubscriptions } from './pages/super-admin/SuperAdminSubscriptions';
import { SuperAdminSupport } from './pages/super-admin/SuperAdminSupport';
import { SuperAdminAds } from './pages/super-admin/SuperAdminAds';
import { SuperAdminSettings } from './pages/super-admin/SuperAdminSettings';
import { AdminHome } from './pages/AdminHome';
import { useStore } from './store';

import { LandingPage } from './pages/LandingPage';
import { QuickAttendance } from './pages/QuickAttendance';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore(state => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import { Support } from './pages/Support';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quick-attendance" element={<QuickAttendance />} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperAdminHome />} />
          <Route path="inscriptions" element={<SuperAdminDashboard />} />
          <Route path="etablissements" element={<SuperAdminSchools />} />
          <Route path="abonnements" element={<SuperAdminSubscriptions />} />
          <Route path="annonces" element={<SuperAdminAds />} />
          <Route path="supports" element={<SuperAdminSupport />} />
          <Route path="parametres" element={<SuperAdminSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="professors" element={<Professors />} />
          <Route path="professors/:id" element={<ProfessorDetail />} />
          <Route path="classes" element={<ClassesAndSubjects />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="timetable-class" element={<ClassTimetable />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="requests" element={<Requests />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<Support />} />
        </Route>

        {/* Professor Routes */}
        <Route path="/prof" element={<ProtectedRoute><ProfLayout /></ProtectedRoute>}>
          <Route index element={<ProfDashboard />} />
          <Route path="schedule" element={<ProfSchedule />} />
          <Route path="attendance" element={<ProfAttendance />} />
          <Route path="requests" element={<ProfRequests />} />
          <Route path="payroll" element={<ProfPayroll />} />
          <Route path="profile" element={<ProfProfile />} />
          <Route path="support" element={<Support />} />
        </Route>

        {/* Redirect for old root if authenticated */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
