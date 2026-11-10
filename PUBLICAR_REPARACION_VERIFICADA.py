#!/usr/bin/env python3
"""Instalar la revisión, validar en local y subir un único commit a GitHub.
No ejecuta git push si hay cambios ajenos, diverge de origin/main o falla el build.
No se usan claves ni tokens; usa el git autenticado del PC del usuario.
"""
from pathlib import Path
import os, re, subprocess, sys, shutil

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').expanduser().resolve()
HERE=Path(__file__).resolve().parent
FILES=['app.js','core/always-plan.js','core/ao-gear-recipes.js',
 'scripts/build.mjs','scripts/check-deploy.mjs',
 'tests/v8_7_1-demand-first.test.mjs','tests/v8_7_2-ao-bin-dumps.test.mjs']

def git(*args,check=True):
 p=subprocess.run(['git','-C',str(ROOT),*args],text=True,capture_output=True)
 if check and p.returncode:
  raise RuntimeError('git '+ ' '.join(args)+'\n'+(p.stderr or p.stdout))
 return p.stdout.strip()

def stop(message):
 print('\nERROR: '+message+'\nNo se ha publicado ningún cambio.',file=sys.stderr)
 raise SystemExit(1)

if not shutil.which('git'):
 stop('Git no está en el PATH. Abre GitHub Desktop y después instala Git for Windows si es necesario.')
if not (ROOT/'app.js').is_file():stop('La carpeta indicada NO contiene app.js: '+str(ROOT))
try:
 top=Path(git('rev-parse','--show-toplevel')).resolve()
 if top!=ROOT:stop('Escoge la CARPETA RAÍZ del repositorio, no una subcarpeta: '+str(top))
 current=git('branch','--show-current')
 if current!='main':stop('Esta reparación requiere la rama main. Actual: '+current)
 origin=git('remote','get-url','origin')
 # Solo permitir publicar al repositorio correcto de Gildem.
 allowed=re.fullmatch(r'(?:(?:https://|git@)github\.com[:/])drzjhon-dot/gildem-craft-pro-live(?:\.git)?/?',origin,re.I)
 if not allowed:stop('El origen no es github.com/drzjhon-dot/gildem-craft-pro-live: '+origin)
 if git('status','--porcelain'):
  stop('Hay cambios locales sin confirmar. Guarda/commitea tus cambios anteriores en GitHub Desktop y vuelve a ejecutar. No se mezclarán.')
 # Evita instalar sobre un main local atrasado respecto a GitHub.
 print('Verificando GitHub origin/main...')
 p=subprocess.run(['git','-C',str(ROOT),'fetch','origin','main'],capture_output=True,text=True)
 if p.returncode:stop('No se pudo verificar origin/main: '+(p.stderr or p.stdout))
 ahead=git('rev-list','--count','HEAD..origin/main')
 if int(ahead):stop('Tu main local está atrasado '+ahead+' commits. Primero haz Pull en GitHub Desktop.')
 diverged=git('rev-list','--count','origin/main..HEAD')
 if int(diverged):stop('Tu main local tiene commits sin subir. Primero sincroniza GitHub Desktop.')
except subprocess.SubprocessError as e:
 stop(str(e))

print('\nPaso 1: instalando implementación y ejecutando tests+build...')
p=subprocess.run([sys.executable,str(HERE/'INSTALAR_REVISION.py'),str(ROOT)],text=True)
if p.returncode:stop('No pasaron las verificaciones; el instalador restauró el proyecto. Revisa el error anterior.')
source=(ROOT/'app.js').read_text(encoding='utf-8')
builder=(ROOT/'scripts/build.mjs').read_text(encoding='utf-8')
required=['GCP_DEMAND_FIRST_871','draftPlanForLedger','PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO',
 'planMode:byDemand?','data-action="copy-demand-shopping"']
missing=[x for x in required if x not in source]
if missing:stop('No se publicará una versión incompleta. Faltan: '+repr(missing))
if '<strong>No hay beneficio neto verificable actualmente.</strong>' in source:
 stop('El mensaje antiguo sigue en app.js.')
if 'GCP_AO_DUMPS_GEAR_872' not in builder:stop('La integración ao-bin-dumps no está instalada.')
changed=set(git('diff','--name-only').splitlines())
if not {'app.js','scripts/build.mjs','scripts/check-deploy.mjs'}.issubset(changed):
 stop('No se actualizaron los tres archivos críticos: '+', '.join(sorted(changed)))
if not changed.issubset(set(FILES)):
 stop('Cambios ajenos detectados, no se publicarán: '+', '.join(sorted(changed-set(FILES))))
print('\nPaso 2: creando UN SOLO commit con código y verificaciones...')
try:
 git('add','--',*FILES)
 staged=set(git('diff','--cached','--name-only').splitlines())
 if not {'app.js','scripts/build.mjs','scripts/check-deploy.mjs'}.issubset(staged):
  stop('No se incluyeron todos los archivos críticos en el commit.')
 git('commit','-m','fix: integrar motor por demanda y ao-bin-dumps antes de Netlify')
except Exception as e:
 stop('No se pudo crear el commit: '+str(e)+'\nEl cambio ya pasó pruebas: haz commit desde GitHub Desktop.')
print('\nPaso 3: PUBLICANDO a origin/main (esta operación modifica GitHub)...')
p=subprocess.run(['git','-C',str(ROOT),'push','origin','main'],text=True,capture_output=True)
if p.returncode:
 stop('El commit se guardó LOCALMENTE, pero GitHub rechazó el Push: '+(p.stderr or p.stdout)+
 '\nAbre GitHub Desktop > Push origin. NO vuelvas a copiar archivos aislados.')
print('\n'+'='*65)
print('PUBLICACIÓN OK: main actualizado con todos los archivos necesarios.')
print('Commit:',git('rev-parse','--short','HEAD'))
print('La nueva compilación de Netlify se iniciará según la configuración de tu repositorio.')
print('Confirma en Netlify que las pruebas y el build pasaron. No afirmamos que el deploy haya terminado.')
print('='*65)
