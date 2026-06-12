import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { StudentsPage } from '@/pages/Students'
import { StudentDetailPage } from '@/pages/Students/StudentDetail'
import { PlansPage } from '@/pages/Plans'
import { FinancialPage } from '@/pages/Financial'
import { ClassesPage } from '@/pages/Classes'
import { AttendancePage } from '@/pages/Attendance'
import { GraduationPage } from '@/pages/Graduation'
import { InstructorsPage } from '@/pages/Instructors'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/students', element: <StudentsPage /> },
          { path: '/students/:id', element: <StudentDetailPage /> },
          { path: '/plans', element: <PlansPage /> },
          { path: '/financial', element: <FinancialPage /> },
          { path: '/classes', element: <ClassesPage /> },
          { path: '/attendance', element: <AttendancePage /> },
          { path: '/instructors', element: <InstructorsPage /> },
          { path: '/graduation', element: <GraduationPage /> },
        ],
      },
    ],
  },
])
