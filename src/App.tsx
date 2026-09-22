import { useState } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { ToastHost } from './components/Toast';
import { useSession } from './hooks/useSession';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AttendanceHistory } from './pages/AttendanceHistory';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendanceMonitoring } from './pages/AttendanceMonitoring';
import { AdminPayrollPage } from './pages/AdminPayrollPage';
import { EmployeePayslipsPage } from './pages/EmployeePayslipsPage';
import { EmployeeDetail } from './pages/EmployeeDetail';
import { ReportsPage } from './pages/ReportsPage';
import type { Route } from './types';

export default function App() {
  const { user, signIn, signOut } = useSession();
  const [route, setRoute] = useState<Route>('login');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  if (!user) {
    return (
      <>
        <LoginPage
          onLogin={(u) => {
            signIn(u);
            setRoute(u.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
          }}
        />
        <ToastHost />
      </>
    );
  }

  const isAdmin = user.role === 'admin';
  const currentUser = user;

  function openEmployee(id: string) {
    setSelectedEmployee(id);
    setRoute('employee-detail');
  }

  function backFromDetail() {
    setRoute(isAdmin ? 'employees' : 'employee-dashboard');
  }

  function renderContent() {
    if (!isAdmin) {
      switch (route) {
        case 'history':
          return <AttendanceHistory user={currentUser} />;
        case 'payslips':
          return <EmployeePayslipsPage user={currentUser} />;
        case 'profile':
          return <ProfilePage user={currentUser} />;
        case 'employee-dashboard':
        default:
          return <EmployeeDashboard user={currentUser} />;
      }
    }
    switch (route) {
      case 'employees':
        return <EmployeesPage onSelectEmployee={openEmployee} />;
      case 'attendance':
        return <AttendanceMonitoring onSelectEmployee={openEmployee} />;
      case 'payroll':
        return <AdminPayrollPage />;
      case 'reports':
        return <ReportsPage />;
      case 'employee-detail':
        return <EmployeeDetail employeeId={selectedEmployee} onBack={backFromDetail} />;
      case 'admin-dashboard':
      default:
        return <AdminDashboard onSelectEmployee={openEmployee} />;
    }
  }

  return (
    <>
      <AppLayout
        user={user}
        route={route}
        onNavigate={setRoute}
        onLogout={() => {
          signOut();
          setRoute('login');
        }}
      >
        {renderContent()}
      </AppLayout>
      <ToastHost />
    </>
  );
}
