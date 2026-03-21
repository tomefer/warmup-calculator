import { createRootRoute, Outlet, Link, useLocation, Navigate } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { Dumbbell, ArrowUp, Weight } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/squat', label: t.tabs.squat, icon: Dumbbell },
  { path: '/press', label: t.tabs.press, icon: ArrowUp },
  { path: '/deadlift', label: t.tabs.deadlift, icon: Weight },
] as const

function RootLayout() {
  const location = useLocation()

  // Redirect / to /squat
  if (location.pathname === '/') {
    return <Navigate to="/squat" />
  }

  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 bg-[#1a9e75] px-4">
          <img
            src="/gym-logo.png"
            alt="Logo"
            className="h-10 w-10 rounded-lg"
          />
          <span className="text-lg font-medium text-white">{t.appName}</span>
        </header>

        <main className="flex-1 pb-20">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto flex max-w-md justify-around">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path
              const Icon = tab.icon

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    isActive
                      ? 'text-[#1a9e75]'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  <Icon
                    size={24}
                    className={cn(
                      isActive ? 'text-[#1a9e75]' : 'text-gray-400 dark:text-gray-500'
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </ThemeProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
