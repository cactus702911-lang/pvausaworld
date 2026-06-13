const fs = require('fs'); 
const path = require('path'); 
function walk(dir) { 
  fs.readdirSync(dir).forEach(f => { 
    let p = path.join(dir, f); 
    if (fs.statSync(p).isDirectory()) { 
      if (p.includes('node_modules') || p.includes('.git')) return; 
      walk(p); 
    } else if (p.endsWith('.html') || p.endsWith('.js') || p.endsWith('.json')) { 
      let c = fs.readFileSync(p, 'utf8'); 
      if (c.includes('\uD83D\uDD25') || c.includes('ðŸ”¥') || c.includes('🔥')) console.log('Found in', p); 
    } 
  }); 
} 
walk('.');
