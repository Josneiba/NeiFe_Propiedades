"use client"

import Link from "next/link"
import { useState, type KeyboardEvent, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, ArrowLeft, Building2, Home, Briefcase, Check, Shield, Mail, Loader2, FileText, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  DOCUMENT_COUNTRIES,
  getDefaultDocumentType,
  getDocumentLabel,
  getDocumentPlaceholder,
  getDocumentTypeOptions,
  type DocumentCountryCode,
  type DocumentTypeCode,
  validateDocument,
} from "@/lib/identity-documents"

type Role = "landlord" | "tenant" | "broker"

const inputClass =
  "bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11"

export default function RegistroClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inviteRole = searchParams.get("role")
  const inviteToken = searchParams.get("invite")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [documentCountry, setDocumentCountry] = useState<DocumentCountryCode>("CL")
  const [documentType, setDocumentType] = useState<DocumentTypeCode>("RUT")
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [documentValid, setDocumentValid] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [verifyCode, setVerifyCode] = useState("")
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [privacy, setPrivacy] = useState({
    terms: false,
    privacyPolicy: false,
    dataConsent: false,
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    documentNumber: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  })
  const invitationCallbackUrl = inviteToken ? `/invitacion/${inviteToken}` : null

  useEffect(() => {
    if (inviteRole === "landlord" || inviteRole === "tenant" || inviteRole === "broker") {
      setSelectedRole(inviteRole)
    } else if (inviteToken && !inviteRole) {
      fetch(`/api/invitations/${inviteToken}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("Invitation lookup failed")
          }

          const contentType = res.headers.get("content-type") || ""
          if (!contentType.includes("application/json")) {
            throw new Error("Invitation lookup did not return JSON")
          }

          return res.json()
        })
        .then((data) => {
          if (data.invitation) {
            if (data.invitation.email) {
              setFormData((prev) => ({ ...prev, email: data.invitation.email }))
            }

            if (data.invitation.type === "BROKER_INVITE") {
              setSelectedRole("landlord")
            } else {
              setSelectedRole("tenant")
            }
          }
        })
        .catch(() => {
          setSelectedRole("tenant")
        })
    }
  }, [inviteToken, inviteRole])

  useEffect(() => {
    if (!inviteToken) return

    fetch(`/api/invitations/${inviteToken}`)
      .then(async (res) => {
        if (!res.ok) return null
        const contentType = res.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) return null
        return res.json()
      })
      .then((data) => {
        if (data?.invitation?.email) {
          setFormData((prev) => ({
            ...prev,
            email: prev.email || data.invitation.email,
          }))
        }
      })
      .catch(() => undefined)
  }, [inviteToken])

  useEffect(() => {
    const defaultType = getDefaultDocumentType(documentCountry)
    setDocumentType(defaultType)
    setDocumentValid(false)
    setDocumentError(null)
    setFormData((prev) => ({ ...prev, documentNumber: "" }))
  }, [documentCountry])

  const allPrivacyAccepted = privacy.terms && privacy.privacyPolicy && privacy.dataConsent
  const documentTypeOptions = getDocumentTypeOptions(documentCountry)
  const documentLabel = getDocumentLabel(documentType)
  const roleCopy = selectedRole === "broker"
    ? {
        title: "Perfil corredor",
        body: "Con nombre, documento, teléfono y empresa ya queda una base suficiente para operar. El teléfono y la empresa ayudan a que propietarios y arrendatarios te identifiquen mejor dentro del panel.",
      }
    : selectedRole === "landlord"
      ? {
          title: "Perfil propietario",
          body: "Con tus datos personales y documento basta para crear la cuenta. Luego podrás completar datos bancarios y propiedades dentro del panel.",
        }
      : selectedRole === "tenant"
        ? {
            title: "Perfil arrendatario",
            body: "El documento y el correo son claves para invitaciones, pagos y validación de contrato. Puedes completar el resto del perfil después.",
          }
        : null

  const validateCurrentDocument = (value: string) => {
    const result = validateDocument({
      country: documentCountry,
      type: documentType,
      value,
    })

    if (!value.trim()) {
      setDocumentValid(false)
      setDocumentError(null)
      return result
    }

    setDocumentValid(result.isValid)
    setDocumentError(result.isValid ? null : result.message)
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRole || !allPrivacyAccepted || !documentValid) {
      if (!documentValid) {
        setDocumentError(`Ingresa un ${documentLabel} valido para continuar`)
      }
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          documentCountry,
          documentType,
          documentNumber: formData.documentNumber,
          phone: formData.phone,
          company: selectedRole === "broker" ? formData.company : undefined,
          role:
            selectedRole === "landlord"
              ? "LANDLORD"
              : selectedRole === "broker"
                ? "BROKER"
                : "TENANT",
          privacyAccepted: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          if (typeof data.error === "string" && data.error.toLowerCase().includes("document")) {
            setDocumentError("Este documento ya tiene una cuenta registrada")
          } else {
            toast.error(data.error || "Error al crear cuenta")
          }
          setIsLoading(false)
          return
        }

        if (typeof data.error === "string" && data.error.toLowerCase().includes("document")) {
          setDocumentError(data.error)
        }

        toast.error(data.error || "Error al crear cuenta")
        setIsLoading(false)
        return
      }

      toast.success("Cuenta creada correctamente")
      setIsLoading(false)

      if (data.requiresVerification) {
        setShowVerify(true)
        return
      }

      const nextLoginUrl = invitationCallbackUrl
        ? `/login?registered=true&callbackUrl=${encodeURIComponent(invitationCallbackUrl)}`
        : "/login?registered=true"
      router.push(nextLoginUrl)
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Error al registrarse")
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifyLoading(true)
    setVerifyError(null)

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, token: verifyCode }),
      })

      const result = await res.json()

      if (!res.ok) {
        setVerifyError(result.error || "No se pudo verificar la cuenta")
        return
      }

      toast.success("Cuenta verificada correctamente")
      const nextLoginUrl = invitationCallbackUrl
        ? `/login?registered=true&verified=true&callbackUrl=${encodeURIComponent(invitationCallbackUrl)}`
        : "/login?registered=true&verified=true"
      router.push(nextLoginUrl)
    } catch {
      setVerifyError("Error de conexion")
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleRoleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, role: Role) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setSelectedRole(role)
    }
  }

  const roleCards = [
    {
      key: "landlord" as const,
      title: "Propietario",
      description: "Gestiona propiedades",
      icon: Building2,
      selectedColor: "border-[#75524C]",
      defaultColor: "border-[#D5C3B6]/15",
    },
    {
      key: "tenant" as const,
      title: "Arrendatario",
      description: "Administra tus pagos y contratos",
      icon: Home,
      selectedColor: "border-[#5E8B8C]",
      defaultColor: "border-[#D5C3B6]/15",
    },
    {
      key: "broker" as const,
      title: "Corredor",
      description: "Administro propiedades de mis clientes",
      icon: Briefcase,
      selectedColor: "border-[#B8965A]",
      defaultColor: "border-[#D5C3B6]/15",
    },
  ]

  const submitDisabled = !selectedRole || !allPrivacyAccepted || isLoading || !documentValid

  return (
    <div className="min-h-screen bg-[#1C1917] flex">
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3C3C] to-[#1C1917]" />
        <svg
          className="absolute inset-0 h-full w-full text-[#D5C3B6]/[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern id="registro-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#registro-grid)" />
        </svg>
        <div className="relative z-10 flex flex-col justify-between p-8 text-left w-full max-w-sm mx-auto">
          <div>
            <p className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] tracking-tight">
              NeiFe<span className="text-[#B8965A]">.</span>
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Shield, text: "Registro seguro y trazable para cada parte del arriendo." },
                { icon: FileText, text: "Contratos y documentos en línea desde el primer día." },
                { icon: CreditCard, text: "Pagos y recordatorios sin perder el hilo contable." },
                { icon: Building2, text: "Un solo lugar para propietarios, inquilinos y corredores." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-[#D5C3B6] text-xs leading-relaxed">
                  <item.icon className="h-4 w-4 text-[#B8965A] shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs italic text-[#9C8578] border-t border-[#D5C3B6]/10 pt-6">
            3 minutos para digitalizar tus arriendos.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-3/5 flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-8 py-6 lg:py-8 overflow-y-auto">
        <div className="w-full max-w-lg py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#9C8578] hover:text-[#D5C3B6] mb-3 transition-colors duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 shadow-2xl shadow-black/20">
            <CardHeader className="text-center pb-2 pt-4 px-5">
              <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
                <div className="rounded-lg bg-[#75524C]/90 px-3 py-2 shadow-md">
                  <span className="text-lg font-serif font-semibold text-[#FAF6F2]">NeiFe<span className="text-[#B8965A]">.</span></span>
                </div>
              </div>
              <CardTitle className="text-2xl font-serif text-[#FAF6F2]">Crear cuenta</CardTitle>
              <CardDescription className="text-[#9C8578] text-sm">
                {inviteToken
                  ? "Completa tu registro para aceptar la invitación pendiente"
                  : "Selecciona tu rol y completa tus datos"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-3">
              {showVerify ? (
                <div className="border border-[#5E8B8C]/20 rounded-2xl p-6 space-y-4 text-center">
                  <div className="w-16 h-16 bg-[#5E8B8C]/15 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-[#5E8B8C]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-semibold text-[#FAF6F2] mb-2">
                      Revisa tu email
                    </h2>
                    <p className="text-[#9C8578] text-sm">
                      Enviamos un codigo de 6 digitos a{" "}
                      <span className="text-[#D5C3B6]">{formData.email}</span>
                    </p>
                  </div>
                  <Input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className={cn(
                      "text-center text-2xl font-mono tracking-widest h-14",
                      inputClass
                    )}
                    maxLength={6}
                  />
                  {verifyError && <p className="text-xs text-[#C27F79]">{verifyError}</p>}
                  <Button
                    onClick={handleVerify}
                    disabled={verifyCode.length !== 6 || verifyLoading}
                    className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] h-11"
                  >
                    {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verificar cuenta
                  </Button>
                </div>
              ) : (
                <>
                  {inviteToken ? (
                    <div className="mb-4 rounded-2xl border border-[#5E8B8C]/20 bg-[#5E8B8C]/10 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5E8B8C]">
                        Invitación pendiente
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#D5C3B6]">
                        Esta cuenta se creará para continuar con una invitación activa dentro de NeiFe. Cuando termines el registro podrás iniciar sesión y aceptar la solicitud desde el enlace recibido.
                      </p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3">
                    {roleCards.map((option) => {
                      const Icon = option.icon
                      const isSelected = selectedRole === option.key

                      return (
                        <div
                          key={option.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedRole(option.key)}
                          onKeyDown={(event) => handleRoleCardKeyDown(event, option.key)}
                          aria-pressed={isSelected}
                          className={cn(
                            "relative cursor-pointer flex flex-col justify-between min-h-[120px] rounded-xl border-2 p-4 text-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#D5C3B6] bg-[#1C1917]/40",
                            isSelected
                              ? cn(option.selectedColor, "bg-opacity-30 shadow-md")
                              : cn(option.defaultColor, "hover:border-[#D5C3B6]/25")
                          )}
                        >
                          {isSelected ? (
                            <span className="absolute top-2.5 right-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF6F2]/10 text-[#FAF6F2]">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : null}
                          <div className="flex flex-col items-center gap-2 w-full pt-1">
                            <div
                              className={cn(
                                "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                                isSelected ? "bg-white/15 text-[#FAF6F2]" : "bg-white/10 text-[#D5C3B6]"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-[#FAF6F2]">{option.title}</h3>
                            <p className="text-xs leading-snug text-[#9C8578]">{option.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="relative mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#D5C3B6]/15" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#9C8578] whitespace-nowrap">
                      Completa tus datos
                    </span>
                    <div className="h-px flex-1 bg-[#D5C3B6]/15" />
                  </div>

                  {roleCopy && (
                    <div className="mb-4 rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/45 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#B8965A]">
                        {roleCopy.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#9C8578]">
                        {roleCopy.body}
                      </p>
                    </div>
                  )}

                  <form className="space-y-3" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#D5C3B6] text-sm">Nombre completo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder={selectedRole === "broker" ? "Nombre del corredor o representante" : "Como aparece en tu documento"}
                          autoComplete="name"
                          className={inputClass}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#D5C3B6] text-sm">Correo</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="nombre@correo.com"
                          autoComplete="email"
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#B8965A] mb-3">Identificación</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="documentCountry" className="text-[#D5C3B6] text-sm">Pais</Label>
                          <Select
                            value={documentCountry}
                            onValueChange={(value) => setDocumentCountry(value as DocumentCountryCode)}
                          >
                            <SelectTrigger id="documentCountry" className={cn(inputClass, "w-full")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
                              {DOCUMENT_COUNTRIES.map((country) => (
                                <SelectItem key={country.value} value={country.value}>
                                  {country.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="documentType" className="text-[#D5C3B6] text-sm">Tipo</Label>
                          <Select
                            value={documentType}
                            onValueChange={(value) => {
                              setDocumentType(value as DocumentTypeCode)
                              setDocumentValid(false)
                              setDocumentError(null)
                              setFormData((prev) => ({ ...prev, documentNumber: "" }))
                            }}
                          >
                            <SelectTrigger id="documentType" className={cn(inputClass, "w-full")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
                              {documentTypeOptions.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-1">
                          <Label htmlFor="documentNumber" className="text-[#D5C3B6] text-sm">{documentLabel}</Label>
                          <div className="relative">
                            <Input
                              id="documentNumber"
                              value={formData.documentNumber}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase()
                                setFormData((prev) => ({ ...prev, documentNumber: value }))
                                validateCurrentDocument(value)
                              }}
                              onBlur={() => {
                                const result = validateCurrentDocument(formData.documentNumber)
                                if (result.isValid && result.formatted) {
                                  setFormData((prev) => ({ ...prev, documentNumber: result.formatted }))
                                }
                              }}
                              placeholder={getDocumentPlaceholder(documentCountry, documentType)}
                              maxLength={20}
                              className={cn(
                                inputClass,
                                "pr-10",
                                documentError && "border-[#C27F79] focus-visible:ring-[#C27F79]",
                                documentValid && !documentError && "border-[#5E8B8C] focus-visible:ring-[#5E8B8C]"
                              )}
                              required
                            />

                            {formData.documentNumber.length > 0 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {documentValid ? (
                                  <Check className="h-4 w-4 text-[#5E8B8C]" />
                                ) : documentError ? (
                                  <span className="text-[#C27F79] text-sm font-semibold">X</span>
                                ) : null}
                              </div>
                            )}
                          </div>
                          {documentError && <p className="text-xs text-[#C27F79]">{documentError}</p>}
                          {documentValid && (
                            <p className="text-xs text-[#5E8B8C]">{documentLabel} valido</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[#D5C3B6] text-sm">Teléfono (opcional)</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+56 9 1234 5678"
                          autoComplete="tel"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {selectedRole === "broker" && (
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-[#D5C3B6] text-sm">Empresa corredora (opcional)</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                          placeholder="Ejemplo: Gestión Inmobiliaria SpA"
                          autoComplete="organization"
                          className={inputClass}
                        />
                        <p className="text-xs text-[#9C8578]">
                          Se mostrará en los perfiles y vistas donde participes como administrador.
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-[#D5C3B6] text-sm">Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            className={cn(inputClass, "pr-10")}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center text-[#9C8578] hover:text-[#D5C3B6]"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-[#D5C3B6] text-sm">Confirmar contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          placeholder="Repite tu contraseña"
                          autoComplete="new-password"
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <Label className="text-sm text-[#D5C3B6]">Privacidad y consentimientos</Label>
                      <div className="space-y-3 text-sm text-[#D5C3B6]">
                        {[
                          { key: "terms" as const, label: "Acepto los Términos y Condiciones" },
                          { key: "privacyPolicy" as const, label: "Acepto la Política de Privacidad" },
                          {
                            key: "dataConsent" as const,
                            label: "Autorizo el uso de mis datos para la prestación del servicio",
                          },
                        ].map((item) => (
                          <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={privacy[item.key]}
                              onCheckedChange={(checked) =>
                                setPrivacy((prev) => ({ ...prev, [item.key]: checked === true }))
                              }
                              className="mt-0.5 border-[#D5C3B6]/40 data-[state=checked]:bg-[#5E8B8C] data-[state=checked]:border-[#5E8B8C] data-[state=checked]:text-[#FAF6F2]"
                            />
                            <span className="leading-snug">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitDisabled}
                      className="w-full h-11 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
