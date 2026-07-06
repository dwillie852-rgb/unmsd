import fs from 'fs';
import path from 'path';

function fixImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixImports(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      // Replace all relative imports of components with absolute aliases
      content = content.replace(/from\s+['"](?:\.\.\/)+components\/(.*)['"]/g, "from '@/components/$1'");
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

fixImports('./app');
