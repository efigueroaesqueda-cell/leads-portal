@echo off
echo ============================================
echo  HenryLeads — Publicar en GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Inicializando repositorio git...
git init -b main
git config user.email "efigueroaesqueda@gmail.com"
git config user.name "Enrique Figueroa"

echo [2/4] Agregando archivos...
git add .
git commit -m "HenryLeads v1.0 — Portal CRM Cremalleras LR"

echo [3/4] Conectando con GitHub...
echo.
echo IMPORTANTE: Primero crea el repositorio en:
echo https://github.com/new
echo.
echo Nombre: leads-portal
echo Visibilidad: Publico
echo (NO agregues README ni .gitignore)
echo.
pause

echo [4/4] Subiendo archivos...
git remote add origin https://github.com/efigueroaesqueda-cell/leads-portal.git
git push -u origin main

echo.
echo ============================================
echo  ACTIVAR GITHUB PAGES:
echo  1. Ve a: github.com/efigueroaesqueda-cell/leads-portal
echo  2. Settings > Pages
echo  3. Source: Deploy from branch
echo  4. Branch: main / (root)
echo  5. Save
echo.
echo  URL del portal (en ~1 minuto):
echo  https://efigueroaesqueda-cell.github.io/leads-portal/
echo
echo  Demo directo:
echo  https://efigueroaesqueda-cell.github.io/leads-portal/index.html?demo=1
echo ============================================
pause
