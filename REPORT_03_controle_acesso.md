# REPORT 03 — Controle de Acesso por Perfil
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** 2026-06-18

## Sumário
Confirmo que apenas o arquivo `app/frontend/src/components/gestor/SideNavGestor.jsx` foi modificado para aplicar o controle de acesso por perfil (nav-level) no menu lateral do Portal do Gestor, respeitando a matriz de permissões do projeto.

---

## Diff aplicado
```diff
diff --git a/app/frontend/src/components/gestor/SideNavGestor.jsx b/app/frontend/src/components/gestor/SideNavGestor.jsx
index d53d865..4a81ba7 100644
--- a/app/frontend/src/components/gestor/SideNavGestor.jsx
+++ b/app/frontend/src/components/gestor/SideNavGestor.jsx
@@ -18,6 +18,22 @@ const PERFIL_LABEL = {
   medico:        'Médico',
 };
 
+// Mapa de controle de acesso por perfil.
+// Cada chave representa a "seção" de rota. O valor é o array de perfis
+// que têm permissão de ver o item no menu.
+const PERFIS_ACESSO = {
+  dashboard:         ['recepcionista', 'gestor', 'admin', 'medico'],
+  pacientes:         ['recepcionista', 'gestor', 'admin'],
+  medico:            ['admin', 'medico'],
+  agendamentos:      ['recepcionista', 'gestor', 'admin'],
+  regulacao:         ['gestor', 'admin'],
+  transporte:        ['gestor', 'admin'],
+  'servico-social':  ['gestor', 'admin'],
+  vigilancia:        ['gestor', 'admin'],
+  medicamentos:      ['recepcionista', 'gestor', 'admin'],
+  comunicados:       ['recepcionista', 'gestor', 'admin'],
+};
+
 export default function SideNavGestor({ onFechar, retraida, onToggle }) {
   const { pathname } = useLocation();
   const { user, logout } = useAuth();
@@ -85,6 +101,11 @@ export default function SideNavGestor({ onFechar, retraida, onToggle }) {
     .join('')
     .toUpperCase();
 
+  // Helper: retorna true se o perfil do usuário logado tem acesso à seção.
+  // Fallback para false se o perfil não estiver mapeado (seguro por padrão).
+  const pode = (secao) =>
+    PERFIS_ACESSO[secao]?.includes(user?.perfil) ?? false;
+
   return (
     <aside className={`w-72 ${retraida ? 'lg:w-16' : 'lg:w-72'} bg-surface-container-lowest border-r border-surface-variant flex flex-col h-full transition-all duration-300 relative z-20`}>
       {/* Cabeçalho */}
@@ -117,6 +138,7 @@ export default function SideNavGestor({ onFechar, retraida, onToggle }) {
       {/* Removemos overflow-hidden no aside e mantemos overflow-y-auto no nav. 
           O tooltip pode gerar um pequeno scroll horizontal no nav, mas a estética premium compensa. */}
       <nav className="p-3 pt-4 flex-1 overflow-y-auto overflow-x-visible no-scrollbar">
+        {/* Item sempre visível para todos os perfis */}
         <NavItem
           to="/gestor/dashboard"
           icon="dashboard"
@@ -125,87 +147,148 @@ export default function SideNavGestor({ onFechar, retraida, onToggle }) {
           onClick={handleNavegar}
         />
 
-        <SectionLabel label="ATENDIMENTO" retraida={retraida} />
-        <NavItem
-          to="/gestor/pacientes"
-          icon="people"
-          label="Pacientes"
-          retraida={retraida}
-          activeClass={isActive('pacientes')}
-          onClick={handleNavegar}
-          badgeCount={pendentes}
-        />
-        {/* Painel Médico: acesso clínico read-only por CRA */}
-        <NavItem
-          to="/gestor/medico"
-          icon="stethoscope"
-          label="Painel Médico"
-          retraida={retraida}
-          activeClass={isActive('medico')}
-          onClick={handleNavegar}
-        />
-        <NavItem
-          to="/gestor/agendamentos"
-          icon="calendar_month"
-          label="Agendamentos"
-          retraida={retraida}
-          activeClass={isActive('agendamentos')}
-          onClick={handleNavegar}
-        />
-        <SectionLabel label="REDE EXTERNA E APOIO" retraida={retraida} />
-        <NavItem
-          to="/gestor/regulacao"
-          icon="account_tree"
-          label="Regulação"
-          retraida={retraida}
-          activeClass={isActive('regulacao')}
-          onClick={handleNavegar}
-        />
-        <NavItem
-          to="/gestor/transporte"
-          icon="directions_bus"
-          label="Transporte Sanitário"
-          retraida={retraida}
-          activeClass={isActive('transporte')}
-          onClick={handleNavegar}
-        />
-        <NavItem
-          to="/gestor/servico-social"
-          icon="diversity_1"
-          label="Serviço Social"
-          retraida={retraida}
-          activeClass={isActive('servico-social')}
-          onClick={handleNavegar}
-        />
-        <NavItem
-          to="/gestor/vigilancia"
-          icon="coronavirus"
-          label="Vigilância e Surtos"
-          retraida={retraida}
-          activeClass={isActive('vigilancia')}
-          onClick={handleNavegar}
-        />
-
-        <SectionLabel label="FARMÁCIA" retraida={retraida} />
-        <NavItem
-          to="/gestor/medicamentos"
-          icon="medication"
-          label="Medicamentos"
-          retraida={retraida}
-          activeClass={isActive('medicamentos')}
-          onClick={handleNavegar}
-        />
-
-        <SectionLabel label="COMUNICAÇÃO" retraida={retraida} />
-        <NavItem
-          to="/gestor/comunicados"
-          icon="campaign"
-          label="Comunicados"
-          retraida={retraida}
-          activeClass={isActive('comunicados')}
-          onClick={handleNavegar}
-        />
-
+        {/* ───────────────────────────────────────────────────────────────────
+            SEÇÃO: ATENDIMENTO
+            Visível se o perfil tiver acesso a Pacientes, Painel Médico ou Agendamentos
+            ─────────────────────────────────────────────────────────────────── */}
+        {(pode('pacientes') || pode('medico') || pode('agendamentos')) && (
+          <SectionLabel label="ATENDIMENTO" retraida={retraida} />
+        )}
+        
+        {/* Pacientes: apenas para recepcionista, gestor e admin */}
+        {pode('pacientes') && (
+          <NavItem
+            to="/gestor/pacientes"
+            icon="people"
+            label="Pacientes"
+            retraida={retraida}
+            activeClass={isActive('pacientes')}
+            onClick={handleNavegar}
+            badgeCount={pendentes}
+          />
+        )}
+        
+        {/* Painel Médico: consulta clínica exclusiva para médicos e admin */}
+        {pode('medico') && (
+          <NavItem
+            to="/gestor/medico"
+            icon="stethoscope"
+            label="Painel Médico"
+            retraida={retraida}
+            activeClass={isActive('medico')}
+            onClick={handleNavegar}
+          />
+        )}
+        
+        {/* Agendamentos: apenas para recepcionista, gestor e admin */}
+        {pode('agendamentos') && (
+          <NavItem
+            to="/gestor/agendamentos"
+            icon="calendar_month"
+            label="Agendamentos"
+            retraida={retraida}
+            activeClass={isActive('agendamentos')}
+            onClick={handleNavegar}
+          />
+        )}
+
+        {/* ───────────────────────────────────────────────────────────────────
+            SEÇÃO: REDE EXTERNA E APOIO
+            Visível se o perfil tiver acesso a Regulação, Transporte, Serviço Social ou Vigilância
+            ─────────────────────────────────────────────────────────────────── */}
+        {(pode('regulacao') || pode('transporte') || pode('servico-social') || pode('vigilancia')) && (
+          <SectionLabel label="REDE EXTERNA E APOIO" retraida={retraida} />
+        )}
+        
+        {/* Regulação: apenas para gestores e admins */}
+        {pode('regulacao') && (
+          <NavItem
+            to="/gestor/regulacao"
+            icon="account_tree"
+            label="Regulação"
+            retraida={retraida}
+            activeClass={isActive('regulacao')}
+            onClick={handleNavegar}
+          />
+        )}
+        
+        {/* Transporte Sanitário: apenas para gestores e admins */}
+        {pode('transporte') && (
+          <NavItem
+            to="/gestor/transporte"
+            icon="directions_bus"
+            label="Transporte Sanitário"
+            retraida={retraida}
+            activeClass={isActive('transporte')}
+            onClick={handleNavegar}
+          />
+        )}
+        
+        {/* Serviço Social: apenas para gestores e admins */}
+        {pode('servico-social') && (
+          <NavItem
+            to="/gestor/servico-social"
+            icon="diversity_1"
+            label="Serviço Social"
+            retraida={retraida}
+            activeClass={isActive('servico-social')}
+            onClick={handleNavegar}
+          />
+        )}
+        
+        {/* Vigilância e Surtos: apenas para gestores e admins */}
+        {pode('vigilancia') && (
+          <NavItem
+            to="/gestor/vigilancia"
+            icon="coronavirus"
+            label="Vigilância e Surtos"
+            retraida={retraida}
+            activeClass={isActive('vigilancia')}
+            onClick={handleNavegar}
+          />
+        )}
+
+        {/* ───────────────────────────────────────────────────────────────────
+            SEÇÃO: FARMÁCIA
+            Visível se o perfil tiver acesso a Medicamentos
+            ─────────────────────────────────────────────────────────────────── */}
+        {pode('medicamentos') && (
+          <>
+            <SectionLabel label="FARMÁCIA" retraida={retraida} />
+            <NavItem
+              to="/gestor/medicamentos"
+              icon="medication"
+              label="Medicamentos"
+              retraida={retraida}
+              activeClass={isActive('medicamentos')}
+              onClick={handleNavegar}
+            />
+          </>
+        )}
+
+        {/* ───────────────────────────────────────────────────────────────────
+            SEÇÃO: COMUNICAÇÃO
+            Visível se o perfil tiver acesso a Comunicados
+            ─────────────────────────────────────────────────────────────────── */}
+        {pode('comunicados') && (
+          <>
+            <SectionLabel label="COMUNICAÇÃO" retraida={retraida} />
+            <NavItem
+              to="/gestor/comunicados"
+              icon="campaign"
+              label="Comunicados"
+              retraida={retraida}
+              activeClass={isActive('comunicados')}
+              onClick={handleNavegar}
+            />
+          </>
+        )}
+
+        {/* ───────────────────────────────────────────────────────────────────
+            SEÇÃO: ADMINISTRAÇÃO
+            Visível apenas para administradores do sistema.
+            Mantém a lógica intacta com user?.perfil === 'admin' conforme exigido.
+            ─────────────────────────────────────────────────────────────────── */}
         {user?.perfil === 'admin' && (
           <>
             <SectionLabel label="ADMINISTRAÇÃO" retraida={retraida} />
```

