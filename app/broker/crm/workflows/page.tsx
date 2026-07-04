import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import React from 'react'

async function getWorkflows() {
  return prisma.crmWorkflow.findMany({ include: { stages: { orderBy: { order: 'asc' } } }, orderBy: [{ type: 'asc' }, { isDefault: 'desc' }] })
}

export default async function Page() {
  const workflows = await getWorkflows()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Workflows CRM</h1>
      <div className="space-y-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="border rounded p-4 bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{wf.type}</div>
                <div className="text-lg font-medium">{wf.name} {wf.isDefault ? '· por defecto' : ''}</div>
                <div className="text-sm text-muted-foreground">{wf.description}</div>
              </div>
              <div className="text-right">
                <Link href={`/broker/crm/workflows/${wf.id}`} className="text-sm text-blue-400">Ver / Editar</Link>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {wf.stages.map((s) => (
                <div key={s.id} className="text-xs rounded bg-gray-800 p-2">{s.order}. {s.name}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-2">Crear Workflow</h2>
        <form id="create-workflow" action="/api/crm/workflows" method="post" className="space-y-2">
          <div>
            <input name="name" placeholder="Nombre" className="p-2 rounded w-full bg-gray-900" />
          </div>
          <div>
            <select name="type" className="p-2 rounded w-full bg-gray-900">
              <option value="ARRIENDO">Arriendo</option>
              <option value="VENTA">Venta</option>
              <option value="ADMINISTRACION">Administración</option>
            </select>
          </div>
          <div>
            <textarea name="description" placeholder="Descripción" className="p-2 rounded w-full bg-gray-900" />
          </div>
          <div>
            <button type="submit" className="px-3 py-2 bg-green-600 rounded">Crear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
