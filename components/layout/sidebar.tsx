"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Building2,
  CreditCard,
  Wrench,
  FileText,
  Users,
  Settings,
  LogOut,
  User,
  Phone,
  FileBarChart,
  Menu,
  X,
  MapPin,
  Calendar
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/layout/notification-bell"

interface SidebarProps {
  role: "landlord" | "tenant" | "broker"
  userName?: string
  userId?: string
}

const landlordNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, id: undefined },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Building2, id: undefined },
  { href: "/dashboard/mapa", label: "Mapa", icon: MapPin, id: undefined },
  { href: "/dashboard/calendario", label: "Calendario", icon: Calendar, id: undefined },
  { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard, id: "sidebar-pagos" },
  { href: "/dashboard/servicios", label: "Servicios", icon: FileBarChart, id: undefined },
  { href: "/dashboard/mantenciones", label: "Mantenciones", icon: Wrench, id: "sidebar-mantenciones" },
  { href: "/dashboard/contratos", label: "Contratos", icon: FileText, id: undefined },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: Users, id: "sidebar-servicios" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, id: undefined },
]

const tenantNavItems = [
  { href: "/mi-arriendo", label: "Resumen", icon: Home, id: undefined },
  { href: "/mi-arriendo/pagos", label: "Pagos", icon: CreditCard, id: undefined },
  { href: "/mi-arriendo/servicios", label: "Servicios", icon: FileBarChart, id: undefined },
  { href: "/mi-arriendo/mantenciones", label: "Mantenciones", icon: Wrench, id: undefined },
  { href: "/mi-arriendo/contrato", label: "Contrato", icon: FileText, id: undefined },
  { href: "/mi-arriendo/contactos", label: "Contactos", icon: Phone, id: undefined },
]

const brokerNavItems = [
  { href: "/broker", label: "Panel", icon: Home, id: undefined },
  { href: "/broker/propiedades", label: "Propiedades", icon: Building2, id: undefined },
  { href: "/broker/mandatos", label: "Mandatos", icon: FileText, id: undefined },
  { href: "/broker/calendario", label: "Calendario", icon: Calendar, id: undefined },
  { href: "/broker/configuracion", label: "Configuración", icon: Settings, id: undefined },
]

export function Sidebar({ role, userName = "Usuario Demo", userId }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const navItems = 
    role === "landlord" ? landlordNavItems : 
    role === "broker" ? brokerNavItems : 
    tenantNavItems

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden text-[#FAF6F2] hover:bg-[#D5C3B6]/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1C1917]/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#2D3C3C] flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none border-r border-[#D5C3B6]/10",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div id="sidebar-logo" className="flex items-center justify-between px-6 py-6 border-b border-[#D5C3B6]/10">
          <span className="text-2xl font-serif font-semibold tracking-tight text-[#D5C3B6]">NeiFe</span>
          <NotificationBell />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-medium uppercase tracking-widest text-[#B8965A]">
            {role === "landlord" ? "Panel Arrendador" : role === "broker" ? "Panel Corredor" : "Mi Arriendo"}
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && item.href !== "/mi-arriendo" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-[#D5C3B6]/10 text-[#FAF6F2]"
                    : "text-[#9C8578] hover:bg-[#D5C3B6]/5 hover:text-[#D5C3B6]"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isActive ? "text-[#5E8B8C]" : ""
                )} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5E8B8C]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-[#D5C3B6]/10 p-4">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#1C1917]/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5E8B8C] to-[#5E8B8C]/70 flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="h-5 w-5 text-[#FAF6F2]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#FAF6F2] truncate">
                {userName}
              </p>
              <span className={cn(
                "inline-block px-2 py-0.5 text-xs rounded-full font-medium uppercase tracking-wider",
                role === "landlord" 
                  ? "bg-[#75524C]/30 text-[#D5C3B6]" 
                  : role === "broker"
                  ? "bg-[#5E8B8C]/30 text-[#5E8B8C]"
                  : "bg-[#5E8B8C]/30 text-[#5E8B8C]"
              )}>
                {role === "landlord" ? "Arrendador" : role === "broker" ? "Corredor" : "Arrendatario"}
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-3 text-sm text-[#9C8578] hover:text-[#C27F79] transition-colors duration-300 rounded-xl hover:bg-[#C27F79]/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Link>
        </div>
      </aside>
    </>
  )
}