## Verificação por perfil
Abaixo estão detalhados os itens visíveis no menu lateral para cada perfil:

### 1. Perfil: `recepcionista`
*   **Seções de cabeçalho visíveis:**
    *   `ATENDIMENTO`
    *   `FARMÁCIA`
    *   `COMUNICAÇÃO`
*   **Itens de menu:**
    *   Painel Principal
    *   Pacientes
    *   Agendamentos
    *   Medicamentos
    *   Comunicados

### 2. Perfil: `gestor`
*   **Seções de cabeçalho visíveis:**
    *   `ATENDIMENTO`
    *   `REDE EXTERNA E APOIO`
    *   `FARMÁCIA`
    *   `COMUNICAÇÃO`
*   **Itens de menu:**
    *   Painel Principal
    *   Pacientes
    *   Agendamentos
    *   Regulação
    *   Transporte Sanitário
    *   Serviço Social
    *   Vigilância e Surtos
    *   Medicamentos
    *   Comunicados

### 3. Perfil: `admin`
*   **Seções de cabeçalho visíveis:**
    *   `ATENDIMENTO`
    *   `REDE EXTERNA E APOIO`
    *   `FARMÁCIA`
    *   `COMUNICAÇÃO`
    *   `ADMINISTRAÇÃO`
*   **Itens de menu:**
    *   Painel Principal
    *   Pacientes
    *   Painel Médico
    *   Agendamentos
    *   Regulação
    *   Transporte Sanitário
    *   Serviço Social
    *   Vigilância e Surtos
    *   Medicamentos
    *   Comunicados
    *   Usuários (Gestão de Equipe)
    *   Relatórios (Status "Em breve")

### 4. Perfil: `medico`
*   **Seções de cabeçalho visíveis:**
    *   `ATENDIMENTO`
*   **Itens de menu:**
    *   Painel Principal
    *   Painel Médico

---

## Pendências
*   Nenhum desvio foi identificado. A matriz de acesso foi implementada rigorosamente como solicitado, e o menu de administração manteve sua lógica isolada original (`user?.perfil === 'admin'`).
*   As rotas do roteador principal (`App.jsx`) continuam operacionais para os devidos perfis gestores através do `ProtectedRoute tipo="gestor"` (a proteção ao nível de rota é suficiente para este escopo MVP).
