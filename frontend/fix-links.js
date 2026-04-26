const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Documentation
content = content.replace(/href="\#how-it-works"([^>]*)>\s*View Documentation/g, 'href="/about?tab=documentation"$1>View Documentation');
// Footer Privacy
content = content.replace(/href="\#privacy"/g, 'href="/about?tab=privacy"');
// Footer Terms
content = content.replace(/href="\#terms"/g, 'href="/about?tab=terms"');
// Footer Contact
content = content.replace(/href="\#contact"/g, 'href="/about?tab=contact"');

fs.writeFileSync('app/page.tsx', content);
