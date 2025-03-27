import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-purple-800">Quizlytics</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </header>

        <main className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Smart Quiz Creation & Analysis Platform</h2>
            <p className="text-xl text-gray-700 mb-8">
              Create interactive quizzes, track student performance, and gain valuable insights with our comprehensive
              analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/teacher/dashboard">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Teacher Portal
                </Button>
              </Link>
              <Link href="/student/dashboard">
                <Button size="lg" variant="outline" className="text-purple-600 border-purple-600">
                  <span className="text-indigo-500 font-bold">Student Portal</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 opacity-90 rounded-lg"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
              <h3 className="text-3xl font-bold mb-4">Key Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Real-time performance analysis</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Customizable quiz settings</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Detailed analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Downloadable PDF reports</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

