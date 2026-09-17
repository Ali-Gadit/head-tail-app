const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(/<TouchableOpacity onPress=\{\(\) => startRankedMatch\([\s\S]*?<\/TouchableOpacity>/g, '');

fs.writeFileSync('App.tsx', content);
