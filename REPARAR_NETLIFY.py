#!/usr/bin/env python3
"""Rescate Netlify para GitHub v8.5.2 con pruebas adelantadas 8.5.4/8.5.5.
Realiza los cambios en un clon de ensayo. Solo después de pasar tests/build modifica el repositorio real.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import filecmp
import json
import os
import shutil
import subprocess
import sys
import time

HERE=Path(__file__).resolve().parent
NPM='npm.cmd' if os.name=='nt' else 'npm'
DEST=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else Path.cwd()
SCOPED=[
 '.gitignore','app.js','styles.css','index.html','sw.js','manifest.webmanifest','package.json',
 'scripts/build.mjs','netlify/functions/health.mjs',
 'core/allocator-v6.js','core/level-craft.js','core/optimizer.js',
 'core/market-volume.js','core/procurement-liquidity.js','core/results-view.js',
 'tests/v7_4-food.test.mjs','tests/v8_3-hud-refining.test.mjs',
 'tests/v8_4-compact-hud.test.mjs','tests/v8_4_1-ui-compact.test.mjs',
 'tests/v8_5_3-liquidity.test.mjs','tests/v8_5_4-compact-ui.test.mjs',
 'tests/v8_5_5-results.test.mjs','tests/v8_5_5-render.test.mjs',
 'assets/results-banner.webp','assets/results-sidebar.webp'
]
EXCLUDE={'.git','.netlify','dist','node_modules','.cache','.next','coverage','.turbo'}
REQ=["qcControls('craft')","qcControls('auto')","ids=ids.filter(id=>qcVariantIncluded('craft'", "pick.chosen=pick.chosen.filter(x=>qcVariantIncluded('auto'", 'function resultsPage(){', "if(state.page==='resultados')resultsPage()", "state.resultSource='crafting';changePage('resultados')", "state.resultSource='autocraft';changePage('resultados')"]

def run(command,cwd,log,required=True):
    print('  >',' '.join(command),flush=True)
    with log.open('a',encoding='utf-8') as fp:
        fp.write('\n'+' '.join(command)+'\n')
        fp.flush()
        proc=subprocess.run(command,cwd=cwd,stdout=fp,stderr=subprocess.STDOUT)
    if proc.returncode and required:
        tail=log.read_text(encoding='utf-8',errors='replace')[-3500:]
        raise RuntimeError(f"No pasó {' '.join(command)}. La carpeta original NO fue cambiada.\n{tail}\nAdjunta el log: {log}")
    return proc.returncode

def main():
    print('GILDEM CRAFT PRO | Rescate del deploy 8.5.5',flush=True)
    for f in ('app.js','index.html','styles.css','sw.js','package.json'):
        if not (DEST/f).is_file():raise RuntimeError('No se encontró '+f+' en la carpeta elegida. Arrastra la carpeta COMPLETA del repositorio.')
    package=json.loads((DEST/'package.json').read_text(encoding='utf-8'))
    version=str(package.get('version',''))
    if version not in {'8.5.2','8.5.3','8.5.4','8.5.5'}:
        raise RuntimeError('La base tiene versión '+version+'; requiere 8.5.2 a 8.5.5. No se modificó nada.')
    if version=='8.5.5' and all(key in (DEST/'app.js').read_text(encoding='utf-8') for key in REQ) and 'data-nav="resultados"' in (DEST/'index.html').read_text(encoding='utf-8'):
        print('La interfaz ya está instalada; comprueba que has hecho Commit y Push de TODOS los archivos modificados.')
        return
    if version=='8.5.5':
        raise RuntimeError('El número de versión figura 8.5.5 pero falta parte del código. No es seguro aplicar automáticamente un parche a medias. Comparte app.js/package.json para un rescate específico.')
    print('Versión del código:',version,'| Test suites presentes:',(DEST/'tests/v8_5_4-compact-ui.test.mjs').exists(),(DEST/'tests/v8_5_5-render.test.mjs').exists(),flush=True)
    with TemporaryDirectory(prefix='gildem-rescate-') as scratch:
        stage=Path(scratch)/'repo'
        print('1/4 Preparando copia de ensayo, sin tocar .git...',flush=True)
        shutil.copytree(DEST,stage,ignore=shutil.ignore_patterns(*EXCLUDE,'*.pyc','.gildem-respaldo-*'))
        if (DEST/'node_modules').is_dir():
            try:
                os.symlink(str(DEST/'node_modules'),str(stage/'node_modules'),target_is_directory=True)
            except (OSError, NotImplementedError):
                # Windows may disable symlinks without Developer Mode.
                print('Copiando node_modules al proyecto de ensayo...',flush=True)
                shutil.copytree(DEST/'node_modules',stage/'node_modules')
        log=HERE/'DIAGNOSTICO_EJECUCION.txt'
        log.write_text('Gildem Craft Pro rescate, versión original '+version+'\n',encoding='utf-8')
        print('2/4 Aplicando UI compacta y Resultados a la copia de ensayo...',flush=True)
        run([sys.executable,str(HERE/'INSTALAR_ACTUALIZACION.py'),str(stage)],stage,log)
        app=(stage/'app.js').read_text(encoding='utf-8')
        missing=[x for x in REQ if x not in app]
        if missing:raise RuntimeError('El código sigue incompleto: '+', '.join(missing))
        if 'data-nav="resultados"' not in (stage/'index.html').read_text(encoding='utf-8'):
            raise RuntimeError('Falta el acceso a Resultados en index.html.')
        if json.loads((stage/'package.json').read_text(encoding='utf-8')).get('version')!='8.5.5':
            raise RuntimeError('El archivo package.json no quedó en 8.5.5.')
        # Keep generated assets and backups OUT of the next GitHub commit.
        ignore=stage/'.gitignore'
        current_ignore=ignore.read_text(encoding='utf-8') if ignore.is_file() else ''
        patterns=['node_modules/','dist/','.netlify/','.gildem-respaldo-antes-*/']
        additional=[x for x in patterns if x not in current_ignore.splitlines()]
        if additional:
            ignore.write_text(current_ignore.rstrip()+'\n'+'\n'.join(additional)+'\n',encoding='utf-8')
        print('3/4 Probando JavaScript, casos de uso y build completo...',flush=True)
        run(['node','--check','app.js'],stage,log)
        if not (stage/'node_modules').exists() and (stage/'package-lock.json').is_file():
            print('Instalando dependencias en la copia de ensayo (npm ci)...',flush=True)
            run([NPM,'ci','--ignore-scripts','--no-audit','--no-fund'],stage,log)
        run([NPM,'run','build'],stage,log)
        modified=[]
        for rel in SCOPED:
            f=stage/rel
            if not f.is_file():continue
            original=DEST/rel
            if not original.exists() or f.read_bytes()!=original.read_bytes():modified.append(rel)
        print(f'4/4 Build correcto: aplicando {len(modified)} archivos al repositorio real...',flush=True)
        if not modified:
            print('Sin archivos nuevos. Si Netlify falla, falta Commit/Push en la rama correcta.');return
        backup=DEST/('.gildem-respaldo-antes-rescate-'+time.strftime('%Y%m%d-%H%M%S'))
        backup.mkdir(parents=True)
        for rel in modified:
            file=DEST/rel
            if file.is_file():
                target=backup/rel
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(file,target)
        for rel in modified:
            target=DEST/rel
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(stage/rel,target)
            print('  ✓',rel)
        print('\nREPARACIÓN REALIZADA. Todos los tests y la compilación pasaron en el proyecto de ensayo.')
        print('Backup:',backup)
        print('SIGUIENTE: en GitHub Desktop debes hacer COMMIT y PUSH de los cambios listados arriba.')
        print('No hagas commit de backups, node_modules ni dist. Netlify debe publicar un commit donde app.js, index.html, CSS, core y tests estén sincronizados.')

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('ERROR:',str(exc),file=sys.stderr,flush=True)
        raise SystemExit(1)
