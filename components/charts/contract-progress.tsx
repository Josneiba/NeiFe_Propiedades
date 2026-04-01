"use client"

import { Badge } from "@/components/ui/badge"
import { differenceInMonths, differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"

interface ContractProgressChartProps {
  startDate: Date
  endDate: Date
  size?: "small" | "large"
}

export function ContractProgressChart({ 
  startDate, 
  endDate, 
  size = "large" 
}: ContractProgressChartProps) {
  const today = new Date()
  const totalMonths = differenceInMonths(endDate, startDate)
  const elapsedMonths = differenceInMonths(today, startDate)
  const remainingMonths = Math.max(0, differenceInMonths(endDate, today))
  const remainingDays = Math.max(0, differenceInDays(endDate, today))
  
  const progressPercent = Math.min(100, Math.max(0, (elapsedMonths / totalMonths) * 100))
  const isNearExpiry = remainingMonths <= 3 && remainingMonths > 0
  const isExpired = remainingDays <= 0

  if (size === "small") {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Contrato</span>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">
              {remainingMonths} meses restantes
            </span>
            {isNearExpiry && (
              <Badge variant="outline" className="text-[#C27F79] border-[#C27F79] text-xs py-0">
                Por vencer
              </Badge>
            )}
            {isExpired && (
              <Badge variant="outline" className="text-red-500 border-red-500 text-xs py-0">
                Vencido
              </Badge>
            )}
          </div>
        </div>
        <div className="h-2 bg-[#D5C3B6]/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#5E8B8C] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    )
  }

  // Large size with donut chart
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="flex items-center gap-6">
      {/* Donut Chart */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-[#D5C3B6]/30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={isExpired ? "text-red-500" : isNearExpiry ? "text-[#C27F79]" : "text-[#5E8B8C]"}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{remainingMonths}</span>
          <span className="text-xs text-muted-foreground">meses</span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Inicio</p>
          <p className="font-medium text-foreground">
            {format(startDate, "dd MMM yyyy", { locale: es })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Término</p>
          <p className="font-medium text-foreground">
            {format(endDate, "dd MMM yyyy", { locale: es })}
          </p>
        </div>
        {isNearExpiry && (
          <Badge className="bg-[#C27F79] text-white">
            Próximo a vencer
          </Badge>
        )}
        {isExpired && (
          <Badge className="bg-red-600 text-white">
            Contrato vencido
          </Badge>
        )}
      </div>
    </div>
  )
}
