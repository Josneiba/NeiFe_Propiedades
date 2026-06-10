'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Contact {
  id: string
  code: string
  name: string
  email: string | null
  phone: string | null
  type: 'PROPIETARIO' | 'ARRENDATARIO' | 'INVERSIONISTA' | 'LEAD'
  status: 'ACTIVE' | 'INACTIVE' | 'CONVERTED' | 'LOST'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  deals: Array<{ deal: { id: string; code: string; title: string; stage: string } }>
  score: { score: number; recommendation: string } | null
}

interface ContactsTableProps {
  contacts: Contact[]
  isLoading: boolean
  onDelete?: (id: string) => void
  onEdit?: (contact: Contact) => void
}

const typeColors: Record<string, string> = {
  PROPIETARIO: 'bg-blue-100 text-blue-800',
  ARRENDATARIO: 'bg-green-100 text-green-800',
  INVERSIONISTA: 'bg-purple-100 text-purple-800',
  LEAD: 'bg-orange-100 text-orange-800',
}

const typeLabels: Record<string, string> = {
  PROPIETARIO: 'Propietario',
  ARRENDATARIO: 'Arrendatario',
  INVERSIONISTA: 'Inversor',
  LEAD: 'Lead',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  CONVERTED: 'bg-blue-100 text-blue-800',
  LOST: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-gray-100 text-gray-800',
  LOW: 'bg-blue-100 text-blue-800',
}

export function ContactsTable({
  contacts,
  isLoading,
  onDelete,
  onEdit,
}: ContactsTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[120px]">ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-center">Prioridad</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Propiedades</TableHead>
            <TableHead className="w-[50px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Cargando contactos...
              </TableCell>
            </TableRow>
          ) : contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                No hay contactos
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">{contact.code}</TableCell>
                <TableCell className="font-medium">
                  <Link href={`/broker/crm/contactos/${contact.id}`} className="hover:underline">
                    {contact.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge className={typeColors[contact.type]}>
                    {typeLabels[contact.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{contact.email || '—'}</TableCell>
                <TableCell className="text-sm">{contact.phone || '—'}</TableCell>
                <TableCell className="text-center">
                  <Badge className={priorityColors[contact.priority]}>
                    {contact.priority === 'HIGH'
                      ? 'Alta'
                      : contact.priority === 'MEDIUM'
                        ? 'Media'
                        : 'Baja'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={statusColors[contact.status]}>
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{contact.deals.length}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/broker/crm/contactos/${contact.id}`} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(contact.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
