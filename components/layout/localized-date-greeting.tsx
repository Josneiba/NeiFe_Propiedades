"use client"

import { useEffect, useState } from "react"

interface LocalizedDateGreetingProps {
  name?: string | null
  subtitle?: string
  headingClassName?: string
  dateClassName?: string
  subtitleClassName?: string
}

function buildGreeting(now: Date) {
  const hour = now.getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 18) return "Buenas tardes"
  return "Buenas noches"
}

function buildDate(now: Date) {
  return now.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function LocalizedDateGreeting({
  name,
  subtitle,
  headingClassName,
  dateClassName,
  subtitleClassName,
}: LocalizedDateGreetingProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const update = () => setNow(new Date())
    update()
    const timer = window.setInterval(update, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const greeting = now ? buildGreeting(now) : "Hola"
  const formattedDate = now ? buildDate(now) : ""
  const firstName = name?.split(" ")[0] || "Usuario"

  return (
    <div>
      <p className={dateClassName}>{formattedDate}</p>
      <h1 className={headingClassName}>
        {greeting}, <span className="text-[#D5C3B6]">{firstName}</span>
      </h1>
      {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
    </div>
  )
}
