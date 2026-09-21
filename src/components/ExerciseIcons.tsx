// Los tres iconos son los mismos que sirve la app de Glide en sus pestañas
// (`/icons/<hash>-1.svg#Bold`): rack de sentadilla, figura haciendo press y
// barra con discos. Se copian los trazados tal cual; lo único que cambia es
// el `fill="currentColor"`, para que hereden el color del enlace como allí.

interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
})

export function SquatIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14,12.75H10a1.5,1.5,0,0,0,0,3h.5a.5.5,0,0,1,.5.5v2.5a.5.5,0,0,1-.5.5,1,1,0,0,0,0,2h3a1,1,0,0,0,0-2,.5.5,0,0,1-.5-.5v-2.5a.5.5,0,0,1,.5-.5H14a1.5,1.5,0,0,0,0-3Z" />
      <path d="M22.5,2.75h-1A1.5,1.5,0,0,0,20,4.25v1.5a.5.5,0,0,1-.5.5H19a.5.5,0,0,1-.5-.5v-2a1,1,0,0,0-2,0v2a.5.5,0,0,1-.5.5H8a.5.5,0,0,1-.5-.5V4.25a1,1,0,0,0-2,0v1.5a.5.5,0,0,1-.5.5H4.5a.5.5,0,0,1-.5-.5V4.25a1.5,1.5,0,0,0-1.5-1.5h-1A1.5,1.5,0,0,0,0,4.25v6a1.5,1.5,0,0,0,1.5,1.5h1A1.5,1.5,0,0,0,4,10.25V8.75a.5.5,0,0,1,.5-.5H5a.5.5,0,0,1,.5.5v11.5a1,1,0,0,0,2,0V8.75a.5.5,0,0,1,.5-.5h8a.5.5,0,0,1,.5.5v11a1,1,0,0,0,2,0v-11a.5.5,0,0,1,.5-.5h.5a.5.5,0,0,1,.5.5v1.5a1.5,1.5,0,0,0,1.5,1.5h1a1.5,1.5,0,0,0,1.5-1.5v-6A1.5,1.5,0,0,0,22.5,2.75Z" />
    </svg>
  )
}

export function PressIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="7.712" r="2.5" />
      <path d="M23.507.628,21.535.3a.5.5,0,0,0-.576.41l-.176,1.038a.5.5,0,0,1-.626.4,32.882,32.882,0,0,0-16.372-.25.5.5,0,0,1-.611-.4L3.041.705A.5.5,0,0,0,2.465.3L.493.628a.5.5,0,0,0-.41.577l1,5.916a.5.5,0,0,0,.577.41L3.632,7.2a.5.5,0,0,0,.409-.576l-.366-2.17a.5.5,0,0,1,.371-.568,30.823,30.823,0,0,1,15.879.271.5.5,0,0,1,.355.564l-.321,1.9a.5.5,0,0,0,.409.576l1.972.334a.5.5,0,0,0,.577-.41l1-5.916A.5.5,0,0,0,23.507.628Z" />
      <path d="M17.5,4.712a1.25,1.25,0,0,0-1.25,1.25v1.5a4.255,4.255,0,0,1-4.674,4.229A4.378,4.378,0,0,1,7.75,7.273V5.962a1.25,1.25,0,0,0-2.5,0V7.226A7.061,7.061,0,0,0,9,13.492v9.72a.5.5,0,0,0,.5.5H11a.5.5,0,0,0,.5-.5v-2.5a.5.5,0,0,1,1,0v2.5a.5.5,0,0,0,.5.5h1.5a.5.5,0,0,0,.5-.5V13.5a6.749,6.749,0,0,0,3.75-6.035v-1.5A1.25,1.25,0,0,0,17.5,4.712Z" />
    </svg>
  )
}

export function DeadliftIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2,7.5H1a1,1,0,0,0-1,1v7a1,1,0,0,0,1,1H2a.5.5,0,0,0,.5-.5V8A.5.5,0,0,0,2,7.5Z" />
      <path d="M7,5.5H4.5a1,1,0,0,0-1,1v11a1,1,0,0,0,1,1H7a.5.5,0,0,0,.5-.5V6A.5.5,0,0,0,7,5.5Z" />
      <path d="M23,7.5H22a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h1a1,1,0,0,0,1-1v-7A1,1,0,0,0,23,7.5Z" />
      <path d="M19.5,5.5H17a.5.5,0,0,0-.5.5V18a.5.5,0,0,0,.5.5h2.5a1,1,0,0,0,1-1V6.5A1,1,0,0,0,19.5,5.5Z" />
      <rect x="8.5" y="10.5" width="7" height="3" rx="0.5" ry="0.5" />
    </svg>
  )
}
