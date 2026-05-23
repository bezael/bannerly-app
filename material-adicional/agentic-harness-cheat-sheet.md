# Agentic Harness — Cheat Sheet

**Agente = Modelo + Harness**
El modelo es la inteligencia. El harness es todo el código, configuración y lógica de ejecución que lo rodea y lo vuelve útil. Si no es el modelo, es el harness.

---

## Los 5 grupos de componentes del harness

### 1 · Contexto e instrucciones
Los priors que le das al modelo. Define cómo trabaja antes de tocar nada.
`system prompt` · `CLAUDE.md` · `AGENTS.md` · `specs` · `memoria`

### 2 · Tools
Lo que el modelo puede llamar para actuar sobre el mundo.

- **`bash + code execution`** — la tool de propósito general. En vez de preconfigurarle cada acción, el agente escribe y ejecuta su propia tool sobre la marcha. El default para resolver problemas de forma autónoma.
- **`tools específicas`** — read, edit, web search.
- **`skills`** — capacidad cargada bajo demanda.
- **`MCPs`** — conexión a sistemas externos.

### 3 · Infraestructura de ejecución
Dónde corre el agente. Estado durable, workspace, ejecución aislada.
`filesystem` · `git` · `sandbox` · `runtimes + CLIs`

### 4 · Orquestación
Descompone el trabajo y lo reparte. Cada subagente con contexto aislado.
`subagents` · `handoffs` · `ruteo de modelos`

### 5 · Hooks / middleware
Ejecución determinística entre pasos del agente.
`compaction` · `continuación` · `lint + tests`

---

**Regla mental:** la inteligencia vive en el modelo. Todo lo demás que hace que un agente funcione lo diseñás vos. Las fronteras entre los grupos no son rígidas — skills, por ejemplo, también protege el contexto. El harness es un sistema de diseño, no una taxonomía cerrada.
