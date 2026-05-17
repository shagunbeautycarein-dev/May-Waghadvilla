const fs = require('fs');
const path = require('path');

function findFiles(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(findFiles(file, filter));
    } else if (file.endsWith(filter)) {
      results.push(file);
    }
  });
  return results;
}

const files = findFiles('src', '.tsx');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // For <table className="w-full text-sm">
  if (content.includes('<table className="w-full text-sm">')) {
    content = content.replace(/<table className="w-full text-sm">/g, '<div className="w-full overflow-x-auto"><table className="w-full text-sm whitespace-nowrap">');
    changed = true;
  }

  if (content.includes('<table className="w-full border-collapse">')) {
    content = content.replace(/<table className="w-full border-collapse">/g, '<div className="w-full overflow-x-auto"><table className="w-full border-collapse whitespace-nowrap">');
    changed = true;
  }

  if (changed) {
    content = content.replace(/<\/table>/g, '</table></div>');
    // Deduplicate if we somehow did it twice
    content = content.replace(/<\/table><\/div><\/div>/g, '</table></div>');
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});

console.log('Fixed ' + count + ' files.');
