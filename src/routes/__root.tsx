import { createRootRoute, Outlet, Link, useLocation, Navigate } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { SquatIcon, PressIcon, DeadliftIcon } from '@/components/ExerciseIcons'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/squat', label: t.tabs.squat, Icon: SquatIcon },
  { path: '/press', label: t.tabs.press, Icon: PressIcon },
  { path: '/deadlift', label: t.tabs.deadlift, Icon: DeadliftIcon },
] as const

function RootLayout() {
  const location = useLocation()

  // Redirect / to /squat
  if (location.pathname === '/') {
    return <Navigate to="/squat" />
  }

  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        {/* Cabecera teal con el logo de la app, igual que en Glide: 56 px de
            alto y el filo claro de un píxel por debajo. */}
        <header
          className="sticky top-0 z-50 flex h-14 items-center gap-2.5 bg-[var(--header)] px-4"
          style={{ boxShadow: 'rgba(255, 255, 255, 0.05) 0px 1px 0px 0px' }}
        >
          <img src="/glide-logo.png" alt="" className="h-6 w-6 rounded" />
          <span className="text-base font-semibold text-[var(--header-foreground)]">
            {t.appName}
          </span>
        </header>

        <main className="flex-1 pb-24">
          <Outlet />
        </main>

        {/* Glide pone las pestañas dentro de la barra teal; aquí van abajo,
            que es donde caen en una PWA de móvil, pero con su mismo teal y su
            píldora blanca translúcida para la activa. */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--header)] pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-md justify-around gap-1 px-2 py-2">
            {tabs.map(({ path, label, Icon }) => {
              const isActive = location.pathname === path

              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--header-active)] text-[var(--header-foreground)]'
                      : 'text-[var(--header-foreground-dim)] hover:bg-[var(--header-active)]'
                  )}
                >
                  <Icon size={20} />
                  <span>{label}</span>
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
