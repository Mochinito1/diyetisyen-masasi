const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  danisan: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  hesap: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>,
  besinler: <><path d="M12 7c-2-2-6-1-6 4 0 5 3 9 6 9s6-4 6-9c0-5-4-6-6-4z" /><path d="M12 7c0-2 1-3 3-4" /></>,
  menu: <path d="M6 3v18M6 3c3 0 4 3 4 6s-1 5-4 5M16 3v18M16 3c2 2 3 4 3 7h-3" />,
  randevu: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" /></>,
  disli: <><path d="M10.3 4.3c.4-1.8 2.9-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1.1 2.6c1.8.4 1.8 2.9 0 3.4a1.7 1.7 0 0 0-1.1 2.6c.9 1.5-.8 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1.1c-.4 1.8-2.9 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1.1c-1.5.9-3.3-.8-2.4-2.4a1.7 1.7 0 0 0-1.1-2.6c-1.8-.4-1.8-2.9 0-3.4a1.7 1.7 0 0 0 1.1-2.6c-.9-1.5.8-3.3 2.4-2.4 1 .6 2.3.1 2.6-1.1z" /><circle cx="12" cy="12" r="3" /></>,
  kalkan: <><path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,  ayar: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
}

export type IconName = keyof typeof PATHS

export default function NavIcon({ name, className = 'h-[22px] w-[22px]' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}