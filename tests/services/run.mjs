// Runs all automated tests: `npm test`
//   tests/services/purchaseWorkflow.test.ts  shopping list + purchase workflow
//   tests/utils/utils.test.ts                statistics, validation, greeting, dates
//
// The real src/services code is bundled with three stand-ins:
//   firebase/firestore  -> mocks/firestore.ts (in-memory Firestore with real
//                          transaction behaviour: reads first, atomic commit,
//                          automatic retry when another write got there first)
//   services/firebase   -> mocks/firebase.ts  (a signed-in test user)
//   react-native        -> mocks/react-native.ts
// No Firebase project, phone or internet connection is needed.
import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.join(here, '.out');
const suites = [
  ['Shopping & purchase workflow', path.join(here, 'purchaseWorkflow.test.ts')],
  ['Helpers: statistics, validation, greeting, dates', path.join(here, '..', 'utils', 'utils.test.ts')],
];

const outfileFor = (file) => path.join(outdir, path.basename(file, '.ts') + '.cjs');

for (const [, file] of suites) {
await esbuild.build({
  entryPoints: [file],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: outfileFor(file),
  define: { __DEV__: 'false' },
  logLevel: 'warning',
  plugins: [
    {
      name: 'stockly-test-mocks',
      setup(build) {
        build.onResolve({ filter: /^firebase\/firestore$/ }, () => ({
          path: path.join(here, 'mocks', 'firestore.ts'),
        }));
        build.onResolve({ filter: /^react-native$/ }, () => ({
          path: path.join(here, 'mocks', 'react-native.ts'),
        }));
        build.onResolve({ filter: /^\.\/firebase$/ }, (args) =>
          args.importer.includes(`${path.sep}services${path.sep}`)
            ? { path: path.join(here, 'mocks', 'firebase.ts') }
            : undefined,
        );
      },
    },
  ],
});
}

let failed = false;
for (const [title, file] of suites) {
  console.log(`\n=== ${title} ===`);
  try {
    execFileSync(process.execPath, [outfileFor(file)], {
      stdio: 'inherit',
    });
  } catch {
    failed = true;
  }
}
console.log(failed ? '\nSome tests FAILED.' : '\nAll test suites passed.');
process.exitCode = failed ? 1 : 0;
