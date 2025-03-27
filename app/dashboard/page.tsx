"use client"

import { useAuth } from "@/lib/auth-context"
import TeacherDashboard from "@/components/teacher-dashboard"
import StudentDashboard from "@/components/student-dashboard"

export default function Dashboard() {
  const { user } = useAuth()

  if (!user) return null

  return <div>{user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}</div>
}

