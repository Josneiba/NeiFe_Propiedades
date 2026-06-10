const fs = require('fs')
const path = 'C:\\Users\\josva\\Documents\\JVNB\\NeiFe_Propiedades\\components\\broker\\broker-workspace-client.tsx'
let content = fs.readFileSync(path, 'utf8')
// Patrón EXACTO con ">" directo (sin espacio)
const oldStr = 'getLeadTypeColor(lead.type)} text-[8px] px-1 py-0">'
const newStr = 'getLeadTypeColor(lead.type)} text-[8px] px-1 py-0">'
// Voy a sustituir la primera parte (sin el ">") para reconstruir
// La cadena real: className={getLeadTypeColor(lead.type)} text-[8px] px-1 py-0">
// Necesito: className={`${getLeadTypeColor(lead.type)} text-[8px] px-1 py-0`}>
const oldStr2 = 'className={getLeadTypeColor(lead.type)} text-[8px] px-1 py-0">'
const newStr2 = 'className={`${getLeadTypeColor(lead.type)} text-[8px] px-1 py-0`}>'
let count = 0
while (content.includes(oldStr2)) {
  content = content.replace(oldStr2, newStr2)
  count++
}
console.log('Reemplazos:', count)
fs.writeFileSync(path, content, 'utf8')
const verify = fs.readFileSync(path, 'utf8')
const idx2 = verify.indexOf(newStr2)
console.log('Verificación nuevo string idx:', idx2)
const line578 = verify.split('\n')[577]
console.log('Línea 578:', line578)
