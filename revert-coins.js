const fs = require('fs');
let code = fs.readFileSync('src/components/GameRoom.tsx', 'utf8');

const oldStr = code.substring(code.indexOf('{isCaller ? ('), code.indexOf('// TOSS THROW'));

const newStr = `{isCaller ? (
            <View className="flex-row justify-between w-full max-w-sm px-8">
              <TouchableOpacity 
                disabled={loading} 
                onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} 
                className={\`w-32 h-32 rounded-full bg-yellow-500 items-center justify-center border-4 border-yellow-600 \${loading ? 'opacity-50' : 'active:scale-95'}\`}
              >
                <Text className="text-5xl font-black text-white">H</Text>
                <Text className="text-sm font-black text-white mt-1">HEADS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={loading} 
                onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} 
                className={\`w-32 h-32 rounded-full bg-slate-200 items-center justify-center border-4 border-slate-300 \${loading ? 'opacity-50' : 'active:scale-95'}\`}
              >
                <Text className="text-5xl font-black text-slate-700">T</Text>
                <Text className="text-sm font-black text-slate-700 mt-1">TAILS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center mt-6">
              <View className="w-32 h-32 rounded-full bg-slate-700 items-center justify-center border-4 border-slate-600 animate-pulse">
                <Text className="text-5xl font-black text-slate-500">?</Text>
              </View>
              <Text className="text-white/50 font-black text-sm uppercase tracking-widest animate-pulse mt-4">Awaiting Call...</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  `;

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/components/GameRoom.tsx', code);
