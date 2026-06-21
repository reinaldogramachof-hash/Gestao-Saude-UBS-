/**
 * SEED 005 - Catalogo de Procedimentos
 * -----------------------------------------------------------------------------
 * Popula procedimentos reais/comuns da rede SUS para alimentar comboboxes do
 * gestor. Os registros sao idempotentes pelo nome para permitir reruns seguros.
 */
exports.seed = async function seed(knex) {
  const procedimentos = [
    // UBS - procedimentos e exames comuns executados ou solicitados na unidade.
    { nome: 'Hemograma Completo', especialidade: 'Hematologia', tipo_unidade: 'UBS' },
    { nome: 'Glicemia em Jejum', especialidade: 'Bioquimica', tipo_unidade: 'UBS' },
    { nome: 'Urina Tipo I (EAS)', especialidade: 'Urologia', tipo_unidade: 'UBS' },
    { nome: 'Eletrocardiograma (ECG)', especialidade: 'Cardiologia', tipo_unidade: 'UBS' },
    { nome: 'Afericao de Pressao Arterial', especialidade: 'Clinica Geral', tipo_unidade: 'UBS' },
    { nome: 'Curativo Simples', especialidade: 'Enfermagem', tipo_unidade: 'UBS' },
    { nome: 'Vacina (rotina)', especialidade: 'Imunizacao', tipo_unidade: 'UBS' },

    // AME - exames e consultas ambulatoriais especializadas.
    { nome: 'Ecocardiograma', especialidade: 'Cardiologia', tipo_unidade: 'AME' },
    { nome: 'Espirometria', especialidade: 'Pneumologia', tipo_unidade: 'AME' },
    { nome: 'Colonoscopia', especialidade: 'Gastroenterologia', tipo_unidade: 'AME' },
    { nome: 'Endoscopia Digestiva Alta', especialidade: 'Gastroenterologia', tipo_unidade: 'AME' },
    { nome: 'Holter 24h', especialidade: 'Cardiologia', tipo_unidade: 'AME' },

    // CAPS - cuidado psicossocial e saude mental.
    { nome: 'Consulta Psiquiatrica', especialidade: 'Psiquiatria', tipo_unidade: 'CAPS' },
    { nome: 'Avaliacao Psicologica', especialidade: 'Psicologia', tipo_unidade: 'CAPS' },
    { nome: 'Terapia em Grupo', especialidade: 'Saude Mental', tipo_unidade: 'CAPS' },

    // Hospital - procedimentos de maior complexidade.
    { nome: 'Cirurgia Ambulatorial', especialidade: 'Cirurgia Geral', tipo_unidade: 'HOSPITAL' },
    { nome: 'Internacao', especialidade: 'Clinica Medica', tipo_unidade: 'HOSPITAL' },
    { nome: 'Hemodialise', especialidade: 'Nefrologia', tipo_unidade: 'HOSPITAL' },
    { nome: 'Quimioterapia', especialidade: 'Oncologia', tipo_unidade: 'HOSPITAL' },

    // UPA - atendimento de urgencia e estabilizacao.
    { nome: 'Sutura de Ferimento', especialidade: 'Cirurgia Geral', tipo_unidade: 'UPA' },
    { nome: 'Reducao de Fratura', especialidade: 'Ortopedia', tipo_unidade: 'UPA' },
    { nome: 'Hidratacao Venosa', especialidade: 'Clinica Geral', tipo_unidade: 'UPA' },
    { nome: 'Atendimento de Urgencia', especialidade: 'Emergencia', tipo_unidade: 'UPA' },

    // Centro de Especialidades - consultas e exames especializados.
    { nome: 'Consulta Ortopedica', especialidade: 'Ortopedia', tipo_unidade: 'CENTRO_ESPECIALIDADES' },
    { nome: 'Consulta Dermatologica', especialidade: 'Dermatologia', tipo_unidade: 'CENTRO_ESPECIALIDADES' },
    { nome: 'Consulta Oftalmologica', especialidade: 'Oftalmologia', tipo_unidade: 'CENTRO_ESPECIALIDADES' },
    { nome: 'Consulta Otorrinolaringologica', especialidade: 'Otorrinolaringologia', tipo_unidade: 'CENTRO_ESPECIALIDADES' },
    { nome: 'Ultrassonografia Abdominal', especialidade: 'Radiologia', tipo_unidade: 'CENTRO_ESPECIALIDADES' },
    { nome: 'Raio-X Torax', especialidade: 'Radiologia', tipo_unidade: 'CENTRO_ESPECIALIDADES' },

    // Procedimentos que podem ser direcionados a qualquer unidade habilitada.
    { nome: 'Tomografia Computadorizada', especialidade: 'Radiologia', tipo_unidade: null },
    { nome: 'Ressonancia Magnetica', especialidade: 'Radiologia', tipo_unidade: null },
  ];

  await knex('catalogo_procedimentos')
    .insert(procedimentos)
    .onConflict('nome')
    .merge({
      especialidade: knex.raw('excluded.especialidade'),
      tipo_unidade: knex.raw('excluded.tipo_unidade'),
      ativo: true,
    });
};
