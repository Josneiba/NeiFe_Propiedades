"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  X,
  MapPin,
  Calendar,
  LayoutDashboard,
  BarChart3,
  Kanban,
  ChevronLeft,
  ChevronRight,
  Target,
  MessageSquare,
  TrendingUp,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useCrmAlerts } from "@/hooks/useCrmAlerts";
import { SidebarSearch } from '@/components/layout/sidebar-search'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  role: "landlord" | "tenant" | "broker";
  userName?: string;
  userId?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  id: string | undefined;
}

const landlordNavGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Vista General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home, id: undefined },
      { href: "/dashboard/mapa", label: "Mapa", icon: MapPin, id: undefined },
      {
        href: "/dashboard/calendario",
        label: "Calendario",
        icon: Calendar,
        id: undefined,
      },
    ],
  },
  {
    label: "Gestion",
    items: [
      {
        href: "/dashboard/propiedades",
        label: "Propiedades",
        icon: Building2,
        id: undefined,
      },
      {
        href: "/dashboard/pagos",
        label: "Pagos",
        icon: CreditCard,
        id: "sidebar-pagos",
      },
      {
        href: "/dashboard/contratos",
        label: "Contratos",
        icon: FileText,
        id: undefined,
      },
      {
        href: "/dashboard/postulaciones",
        label: "Postulaciones",
        icon: Users,
        id: undefined,
      },
      {
        href: "/dashboard/mantenciones",
        label: "Mantenciones",
        icon: Wrench,
        id: "sidebar-mantenciones",
      },
      {
        href: "/dashboard/servicios",
        label: "Servicios",
        icon: FileBarChart,
        id: undefined,
      },
      {
        href: "/dashboard/proveedores",
        label: "Proveedores",
        icon: Users,
        id: "sidebar-servicios",
      },
    ],
  },
  {
    label: "Coordinacion",
    items: [
      {
        href: "/dashboard/solicitudes-corredores",
        label: "Corredores",
        icon: User,
        id: undefined,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/dashboard/configuracion",
        label: "Configuración",
        icon: Settings,
        id: undefined,
      },
    ],
  },
];

const tenantNavItems: NavItem[] = [
  { href: "/mi-arriendo", label: "Resumen", icon: Home, id: undefined },
  {
    href: "/mi-arriendo/pagos",
    label: "Pagos",
    icon: CreditCard,
    id: undefined,
  },
  {
    href: "/mi-arriendo/servicios",
    label: "Servicios",
    icon: FileBarChart,
    id: undefined,
  },
  {
    href: "/mi-arriendo/mantenciones",
    label: "Mantenciones",
    icon: Wrench,
    id: undefined,
  },
  {
    href: "/mi-arriendo/contrato",
    label: "Contrato",
    icon: FileText,
    id: undefined,
  },
  {
    href: "/mi-arriendo/contactos",
    label: "Contactos",
    icon: Phone,
    id: undefined,
  },
 ];

const SUBROUTE_TITLE_OVERRIDES: Record<string, string> = {
  '/broker/crm/contactos/filtros': 'Estados y filtros',
  '/broker/crm/contactos/enviar': 'Enviar',
  '/broker/crm/contactos/nuevo': 'Nuevo contacto',
  '/broker/crm/mi-dia': 'Mi Día',
  '/broker/crm/calendario': 'Calendario CRM',
}

const brokerNavGroups: Array<{ label: string; items: NavItem[] }> = [
      {
        label: "CRM",
        items: [
          {
            href: "/broker/crm/mi-dia",
            label: "Mi Día",
            icon: Target,
            id: undefined,
          },
          {
            href: "/broker/crm/contactos",
            label: "Contactos",
            icon: Users,
            id: undefined,
          },
          {
            href: "/broker/crm/workspace",
            label: "Workspace",
            icon: Kanban,
            id: undefined,
          },
          {
            href: "/broker/crm/calendario",
            label: "Calendario",
            icon: Calendar,
            id: undefined,
          },
        ],
      },
  {
    label: "General",
    items: [
      { href: "/broker", label: "Panel", icon: Home, id: undefined },
      {
        href: "/broker/propiedades",
        label: "Propiedades",
        icon: Building2,
        id: undefined,
      },
      {
        href: "/broker/clientes",
        label: "Clientes",
        icon: Building2,
        id: undefined,
      },
      {
        href: "/broker/mandatos",
        label: "Mandatos",
        icon: FileText,
        id: undefined,
      },
      {
        href: "/broker/calendario",
        label: "Crear eventos",
        icon: Calendar,
        id: undefined,
      },
    ],
  },
  {
    label: "Operaciones",
    items: [
      {
        href: "/broker/pagos",
        label: "Pagos",
        icon: CreditCard,
        id: undefined,
      },
      {
        href: "/broker/servicios",
        label: "Servicios",
        icon: FileBarChart,
        id: undefined,
      },
      {
        href: "/broker/contratos",
        label: "Contratos",
        icon: FileText,
        id: undefined,
      },
      {
        href: "/broker/mantenciones",
        label: "Mantenciones",
        icon: Wrench,
        id: undefined,
      },
      {
        href: "/broker/rendiciones",
        label: "Rendiciones",
        icon: FileBarChart,
        id: undefined,
      },
      { href: "/broker/avisos", label: "Avisos", icon: Phone, id: undefined },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/broker/settings",
        label: "Configuración",
        icon: Settings,
        id: undefined,
      },
    ],
  },
];

