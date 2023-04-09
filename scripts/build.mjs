import path from 'node:path';

import {build} from 'esbuild';
import {mkdir, rename, stat, writeFile} from 'node:fs/promises';

const DISCORD_PATH = '/Applications/Discord.app/Contents/Resources/app.asar';

const exists = async dir => stat(dir).catch(() => false);

const initApp = async () => {
  await mkdir(DISCORD_PATH);
  await writeFile(
    path.join(DISCORD_PATH, 'package.json'),
    JSON.stringify({name: 'discord', main: 'index.js'})
  );
};

const main = async () => {
  const result = await build({
    entryPoints: ['src/index.ts', 'src/preload.ts', 'src/renderer.ts'],
    format: 'iife',
    bundle: true,
    tsconfig: './tsconfig.json',
    outdir: 'build',
    platform: 'node',
    external: ['electron'],
    write: false,
  });

  if (!(await exists('./build'))) {
    console.log('Build dir does not exist. Creating...');
    await mkdir('./build');
  }

  const asarStat = await exists(DISCORD_PATH);
  if (!asarStat) {
    console.log(DISCORD_PATH, 'does not exist. making directory');
    await initApp();
  } else if (asarStat.isFile()) {
    console.log('Injecting');
    await rename(
      DISCORD_PATH,
      path.join(path.dirname(DISCORD_PATH), '_app.asar')
    );

    await initApp();
  }

  for (const file of result.outputFiles) {
    const basename = path.basename(file.path);
    console.log(basename);

    await writeFile(file.path, file.contents);
    await writeFile(path.join(DISCORD_PATH, basename), file.contents);
  }
};

main().catch(console.error);
