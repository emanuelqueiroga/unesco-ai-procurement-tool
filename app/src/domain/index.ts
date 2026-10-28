// Domínio da ferramenta: módulos ES puros (sem DOM, sem globais, sem estado da aplicação).
// Um arquivo por módulo da v13 (src/*.js); as funções que liam a global S recebem o `estado` do caso
// ({ caso, ctx, resp, respC, respDet, custo, moeda, exemplo, feitos }) como parâmetro.
// Não há colisão de nomes entre os módulos (verificado em app/tests/unit); se surgir alguma,
// resolva aqui com `export { x as y }`.
export * from './custos.js';
export * from './framework.js';
export * from './casos.js';
export * from './prioridades.js';
export * from './plano_dados.js';
export * from './fluxo_dados.js';
export * from './i18n.js';
export * from './custos_ui.js';
export * from './formula.js';
export * from './fluxo.js';
export * from './matriz.js';
export * from './recomendacoes.js';
