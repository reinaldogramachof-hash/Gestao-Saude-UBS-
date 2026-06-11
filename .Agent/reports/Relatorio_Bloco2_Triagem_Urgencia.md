# Relatório de Implementação — Bloco 2: Triagem de Urgência + Comunicação Ativa

## Visão Geral
Este relatório descreve as alterações implementadas durante o **Bloco 2** do projeto Gestão Saúde UBS+, cujo objetivo é garantir que casos graves não se percam (Atenção Imediata) e que a comunicação entre UBS e paciente seja ativa (Sistema de Avisos com confirmação de leitura).

## 1. Backend e Banco de Dados

### Migrações (Database)
- **`009_create_comunicados_leitura.js`**: Criada a tabela `comunicados_leitura` para registrar quais pacientes leram quais comunicados. Esta tabela utiliza uma chave primária composta `(comunicado_id, paciente_id)` para prevenir leituras duplicadas do mesmo aviso.
- Executada a migração com sucesso no ambiente de desenvolvimento (`npx knex migrate:latest`).

### Novas Rotas (Gestor)
- **`GET /api/gestor/alertas`**: 
  - Retorna solicitações que precisam de **Atenção Imediata** com base em regras de negócios (Epico 2).
  - Identifica casos **Urgentes** (prioridade = urgente), **Prioritários** (pendentes há >48h ou >7d dependendo do status) e casos esquecidos.
  - Segurança garantida pelo filtro de `ubs_id` do gestor.
- **`PATCH /api/gestor/solicitacao/:id/escalar`**:
  - Permite a escalada de uma solicitação de rotina/prioritário para "urgente".
  - Registra a mudança automaticamente na tabela de `historico_status` e exige uma justificativa com mais de 10 caracteres.

### Rotas Atualizadas (Paciente)
- **`GET /api/paciente/comunicados`**:
  - Atualizada com um `LEFT JOIN` na tabela de `comunicados_leitura` para incluir o status `lido` diretamente nos itens retornados.
- **`POST /api/paciente/comunicado/:id/lido`**:
  - Rota responsável por marcar um comunicado como lido. Usa `INSERT ... ON CONFLICT DO NOTHING` para garantir resiliência e não quebrar caso o paciente tente marcar o mesmo aviso mais de uma vez.

## 2. Frontend

### Painel do Gestor
- **`DashboardGestor.jsx`**: 
  - O painel agora consome e exibe as estatísticas de alertas por meio de `Promise.all` (`/gestor/dashboard/stats` e `/gestor/alertas`).
  - Um novo bloco vermelho ("Atenção Imediata") é exibido acima das estatísticas de métricas se houver pendências ativas.
- **`PerfilPaciente.jsx`**: 
  - Adicionado o botão "⚠ Escalar" aos pedidos que não estejam já com prioridade "urgente" e que não estejam finalizados ("concluido" ou "cancelado").
  - Criado o modal para forçar a exigência de justificativa descritiva, ativando a rota `PATCH /escalar`.

### Portal do Paciente
- **`ComunicadosPaciente.jsx`**:
  - Refatorado para lidar com o status visual de "lido" vs "não lido". 
  - Comunicados não lidos são destacados visualmente com a tag "Novo" e um leve background azul. 
  - Ao expandir (clicar) num comunicado não lido, a API `POST` é chamada para atualizar o banco de dados e o estado local muda sem a necessidade de recarregar a tela inteira.
- **`BottomNavPaciente.jsx` e Header**:
  - O contador de avisos não lidos agora é processado localmente buscando os comunicados pendentes na montagem inicial e ao navegar.
  - Exibe um badge de notificação flutuante sobre o ícone "Avisos".

## 3. Validação e Testes
- **Build Frontend**: Build concluído com sucesso (`vite build`).
- **Comentários Pedagógicos**: Todos os arquivos alterados receberam os devidos comentários para auxiliar no aprendizado de desenvolvedores juniores que atuarão no mesmo repositório, garantindo conformidade com a diretriz principal descrita em `CLAUDE.md`.

## Conclusão e Próximos Passos
O **Bloco 2** foi integrado e atende satisfatoriamente os requisitos de urgência, escalada e a garantia de visualização de comunicados na visão do paciente. 
A fundação está consolidada para as próximas etapas ou eventuais implantações em Staging/Produção.
