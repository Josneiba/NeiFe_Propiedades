 'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineTab } from './planning-center-pipeline'
import { EstrategiasTab } from './planning-center-estrategias'
import { GoalDashboard } from './goal-dashboard'
import { BarChart3, TrendingUp, Zap } from 'lucide-react'

import type { BrokerGoalProgress } from '@/lib/goal-engine'

export function PlanningCenter() {
  const [progress, setProgress] = useState<BrokerGoalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProgress() {
      try {
        // Load broker goal progress data
        const res = await fetch('/api/broker/goals')
        if (!res.ok) {
          // If goals endpoint doesn't exist, just use empty array
          console.warn('Goals endpoint not available')
          setProgress([])
        } else {
          const data = await res.json()
          // Transform goals data into progress format if needed
          setProgress(Array.isArray(data) ? data : data.progress ?? [])
        }
      } catch (err) {
        console.warn('Could not load goal progress:', err)
        setProgress([])
      } finally {
        setLoading(false)
      }
    }
    void loadProgress()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FAF6F2]">Centro de Planificación Comercial</h1>
          <p className="mt-2 text-sm text-[#D5C3B6]/70">Visualiza tu pipeline, gestiona estrategias y monitorea KPIs</p>
        </div>
        <div className="rounded-full bg-[#253336] p-3">
          <TrendingUp className="h-6 w-6 text-[#5E8B8C]" />
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-full p-1 flex gap-0">
          <TabsTrigger 
            value="pipeline" 
            className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578] flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger 
            value="estrategias" 
            className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578] flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Estrategias
          </TabsTrigger>
          <TabsTrigger 
            value="kpis" 
            className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578] flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            KPIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          {loading ? (
            <div className="rounded-lg bg-[#1a2a2a] p-6 text-center text-[#9C8578]">
              Cargando pipeline...
            </div>
          ) : (
            <PipelineTab />
          )}
        </TabsContent>

        <TabsContent value="estrategias" className="space-y-4">
          {loading ? (
            <div className="rounded-lg bg-[#1a2a2a] p-6 text-center text-[#9C8578]">
              Cargando estrategias...
            </div>
          ) : (
            <EstrategiasTab />
          )}
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <GoalDashboard progress={progress} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
