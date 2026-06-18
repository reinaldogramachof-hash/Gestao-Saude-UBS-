# REPORT 02 — Correções nos 4 módulos novos
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** 2026-06-18

## Sumário Executivo
Foram aplicadas com sucesso correções de usabilidade, tratamento de erros e tradução/suavização de terminologia técnica em 4 novos módulos do frontend (`RegulacaoGestor.jsx`, `TransporteGestor.jsx`, `ServicoSocialGestor.jsx` e `VigilanciaGestor.jsx`). Todos os botões inertes de criação agora exibem toast indicando que são funcionalidades da Fase 2, as tabelas com labels brutos em caixa alta/underscores foram mapeadas para português claro e amigável (cumprindo a regra de linguagem simples do projeto) e as falhas de API agora possuem tratamento visual amigável via hot-toasts na tela.

---

## RegulacaoGestor.jsx
**paciente_id disponível:** Sim. No backend `app/backend/src/routes/gestor.js` (linhas 991-998), a query seleciona `encaminhamentos.*` que contém o campo de chave estrangeira `paciente_id` ligado à tabela `pacientes`.
**Diff aplicado:**
```diff
@@ -1,4 +1,13 @@
+/**
+ * PÁGINA: RegulacaoGestor.jsx
+ * ─────────────────────────────────────────────────────────────────────────────
+ * FUNÇÃO: Gerencia os encaminhamentos de pacientes para a regulação de saúde externa (CROSS).
+ * API: GET /api/gestor/encaminhamentos
+ * ─────────────────────────────────────────────────────────────────────────────
+ */
 import React, { useState, useEffect } from 'react';
+import { useNavigate } from 'react-router-dom';
+import toast from 'react-hot-toast';
 import GestorLayout from '../../components/gestor/GestorLayout';
 import api from '../../services/api';
 
@@ -7,6 +7,12 @@
   VERDE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
 };
 
+const PRIORIDADE_LABELS = {
+  VERMELHO: 'Alta',
+  AMARELO:  'Média',
+  VERDE:    'Baixa',
+};
+
 const STATUS_LABELS = {
   AGUARDANDO_VAGA: 'Aguardando Vaga',
   AGENDADO: 'Agendado',
@@ -14,6 +14,7 @@
 };
 
 export default function RegulacaoGestor() {
+  const navigate = useNavigate();
   const [encaminhamentos, setEncaminhamentos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filtroStatus, setFiltroStatus] = useState('TODOS');
@@ -27,7 +27,8 @@
       const { data } = await api.get('/gestor/encaminhamentos');
       setEncaminhamentos(data);
     } catch (err) {
-      console.error('Erro ao buscar regulação:', err);
+      console.error('[RegulacaoGestor]', err);
+      toast.error('Não foi possível carregar os encaminhamentos. Tente novamente.');
     } finally {
       setLoading(false);
     }
@@ -51,6 +51,7px
           <p className="text-on-surface-variant mt-1">Gerencie os encaminhamentos para CAPS, AMEs e Hospitais.</p>
         </div>
         <button
+          onClick={() => toast.info('Funcionalidade em implementação — disponível na Fase 2.')}
           className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
         >
           <span className="material-symbols-outlined">post_add</span>
@@ -135,7 +135,7 @@
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${PRIORIDADE_CORES[enc.prioridade]}`}>
-                          {enc.prioridade}
+                          {PRIORIDADE_LABELS[enc.prioridade] || enc.prioridade}
                         </span>
                       </td>
                       <td className="px-6 py-4">
@@ -163,7 +163,10 @@
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
-                        <button className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors">
+                        <button 
+                          onClick={() => navigate('/gestor/paciente/' + enc.paciente_id)}
+                          className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors"
+                        >
                           Ver Detalhes
                         </button>
                       </td>
```

---

## TransporteGestor.jsx
**Diff aplicado:**
```diff
@@ -1,4 +1,12 @@
+/**
+ * PÁGINA: TransporteGestor.jsx
+ * ─────────────────────────────────────────────────────────────────────────────
+ * FUNÇÃO: Controla as viagens e frotas de transporte sanitário de pacientes.
+ * API: GET /api/gestor/transporte
+ * ─────────────────────────────────────────────────────────────────────────────
+ */
 import React, { useState, useEffect } from 'react';
