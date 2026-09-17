const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const target1 = `<TouchableOpacity onPress={() => startRankedMatch(2)} disabled={loading || findingRankedMatch || findingMatch} className="w-full bg-blue-600 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-blue-800">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingRankedMatch ? 'Searching...' : 'Play Ranked (Solo)'}</Text>
              </TouchableOpacity>`;
content = content.replace(target1, '');

const target2 = `|| findingRankedMatch`;
content = content.replaceAll(target2, '');

fs.writeFileSync('App.tsx', content);
