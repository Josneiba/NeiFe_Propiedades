'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Edit, Eye, Phone, MessageCircle, MessageSquare } from 'lucide-react'
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
import { toast } from 'sonner'
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
  PROPIETARIO: 'bg-[#5E8B8C]/20 text-[#5E8B8C]',
  ARRENDATARIO: 'bg-[#22c55e]/20 text-[#22c55e]',
  INVERSIONISTA: 'bg-purple-500/20 text-purple-400',
  LEAD: 'bg-orange-500/20 text-orange-400',
}

const typeLabels: Record<string, string> = {
  PROPIETARIO: 'Propietario',
  ARRENDATARIO: 'Arrendatario',
  INVERSIONISTA: 'Inversor',
  LEAD: 'Lead',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-[#22c55e]/20 text-[#22c55e]',
  CONVERTED: 'bg-[#5E8B8C]/20 text-[#5E8B8C]',
  LOST: 'bg-red-500/20 text-red-400',
  INACTIVE: 'bg-[#9C8578]/20 text-[#9C8578]',
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  LOW: 'bg-blue-500/20 text-blue-400',
}

function PhoneActions({ phone, contactName }: { phone: string | null; contactName: string }) {
  if (!phone) return <span className="text-[#9C8578]">—</span>

  const handleCall = () => {
    window.location.href = `tel:${phone}`
  }

  const handleSMS = () => {
    window.location.href = `sms:${phone}`
  }

  const handleWhatsApp = () => {
    // Remove all non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    // Ensure it starts with country code for WhatsApp
    const whatsappPhone = cleanPhone.startsWith('+') ? cleanPhone : `+56${cleanPhone.slice(-9)}`
    window.open(`https://wa.me/${whatsappPhone}?text=Hola%20${encodeURIComponent(contactName)}`,'_blank')
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-[#9C8578] hover:text-[#5E8B8C] hover:bg-[#5E8B8C]/10"
        onClick={handleCall}
        title="Llamar"
      >
        <Phone className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-[#9C8578] hover:text-[#5E8B8C] hover:bg-[#5E8B8C]/10"
        onClick={handleSMS}
        title="SMS"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-[#9C8578] hover:text-[#25D366] hover:bg-[#25D366]/10"
        onClick={handleWhatsApp}
        title="WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ContactsTable({
  contacts,
  isLoading,
  onDelete,
  onEdit,
}: ContactsTableProps) {
  return (
    <div className="border border-[#D5C3B6]/10 rounded-lg bg-[#1C2828]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#2D3C3C]/60 border-b border-[#D5C3B6]/10">
            <TableHead className="w-[120px] text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">ID</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Nombre</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Tipo</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Email</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Teléfono</TableHead>
            <TableHead className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Prioridad</TableHead>
            <TableHead className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Estado</TableHead>
            <TableHead className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Propiedades</TableHead>
            <TableHead className="w-[50px] text-right text-[10px] font-semibold uppercase tracking-wider text-[#9C8578]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="border-b border-[#D5C3B6]/10 hover:bg-[#2D3C3C]/40 transition-colors">
              <TableCell colSpan={9} className="text-center py-8 text-[#9C8578]">
                Cargando contactos...
              </TableCell>
            </TableRow>
          ) : contacts.length === 0 ? (
            <TableRow className="border-b border-[#D5C3B6]/10 hover:bg-[#2D3C3C]/40 transition-colors">
              <TableCell colSpan={9} className="text-center py-8 text-[#9C8578]">
                No hay contactos
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id} className="border-b border-[#D5C3B6]/10 hover:bg-[#2D3C3C]/40 transition-colors">
                <TableCell className="font-mono text-sm text-[#B8965A]">{contact.code}</TableCell>
                <TableCell className="font-medium text-[#FAF6F2]">
                  <Link href={`/broker/crm/contactos/${contact.id}`} className="hover:text-[#5E8B8C] transition-colors">
                    {contact.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge className={typeColors[contact.type]}>
                    {typeLabels[contact.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-[#9C8578]">{contact.email || '—'}</TableCell>
                <TableCell className="text-sm text-[#9C8578]">
                  <PhoneActions phone={contact.phone} contactName={contact.name} />
                </TableCell>
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
                    {contact.status === 'ACTIVE' ? 'Activo' : contact.status === 'CONVERTED' ? 'Convertido' : contact.status === 'LOST' ? 'Perdido' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-[#9C8578]">{contact.deals.length}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#9C8578] hover:text-[#D5C3B6]">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1C2828] border-[#D5C3B6]/10">
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
                        className="text-red-400 focus:bg-red-500/20 focus:text-red-400"
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
