// La portada de cada pestaña en Glide: una franja teal, el icono naranja de
// la app montado sobre su borde inferior (120 px y esquinas de 12) y el
// título al lado. Se replica aquí a escala de móvil.

interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="relative">
      <div className="h-14 bg-[var(--header)]" />
      <div className="mx-auto flex max-w-md items-end gap-3 px-4">
        <img
          src="/gym-logo.png"
          alt=""
          className="-mt-10 h-24 w-24 shrink-0 rounded-xl"
        />
        <h1 className="pb-2 text-xl font-semibold text-[var(--foreground)]">
          {title}
        </h1>
      </div>
    </div>
  )
}
