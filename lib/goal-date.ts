export function getCurrentYear(date = new Date()) {
  return date.getFullYear()
}

export function getCurrentMonth(date = new Date()) {
  return date.getMonth() + 1
}

export function getCurrentWeekNumber(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNr = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNr)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function getISOWeekRange(week: number, year: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Start = new Date(jan4)
  week1Start.setUTCDate(jan4.getUTCDate() + 1 - jan4Day)
  const start = new Date(week1Start.getTime() + (week - 1) * 7 * 86_400_000)
  const end = new Date(start.getTime() + 7 * 86_400_000)
  return { start, end }
}
