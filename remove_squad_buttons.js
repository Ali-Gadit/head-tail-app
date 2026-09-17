const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const target = `<TouchableOpacity onPress={() => startRankedMatch(4)} disabled={loading || findingRankedMatch || findingMatch} className="w-full bg-blue-500 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-blue-700">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingRankedMatch ? 'Searching...' : 'Play Ranked (Duo)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startRankedMatch(8)} disabled={loading || findingRankedMatch || findingMatch} className="w-full bg-blue-400 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-blue-600">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingRankedMatch ? 'Searching...' : 'Play Ranked (Squad)'}</Text>
              </TouchableOpacity>`;

content = content.replace(target, '');
fs.writeFileSync('App.tsx', content);
