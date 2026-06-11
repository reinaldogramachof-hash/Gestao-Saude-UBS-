/**
 * SEED 002 — Bairros x UBS
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Popula a tabela bairros_ubs com o mapeamento entre os bairros de SJC
 *         e a UBS responsável pelo atendimento.
 *
 * DETALHES:
 * - O script é idempotente: verifica antes de inserir para não duplicar dados.
 * - Inclui a normalização de strings (sem acento, lowercase) para facilitar a busca.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Função auxiliar para remover acentos, trim e lowercase
function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

exports.seed = async function(knex) {
  // Mapeamento fornecido
  const mapeamento = {
    'UBS Centro': [
      'Centro', 'Vila Adyanna', 'Jardim Esplanada', 'Esplanada dos Baús',
      'Jardim Aquarius', 'Vila Ema', 'Parque Residencial Aquarius'
    ],
    'UBS Santana': [
      'Santana', 'Vila São Bento', 'Jardim Santana', 'Parque Interlagos',
      'Vila Betânia', 'Jardim Paraíba', 'Jardim Paraíba I'
    ],
    'UBS Altos de Santana': [
      'Altos de Santana', 'Jardim América', 'Jardim Guapira',
      'Parque da Graminha', 'Jardim Oswaldo Cruz'
    ],
    'UBS Alto da Ponte': [
      'Alto da Ponte', 'Vila Branca', 'Jardim Nossa Senhora Aparecida',
      'Jardim Miriã', 'Vila São João'
    ],
    'UBS Dom Pedro 1º': [
      'Dom Pedro 1º', 'Parque Dom Pedro', 'Jardim Santa Inês',
      'Jardim das Colinas', 'Jardim California'
    ],
    'UBS Jardim Paulista': [
      'Jardim Paulista', 'Jardim Flamboyant', 'Parque Res. Flamboyant',
      'Jardim Sul', 'Jardim Augusta'
    ],
    'UBS Jardim Oriente': [
      'Jardim Oriente', 'Jardim Helena', 'Parque Oriente',
      'Vila Helena', 'Vila Tatetuba'
    ],
    'UBS Jardim Satélite': [
      'Jardim Satélite', 'Parque Residencial Aquarius', 'Jardim Aquarius',
      'Bela Vista', 'Jardim Satélite I', 'Condomínio Residencial Aquarius'
    ],
    'UBS Jardim das Indústrias': [
      'Jardim das Indústrias', 'Parque Industrial', 'Distrito Industrial',
      'Jardim Motorama', 'Vila das Indústrias'
    ],
    'UBS Bosque dos Eucaliptos': [
      'Bosque dos Eucaliptos', 'Jardim Santa Rosa', 'Jardim São Judas Tadeu',
      'Parque São Judas', 'Vila Esperança'
    ],
    'UBS Nova Detroit': [
      'Nova Detroit', 'Jardim São Dimas', 'Vila São Dimas',
      'Jardim Nazareth', 'Parque São Dimas'
    ],
    'UBS Parque Industrial': [
      'Parque Industrial', 'Areão', 'Jardim Paulicéia',
      'Vila Industrial', 'Jardim Rosa de Franca'
    ],
    'UBS Jardim Americano': [
      'Jardim Americano', 'Parque Americana', 'Vila América',
      'Jardim Brasilândia', 'Jardim Nova Esperança'
    ],
    'UBS Jardim Limoeiro': [
      'Jardim Limoeiro', 'Jardim Alvorada', 'Parque Alvorada',
      'Vila Alvorada', 'Jardim Nova Alvorada'
    ],
    'UBS Cidade Morumbi': [
      'Cidade Morumbi', 'Jardim Morumbi', 'Parque Morumbi',
      'Jardim Álvaro Botelho', 'Residencial Morumbi'
    ],
    'UBS Majestic': [
      'Majestic', 'Jardim Majestic', 'Parque Majestic',
      'Conjunto Habitacional Majestic'
    ],
    'UBS Vila Industrial': [
      'Vila Industrial', 'Jardim Motorama', 'Jardim São Jorge',
      'Vila São Jorge', 'Parque Industrial Leste'
    ],
    'UBS Vila Maria': [
      'Vila Maria', 'Jardim Maria Augusta', 'Jardim Ipiranga',
      'Vila Ipiranga', 'Parque Maria'
    ],
    'UBS Campo dos Alemães': [
      'Campo dos Alemães', 'Jardim Rio Comprido', 'Jardim Campos',
      'Parque dos Alemães', 'Conjunto Hab. Campo dos Alemães'
    ],
    'UBS Galo Branco': [
      'Galo Branco', 'Jardim Galo Branco', 'Parque Galo Branco',
      'Conjunto Galo Branco'
    ],
    'UBS Bonsucesso': [
      'Bonsucesso', 'Vila Bonsucesso', 'Jardim Bonsucesso',
      'Parque Bonsucesso', 'Jardim Progresso'
    ],
    'UBS Campos de São José': [
      'Campos de São José', 'Jardim Campos de SJ',
      'Parque Campos de São José', 'Vila Campos'
    ],
    'UBS Buquirinha': [
      'Buquirinha', 'Jardim Buquirinha', 'Parque Buquirinha',
      'Vila Buquirinha', 'Jardim Serra Dourada'
    ],
    'UBS Jardim Nova América': [
      'Jardim Nova América', 'Nova América', 'Parque Nova América',
      'Jardim Alvorada Norte', 'Vila Nova América'
    ],
    'UBS Novo Horizonte': [
      'Novo Horizonte', 'Jardim Novo Horizonte', 'Parque Novo Horizonte',
      'Vila Horizonte', 'Jardim Nova Horizonte'
    ],
    'UBS Jardim Pernambucano': [
      'Jardim Pernambucano', 'Vila Pernambucana', 'Parque Pernambucano',
      'Jardim Pernambuco'
    ],
    'UBS Resolve Jardim Telespark': [
      'Jardim Telespark', 'Parque Esplanada', 'Chácaras de Recreio Represa',
      'Jardim Cassiopéia', 'Parque Telespark', 'Conjunto Hab. Telespark'
    ],
    'UBS Interlagos': [
      'Interlagos', 'Jardim Interlagos', 'Parque Interlagos Sul',
      'Vila Interlagos', 'Jardim Lagoa'
    ],
    'UBS Chácaras Reunidas': [
      'Chácaras Reunidas', 'Jardim Chácaras', 'Parque das Chácaras',
      'Recanto das Chácaras', 'Chácara Nossa Senhora'
    ],
    'UBS Jardim Paraíso do Sol': [
      'Jardim Paraíso do Sol', 'Jardim Paraíso', 'Parque Paraíso',
      'Vila Paraíso', 'Jardim Sol Nascente'
    ],
    'UBS Jardim São José 2': [
      'Jardim São José 2', 'Jardim São José', 'Parque São José',
      'Vila São José', 'Jardim São José I'
    ],
    'UBS Colonial': [
      'Colonial', 'Parque Colonial', 'Jardim Colonial',
      'Vila Colonial', 'Residencial Colonial'
    ],
    'UBS Santa Hermínia': [
      'Santa Hermínia', 'Jardim Santa Hermínia', 'Parque Santa Hermínia',
      'Vila Santa Hermínia'
    ],
    'UBS Primavera I': [
      'Primavera I', 'Primavera II', 'Jardim Primavera',
      'Parque Primavera', 'Vila Primavera', 'Residencial Primavera'
    ],
    'UBS Pousada do Vale': [
      'Pousada do Vale', 'Jardim Pousada do Vale', 'Parque Pousada',
      'Vila do Vale', 'Recanto do Vale'
    ],
    'UBS Parque Santa Rita': [
      'Parque Santa Rita', 'Jardim Santa Rita', 'Vila Santa Rita',
      'Santa Rita', 'Conjunto Santa Rita'
    ],
    'UBS Residencial União': [
      'Residencial União', 'Jardim União', 'Parque União',
      'Vila União', 'Conjunto União'
    ],
    'UBS Santa Inês 2': [
      'Santa Inês 2', 'Santa Inês', 'Jardim Santa Inês',
      'Parque Santa Inês', 'Vila Santa Inês'
    ],
    'UBS Santo Onofre': [
      'Santo Onofre', 'Jardim Santo Onofre', 'Parque Santo Onofre',
      'Vila Santo Onofre', 'Bairro Santo Onofre'
    ],
    'UBS Vista Verde': [
      'Vista Verde', 'Jardim Vista Verde', 'Parque Vista Verde',
      'Vila Vista Verde', 'Condomínio Vista Verde'
    ],
    'Unidade Avançada São Francisco Xavier': [
      'São Francisco Xavier', 'Distrito de São Francisco Xavier',
      'Zona Rural São Francisco Xavier'
    ],
    'Unidade Avançada Vila Nair': [
      'Vila Nair', 'Jardim Vila Nair', 'Parque Vila Nair'
    ],
    'Unidade Avançada São Judas Tadeu': [
      'São Judas Tadeu', 'Vila São Judas', 'Jardim São Judas Tadeu',
      'Parque São Judas Tadeu'
    ],
    'Unidade Avançada Vila Paiva': [
      'Vila Paiva', 'Jardim Vila Paiva', 'Parque Vila Paiva'
    ],
    'Unidade Avançada Vila Tesouro': [
      'Vila Tesouro', 'Jardim Vila Tesouro', 'Parque Vila Tesouro',
      'Recanto do Tesouro'
    ]
  };

  // Buscar todas as UBS cadastradas para conseguir o ID
  const todasUbs = await knex('ubs').select('id', 'nome');
  
  // Converter array em map para busca rápida do ID pelo nome
  const ubsMap = {};
  for (const ubs of todasUbs) {
    ubsMap[ubs.nome] = ubs.id;
  }

  // Prepara registros para inserção
  for (const [nomeUbs, bairros] of Object.entries(mapeamento)) {
    const ubsId = ubsMap[nomeUbs];
    
    if (!ubsId) {
      console.warn(`[SEED] UBS não encontrada no banco de dados: "${nomeUbs}". Os bairros foram ignorados.`);
      continue;
    }

    for (const bairro of bairros) {
      const bairroBusca = normalizar(bairro);

      // Checagem de idempotência
      const existente = await knex('bairros_ubs')
        .where({ ubs_id: ubsId, bairro })
        .first();

      if (!existente) {
        await knex('bairros_ubs').insert({
          ubs_id: ubsId,
          bairro: bairro,
          bairro_busca: bairroBusca
        });
      }
    }
  }
};