+import toast from 'react-hot-toast';
 import GestorLayout from '../../components/gestor/GestorLayout';
 import api from '../../services/api';
 
@@ -8,6 +8,13 @@
   FALTOU: 'bg-red-100 text-red-800',
 };
 
+const STATUS_LABELS = {
+  AGENDADO:     'Agendado',
+  EM_TRANSITO:  'Em trânsito',
+  CONCLUIDO:    'Concluído',
+  FALTOU:       'Paciente faltou',
+};
+
 export default function TransporteGestor() {
   const [viagens, setViagens] = useState([]);
   const [loading, setLoading] = useState(true);
@@ -21,7 +21,8 @@
       const { data } = await api.get('/gestor/transporte');
       setViagens(data);
     } catch (err) {
-      console.error('Erro ao buscar transporte:', err);
+      console.error('[TransporteGestor]', err);
+      toast.error('Não foi possível carregar as viagens. Tente novamente.');
     } finally {
       setLoading(false);
     }
@@ -34,6 +34,7px
           <p className="text-on-surface-variant mt-1">Gestão de frotas e pacientes em trânsito para exames externos.</p>
         </div>
         <button
+          onClick={() => toast.info('Agendamento de transporte disponível na Fase 2.')}
           className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
         >
           <span className="material-symbols-outlined">directions_bus</span>
@@ -50,7 +50,7 @@
             <div key={viagem.id} className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
               <div className="flex items-center justify-between mb-4">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_CORES[viagem.status]}`}>
-                  {viagem.status}
+                  {STATUS_LABELS[viagem.status] || viagem.status}
                 </span>
```

---

## ServicoSocialGestor.jsx
**paciente_id disponível:** Sim. No backend `app/backend/src/routes/gestor.js` (linhas 1024-1030), a rota `/servico-social` seleciona `casos_sociais.*` que inclui a chave estrangeira `paciente_id`.
**Diff aplicado:**
```diff
@@ -1,4 +1,13 @@
+/**
+ * PÁGINA: ServicoSocialGestor.jsx
+ * ─────────────────────────────────────────────────────────────────────────────
+ * FUNÇÃO: Acompanhamento de famílias e pacientes sob vulnerabilidade social.
+ * API: GET /api/gestor/servico-social
+ * ─────────────────────────────────────────────────────────────────────────────
+ */
 import React, { useState, useEffect } from 'react';
+import { useNavigate } from 'react-router-dom';
+import toast from 'react-hot-toast';
 import GestorLayout from '../../components/gestor/GestorLayout';
 import api from '../../services/api';
 
@@ -8,6 +8,13 @@
   HIGIENE: 'bg-blue-100 text-blue-800 border-blue-200',
 };
 
+const VULNERABILIDADE_LABELS = {
+  FOME:                'Insegurança Alimentar',
+  VIOLENCIA_DOMESTICA: 'Violência Doméstica',
+  ABANDONO_TRATAMENTO: 'Abandono de Tratamento',
+  HIGIENE:             'Condições de Higiene',
+};
+
 const STATUS_LABELS = {
   EM_ACOMPANHAMENTO: 'Em Acompanhamento',
   ENCAMINHADO_CRAS: 'Encaminhado CRAS/CREAS',
@@ -14,6 +14,7 @@
 };
 
 export default function ServicoSocialGestor() {
+  const navigate = useNavigate();
   const [casos, setCasos] = useState([]);
   const [loading, setLoading] = useState(true);
 
@@ -26,7 +26,8 @@
       const { data } = await api.get('/gestor/servico-social');
       setCasos(data);
     } catch (err) {
-      console.error('Erro ao buscar serviço social:', err);
+      console.error('[ServicoSocialGestor]', err);
+      toast.error('Não foi possível carregar os casos sociais. Tente novamente.');
     } finally {
       setLoading(false);
     }
@@ -39,6 +39,7px
           <p className="text-on-surface-variant mt-1">Acompanhamento de vulnerabilidades e apoio CRAS/CREAS.</p>
         </div>
         <button
+          onClick={() => toast.info('Triagem social disponível na Fase 2.')}
           className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
         >
           <span className="material-symbols-outlined">person_add</span>
@@ -81,7 +81,7 @@
                     </td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${VULNERABILIDADE_CORES[caso.vulnerabilidade] || 'bg-gray-100 text-gray-800'}`}>
