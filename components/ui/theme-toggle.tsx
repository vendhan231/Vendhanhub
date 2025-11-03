import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

// Lightweight theme helpers scoped to this component
const getThemeLocal = () => {
  try {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  } catch {
    return 'light'
  }
}

const setThemeLocal = (t: 'light' | 'dark') => {
  try {
    localStorage.setItem('theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  } catch {}
}

export function ThemeToggle() {
  const [_theme, setThemeState] = React.useState<'light' | 'dark'>(getThemeLocal())

  React.useEffect(() => {
    const currentTheme = getThemeLocal()
    setThemeState(currentTheme)
    setThemeLocal(currentTheme)
  }, [])

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    setThemeLocal(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}