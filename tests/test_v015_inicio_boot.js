// Reproduz a ordem do bundle: framework.js precede o catálogo de países.
// O acesso antecipado ao const PAISES impedia até a página inicial de carregar.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const framework = fs.readFileSync(path.join(__dirname, '../src/framework.js'), 'utf8');
const lateCatalog = '\nconst PAISES = [["BR", "Brasil"], ["PT", "Portugal"]];';
const result = vm.runInNewContext(framework + lateCatalog + '\nJSON.stringify(OPC.PAISES);');
assert.deepEqual(JSON.parse(result), [['BR', 'Brasil'], ['PT', 'Portugal']]);
assert.equal(vm.runInNewContext(framework + lateCatalog + '\nOPC.PAISES === PAISES;'), true);
assert.equal(vm.runInNewContext(framework + '\nJSON.stringify(OPC.PAISES);'), '[]');
console.log('3 verificações de inicialização aprovadas: catálogo tardio, identidade e ausência em módulo isolado.');
