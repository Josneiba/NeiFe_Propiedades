$path = "c:\Users\josva\Documents\JVNB\NeiFe_Propiedades\components\broker\broker-workspace-client.tsx"
$content = [System.IO.File]::ReadAllText($path)
# Buscar con regex flexible
$pattern = '<Badge className=\{getLeadTypeColor\(lead\.type\)\} text-\[8px\] px-1 py-0>'
$replacement = '<Badge className={`${getLeadTypeColor(lead.type)} text-[8px] px-1 py-0`}>'
$regex = [regex]$pattern
$matches_found = $regex.Matches($content).Count
Write-Host "Matches encontrados: $matches_found"
$newContent = $regex.Replace($content, $replacement)
[System.IO.File]::WriteAllText($path, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Archivo actualizado."
# Verificar
$line578 = ($newContent -split "`n")[577]
Write-Host "Linea 578: $line578"
