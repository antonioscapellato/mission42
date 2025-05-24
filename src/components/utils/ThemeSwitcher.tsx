// app/components/ThemeSwitcher.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LuSunMedium, LuMoon } from "react-icons/lu";

// HeroUI
import { Button } from "@heroui/react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if(!mounted) return null

  return (
    <Button
      onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      size="md"
      className={"bg-transparent"}
      radius={"full"}
      isIconOnly
    >
      {theme === 'dark' ? <LuSunMedium className="h-5 w-5 text-default-500" /> : <LuMoon className="h-5 w-5 text-default-500" />}
    </Button>
  )
};