export function Sidebar({
  role,
  userName = "Usuario Demo",
  userId,
}: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Mobile: collapsed by default
  const { totalAlerts } = useCrmAlerts();

  const currentPageTitle = useMemo(() => {
    const route = pathname || '/'
    const override = SUBROUTE_TITLE_OVERRIDES[route]
    if (override) return override

    const allItems: NavItem[] = [...landlordNavGroups.flatMap((group) => group.items), ...tenantNavItems, ...brokerNavGroups.flatMap((group) => group.items)]
    const match = allItems.find((item) => route === item.href || (item.href !== '/' && route.startsWith(item.href)))
    return match?.label ?? 'NeiFe'
  }, [pathname])

  return (
    <>
      {/* Barra superior móvil: ocupa su propio espacio en el flujo del documento
          (sticky, no fixed) para que no quede un hueco en blanco arriba del
          contenido. El logo grande es el elemento dominante y "Menú" queda como
          una etiqueta diminuta debajo para indicar la acción del botón. */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#D5C3B6]/10 bg-[#1C2828] px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
          className="flex flex-col items-center gap-0.5 rounded-xl bg-[#2D3C3C] px-3.5 py-1.5 text-[#D5C3B6] transition hover:bg-[#3a4a4a]"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <img src="/logo.svg" alt="NeiFe" className="h-7 w-7 object-contain" />
              <span className="text-[8px] font-medium uppercase tracking-wider text-[#9C8578]">Menú</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block rounded-full bg-[#2D3C3C] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9C8578]">
            {currentPageTitle}
          </div>
          <NotificationBell userRole={role} />
        </div>
      </div>

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
          "fixed lg:sticky inset-y-0 left-0 z-50 flex flex-col transform transition-all duration-300 ease-in-out border-r border-[#D5C3B6]/10 bg-gradient-to-b from-[#2D3C3C] to-[#1C2828]",
          isCollapsed ? "w-20 lg:w-20" : "w-52 lg:w-52",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header: Logo + Campana + Botón colapsar — siempre visibles */}
        <div className="border-b border-[#D5C3B6]/10">
          {/* Fila 1: Logo + Campana — responsive layout */}
          <div
            id="sidebar-logo"
            className={cn(
              "flex transition-all duration-300",
              isCollapsed
                ? "flex-col items-center gap-2 px-2 py-3"
                : "flex-row items-center justify-between px-6 py-4"
            )}
          >
            <span
              className={cn(
                "flex items-center font-serif font-semibold tracking-tight text-[#D5C3B6]",
                isCollapsed ? "text-sm" : "text-xl"
              )}
            >
              <img src="/logo.svg" alt="NeiFe" className={cn(isCollapsed ? 'h-5 w-5' : 'h-7 w-7 mr-2')} />
              {!isCollapsed && <span className="align-middle">NeiFe</span>}
            </span>
            <NotificationBell userRole={role} />
          </div>

          {/* Fila 2: Botón colapsar — solo desktop, sin burbuja */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex items-center justify-center transition-all duration-200",
              "text-[#9C8578] hover:text-[#D5C3B6]",
              isCollapsed ? "w-full py-2 px-2" : "w-full py-2 mx-0",
            )}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {role === 'broker' && <SidebarSearch isCollapsed={isCollapsed} />}

        {/* Navigation */}
        {role === "landlord" ? (
          <nav
            className={cn(
              "flex-1 overflow-y-auto space-y-6 transition-all duration-300",
              isCollapsed ? "px-1 py-4" : "py-6 px-4",
            )}
          >
            {landlordNavGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#B8965A]/60">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            id={item.id}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                              isCollapsed
                                ? "justify-center px-2 py-2.5"
                                : "px-4 py-2.5",
                              isActive
                                ? "bg-[#D5C3B6]/10 text-[#FAF6F2]"
                                : "text-[#9C8578] hover:bg-[#D5C3B6]/5 hover:text-[#D5C3B6]",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-[#5E8B8C]" : "",
                              )}
                            />
                            {!isCollapsed && item.label}
                            {!isCollapsed && isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5E8B8C]" />
                            )}
                          </Link>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        ) : role === "broker" ? (
          <nav
            className={cn(
              "flex-1 overflow-y-auto space-y-6 transition-all duration-300",
              isCollapsed ? "px-1 py-4" : "py-6 px-4",
            )}
          >
            {brokerNavGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#B8965A]/60">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/broker" &&
                        pathname.startsWith(item.href));
                    const isMiDia = item.href === "/broker/crm/mi-dia";
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            id={item.id}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                              isCollapsed
                                ? "justify-center px-2 py-2.5"
                                : "px-4 py-2.5",
                              isActive
                                ? "bg-[#D5C3B6]/10 text-[#FAF6F2]"
                                : "text-[#9C8578] hover:bg-[#D5C3B6]/5 hover:text-[#D5C3B6]",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-[#5E8B8C]" : "",
                              )}
                            />
                            {!isCollapsed && (
                              <div className="flex items-center gap-2 flex-1">
                                {item.label}
                                {isMiDia && totalAlerts > 0 && (
                                  <div className="ml-auto flex items-center justify-center bg-red-500 text-[#FAF6F2] rounded-full h-5 w-5 text-[10px] font-semibold">
                                    {totalAlerts > 9 ? "9+" : totalAlerts}
                                  </div>
                                )}
                              </div>
                            )}
                            {!isCollapsed && isActive && !isMiDia && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5E8B8C]" />
                            )}
                          </Link>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            <div className="flex items-center gap-1">
                              <p>{item.label}</p>
                              {isMiDia && totalAlerts > 0 && (
                                <div className="ml-1 flex items-center justify-center bg-red-500 text-[#FAF6F2] rounded-full h-4 w-4 text-[8px] font-semibold">
                                  {totalAlerts}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        ) : (
          <nav
            className={cn(
              "flex-1 overflow-y-auto space-y-1 transition-all duration-300",
              isCollapsed ? "px-1 py-4" : "py-6 px-4",
            )}
          >
            {!isCollapsed && (
              <p className="px-3 mb-3 text-xs font-medium uppercase tracking-widest text-[#B8965A]/60">
                Mi Arriendo
              </p>
            )}
            {tenantNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  item.href !== "/mi-arriendo" &&
                  pathname.startsWith(item.href));
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      id={item.id}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300",
                        isCollapsed
                          ? "justify-center px-2 py-2.5"
                          : "px-4 py-3",
                        isActive
                          ? "bg-[#D5C3B6]/10 text-[#FAF6F2]"
                          : "text-[#9C8578] hover:bg-[#D5C3B6]/5 hover:text-[#D5C3B6]",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          isActive ? "text-[#5E8B8C]" : "",
                        )}
                      />
                      {!isCollapsed && item.label}
                      {!isCollapsed && isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5E8B8C]" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        )}

        {/* User section — solo usuario y logout */}
        <div
          className={cn(
            "border-t border-[#D5C3B6]/10 space-y-3",
            isCollapsed ? "p-2" : "p-4",
          )}
        >
          {/* User info — solo en expandido */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1917]/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5E8B8C] to-[#5E8B8C]/70 flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="h-5 w-5 text-[#FAF6F2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#FAF6F2] truncate">
                  {userName}
                </p>
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 text-xs rounded-full font-medium uppercase tracking-wider",
                    role === "landlord"
                      ? "bg-[#75524C]/30 text-[#D5C3B6]"
                      : role === "broker"
                        ? "bg-[#5E8B8C]/30 text-[#5E8B8C]"
                        : "bg-[#5E8B8C]/30 text-[#5E8B8C]",
                  )}
                >
                  {role === "landlord"
                    ? "Propietario"
                    : role === "broker"
                      ? "Corredor"
                      : "Arrendatario"}
                </span>
              </div>
            </div>
          )}

          {/* Logout button */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm text-[#9C8578] hover:text-[#C27F79] transition-colors duration-300 rounded-xl hover:bg-[#C27F79]/10",
              isCollapsed && "justify-center",
            )}
            title={isCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Cerrar sesión"}
          </Link>
        </div>
      </aside>
    </>
  );
}
