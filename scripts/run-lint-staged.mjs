// scripts/run-lint-staged.mjs
import lintStaged from 'lint-staged';

try {
  const ok = await lintStaged(); // runs using your "lint-staged" config in package.json
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.error(err);
  process.exit(1);
}