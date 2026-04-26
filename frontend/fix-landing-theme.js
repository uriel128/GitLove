const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

content = content.replace(/bg-\[\#06040a\]/g, 'bg-slate-50 dark:bg-[#06040a]');
content = content.replace(/bg-\[\#0A0710\]/g, 'bg-slate-100 dark:bg-[#0A0710]');
content = content.replace(/bg-\[\#1A1423\]/g, 'bg-white dark:bg-[#1A1423]');
content = content.replace(/bg-\[\#120D1A\]/g, 'bg-white dark:bg-[#120D1A]');
content = content.replace(/\btext-white\b(?![\/\-])/g, 'text-slate-900 dark:text-white');
content = content.replace(/border-white\/([0-9]+|\[[0-9.]+\])/g, 'border-black/$1 dark:border-white/$1');
content = content.replace(/bg-white\/([0-9]+|\[[0-9.]+\])/g, 'bg-black/$1 dark:bg-white/$1');
content = content.replace(/bg-black\/([0-9]+|\[[0-9.]+\])/g, 'bg-white/$1 dark:bg-black/$1');
content = content.replace(/text-white\/([0-9]+|\[[0-9.]+\])/g, 'text-slate-900/$1 dark:text-white/$1');
content = content.replace(/border-white\b/g, 'border-slate-900 dark:border-white');

// Fix ThemeToggle import and placement
content = content.replace('import { Logo } from "@/components/logo";', 'import { Logo } from "@/components/logo";\nimport { ThemeToggle } from "@/components/theme-toggle";');

// Find the header and add ThemeToggle
content = content.replace(
  /<div className="flex items-center">/g,
  '<div className="flex items-center gap-4">\n            <ThemeToggle />'
);

// We should fix the buttons to link to /login and /login?mode=signup
content = content.replace(/href="\/login"/g, 'href="/login"'); // this is already fine
// For "Create account" it doesn't exist yet, we'll check.
// Start Compiling Love should point to /login?mode=signup
content = content.replace(/href="\/login"/, 'href="/login?mode=signup"'); // The hero button
// Wait, the navbar sign in is href="/login". 

fs.writeFileSync('app/page.tsx', content);