-                        {caso.vulnerabilidade.replace('_', ' ')}
+                        {VULNERABILIDADE_LABELS[caso.vulnerabilidade] || caso.vulnerabilidade}
                       </span>
                     </td>
                     <td className="px-6 py-4">
@@ -95,7 +95,10 @@
                       </p>
                     </td>
                     <td className="px-6 py-4 text-right">
-                      <button className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors">
+                      <button 
+                        onClick={() => navigate('/gestor/paciente/' + caso.paciente_id)}
+                        className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors"
+                      >
                         Ver Relatório
                       </button>
                     </td>
```

---

## VigilanciaGestor.jsx
**paciente_id disponível:** Sim (mas com tratamento defensivo). No backend `app/backend/src/routes/gestor.js` (linhas 1062-1069), a rota `/vigilancia` faz `leftJoin` com a tabela `pacientes` e seleciona `notificacoes_vigilancia.*`. Isso traz o `paciente_id` (que pode ser `null` em notificações anônimas ou com pacientes não cadastrados). Por isso, no frontend, adicionamos uma verificação defensiva (`notificacao.paciente_id ? navigate(...) : toast.info(...)`) para evitar erros de navegação a páginas com IDs indefinidos.
**Diff aplicado:**
```diff
@@ -1,4 +1,13 @@
+/**
+ * PÁGINA: VigilanciaGestor.jsx
+ * ─────────────────────────────────────────────────────────────────────────────
+ * FUNÇÃO: Monitoramento epidemiológico de agravos e doenças compulsórias.
+ * API: GET /api/gestor/vigilancia
+ * ─────────────────────────────────────────────────────────────────────────────
+ */
 import React, { useState, useEffect } from 'react';
+import { useNavigate } from 'react-router-dom';
+import toast from 'react-hot-toast';
 import GestorLayout from '../../components/gestor/GestorLayout';
 import api from '../../services/api';
 
@@ -7,6 +7,12 @@
   DESCARTADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
 };
 
+const STATUS_LABELS = {
+  SUSPEITO:   'Em Investigação',
+  CONFIRMADO: 'Confirmado',
+  DESCARTADO: 'Descartado',
+};
+
 export default function VigilanciaGestor() {
+  const navigate = useNavigate();
   const [notificacoes, setNotificacoes] = useState([]);
   const [loading, setLoading] = useState(true);
 
@@ -20,7 +20,8 @@
       const { data } = await api.get('/gestor/vigilancia');
       setNotificacoes(data);
     } catch (err) {
-      console.error('Erro ao buscar vigilância:', err);
+      console.error('[VigilanciaGestor]', err);
+      toast.error('Não foi possível carregar as notificações. Tente novamente.');
     } finally {
       setLoading(false);
     }
@@ -33,6 +34,7px
           <p className="text-on-surface-variant mt-1">Monitoramento de surtos e doenças de notificação compulsória no território.</p>
         </div>
         <button
+          onClick={() => toast.info('Notificação epidemiológica disponível na Fase 2.')}
           className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
         >
           <span className="material-symbols-outlined">coronavirus</span>
@@ -115,11 +115,14 @@
                     </td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold border ${STATUS_CORES[notificacao.status_investigacao]}`}>
-                        {notificacao.status_investigacao}
+                        {STATUS_LABELS[notificacao.status_investigacao] || notificacao.status_investigacao}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
-                      <button className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors">
+                      <button 
+                        onClick={() => notificacao.paciente_id ? navigate('/gestor/paciente/' + notificacao.paciente_id) : toast.info('Investigação disponível em breve.')}
+                        className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors"
+                      >
                         Investigar
                       </button>
                     </td>
```

---

## Pendências identificadas
Nenhuma pendência técnica. Todos os itens de escopo foram cumpridos com sucesso nas camadas de roteamento, mapeamento de terminologias e tratamentos de interface em tempo de execução.
