# ============================================================
#  EduTime — Script de déploiement manuel
#  Usage : pwsh -ExecutionPolicy Bypass -File .\deploy.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# ── Charger les secrets depuis le fichier local ──────────────
$SecretsFile = Join-Path $PSScriptRoot "deploy.secrets.ps1"
if (-not (Test-Path $SecretsFile)) {
    Write-Host "ERREUR : fichier deploy.secrets.ps1 introuvable." -ForegroundColor Red
    Write-Host "Copie deploy.secrets.example.ps1 en deploy.secrets.ps1 et remplis les valeurs." -ForegroundColor Yellow
    exit 1
}
. $SecretsFile

# ── Récupérer le SHA git pour le tag ────────────────────────
$GIT_SHA = (git rev-parse --short HEAD 2>$null)
if (-not $GIT_SHA) { $GIT_SHA = "manual" }

# ── Fonctions d'affichage ────────────────────────────────────
function Write-Step { param($msg) Write-Host "`n🔷 $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red; exit 1 }

# ════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║        EduTime — Déploiement             ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host "  Commit : $GIT_SHA" -ForegroundColor Gray
Write-Host ""

# ── Étape 1 : Login Docker Hub ───────────────────────────────
Write-Step "Connexion à Docker Hub..."
$DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USER --password-stdin 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "Echec du login Docker Hub" }
Write-OK "Connecte en tant que $DOCKERHUB_USER"

# ── Étape 2 : Build Docker ───────────────────────────────────
Write-Step "Build de l'image Docker..."
docker build `
  --build-arg VITE_API_URL="$VITE_API_URL" `
  -t "${IMAGE_NAME}:latest" `
  -t "${IMAGE_NAME}:${GIT_SHA}" `
  . 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Echec du build Docker" }
Write-OK "Image buildee : ${IMAGE_NAME}:latest + :${GIT_SHA}"

# ── Étape 3 : Push Docker Hub ────────────────────────────────
Write-Step "Push vers Docker Hub..."
docker push "${IMAGE_NAME}:latest" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "Echec du push :latest" }
docker push "${IMAGE_NAME}:${GIT_SHA}" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "Echec du push :${GIT_SHA}" }
Write-OK "Images poussees sur Docker Hub"

# ── Étape 4 : Déclencher Coolify ─────────────────────────────
Write-Step "Declenchement du redeploiement Coolify..."
$resp = Invoke-RestMethod -Uri $COOLIFY_URL -Method GET -Headers @{ "Authorization" = "Bearer $COOLIFY_TOKEN" }
if (-not $resp.deployment_uuid) { Write-Fail "Coolify n'a pas accepte la demande" }
$DEPLOY_UUID = $resp.deployment_uuid
Write-OK "Deploiement en file d'attente : $DEPLOY_UUID"

# ── Étape 5 : Attendre la fin ────────────────────────────────
Write-Step "Attente de la fin du deploiement..."
$i = 0
do {
    Start-Sleep -Seconds 8
    $i++
    $status = (Invoke-RestMethod `
        -Uri "http://178.105.62.20:8000/api/v1/deployments/$DEPLOY_UUID" `
        -Headers @{ "Authorization" = "Bearer $COOLIFY_TOKEN" }).status
    Write-Host "  [$i] Status : $status" -ForegroundColor Gray
} while ($status -notin @("finished","failed","error") -and $i -lt 25)

# ── Résultat ─────────────────────────────────────────────────
Write-Host ""
if ($status -eq "finished") {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅  Deploiement reussi !               ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "  🌐 $APP_URL" -ForegroundColor Cyan
} else {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║   ❌  Deploiement echoue ($status)       ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
Write-Host ""
