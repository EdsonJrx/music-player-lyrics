// src/main/simple-runner.ts
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { app } from 'electron';
import { join } from 'node:path';

let proc: ChildProcessWithoutNullStreams | null = null;

export function startSimple() {
  // caminho em dev versus produção
  const devPath  = join(process.cwd(), 'resources', 'simple.exe');
  const prodPath = join(process.resourcesPath,  'simple.exe');
  const exePath  = app.isPackaged ? prodPath : devPath;

  // adiciona pasta da DLL ao PATH (Windows)
  process.env.PATH = `${join(exePath, '..')};${process.env.PATH}`;

  proc = spawn(exePath, [], { stdio: 'ignore' });
}

export function stopSimple() {
  if (proc && !proc.killed) proc.kill();
}
