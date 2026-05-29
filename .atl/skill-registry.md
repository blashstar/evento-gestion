# Skill Registry - evento-promperu

> Generated: 2026-04-01| Project: evento-promperu
> Mode: engram

## SDD Phases

| Skill | Path | Trigger |
|-------|------|---------|
| sdd-init | `~/.config/opencode/skills/sdd-init/SKILL.md` | Iniciar SDD en proyecto |
| sdd-explore | `~/.config/opencode/skills/sdd-explore/SKILL.md` | Explorar ideas antes de cambiar |
| sdd-propose | `~/.config/opencode/skills/sdd-propose/SKILL.md` | Crear propuesta de cambio |
| sdd-spec | `~/.config/opencode/skills/sdd-spec/SKILL.md` | Escribir especificaciones |
| sdd-design | `~/.config/opencode/skills/sdd-design/SKILL.md` | Diseño técnico |
| sdd-tasks | `~/.config/opencode/skills/sdd-tasks/SKILL.md` | Desglose de tareas |
| sdd-apply | `~/.config/opencode/skills/sdd-apply/SKILL.md` | Implementar tareas |
| sdd-verify | `~/.config/opencode/skills/sdd-verify/SKILL.md` | Verificar implementación |
| sdd-archive | `~/.config/opencode/skills/sdd-archive/SKILL.md` | Archivar cambio completado |

## Development Skills

| Skill | Path | Trigger |
|-------|------|---------|
| bmad-quick-dev | `~/.opencode/skills/bmad-quick-dev/SKILL.md` | Implementación rápida de features |
| bmad-dev-story | `~/.opencode/skills/bmad-dev-story/SKILL.md` | Ejecutar story de implementación |
| bmad-code-review | `~/.opencode/skills/bmad-code-review/SKILL.md` | Revisión de código adversarial |
| go-testing | `~/.config/opencode/skills/go-testing/SKILL.md` | Patrones de testing en Go |

## Architecture & Design

| Skill | Path | Trigger |
|-------|------|---------|
| bmad-create-architecture | `~/.opencode/skills/bmad-create-architecture/SKILL.md` | Crear arquitectura técnica |
| bmad-agent-architect | `~/.opencode/skills/bmad-agent-architect/SKILL.md` | Hablar con Winston (arquitecto) |
| bmad-agent-ux-designer | `~/.opencode/skills/bmad-agent-ux-designer/SKILL.md` | Hablar con Sally (UX designer) |

## Planning & Requirements

| Skill | Path | Trigger |
|-------|------|---------|
| bmad-create-prd | `~/.opencode/skills/bmad-create-prd/SKILL.md` | Crear PRD desde cero |
| bmad-edit-prd | `~/.opencode/skills/bmad-edit-prd/SKILL.md` | Editar PRD existente |
| bmad-validate-prd | `~/.opencode/skills/bmad-validate-prd/SKILL.md` | Validar PRD |
| bmad-create-epics-and-stories | `~/.opencode/skills/bmad-create-epics-and-stories/SKILL.md` | Crear épicas y stories |
| bmad-create-story | `~/.opencode/skills/bmad-create-story/SKILL.md` | Crear story individual |
| bmad-sprint-planning | `~/.opencode/skills/bmad-sprint-planning/SKILL.md` | Sprint planning |
| bmad-sprint-status | `~/.opencode/skills/bmad-sprint-status/SKILL.md` | Estado del sprint |

## Research & Discovery

| Skill | Path | Trigger |
|-------|------|---------|
| bmad-domain-research | `~/.opencode/skills/bmad-domain-research/SKILL.md` | Investigación de dominio |
| bmad-technical-research | `~/.opencode/skills/bmad-technical-research/SKILL.md` | Investigación técnica |
| bmad-market-research | `~/.opencode/skills/bmad-market-research/SKILL.md` | Investigación de mercado |

## Quality & Testing

| Skill | Path | Trigger |
|-------|------|---------|
| bmad-tea | `~/.opencode/skills/bmad-tea/SKILL.md` | Test Architect (Murat) |
| bmad-qa-generate-e2e-tests | `~/.opencode/skills/bmad-qa-generate-e2e-tests/SKILL.md` | Generar tests E2E |
| bmad-testarch-framework | `~/.opencode/skills/bmad-testarch-framework/SKILL.md` | Inicializar framework de tests |

## Project Conventions

**File**: `AGENTS.md`

### Extracted Conventions:
- **Commits**: Español, formato Conventional Commits (`feat:`, `fix:`, etc.)
- **Indentación**: 2 espacios
- **Punto y coma**: Requeridos
- **Comillas**: Single quotes para strings
- **Longitud máxima**: 100 caracteres
- **Validación**: express-validator para inputs
- **Errores**: Try/catch con respuestas JSON estructuradas
- **API Response**: `{ success, data/error, mensaje }`

## Persistence Backend

| Mode | Location |
|------|----------|
| engram | Persistent memory via mem_save/mem_search |
| openspec | `openspec/` directory (not created in engram mode) |

## Topic Keys for SDD Artifacts

| Artifact | Topic Key |
|----------|-----------|
| Project Context | `sdd-init/evento-promperu` |
| Exploration | `sdd/{change-name}/explore` |
| Proposal | `sdd/{change-name}/proposal` |
| Spec | `sdd/{change-name}/spec` |
| Design | `sdd/{change-name}/design` |
| Tasks | `sdd/{change-name}/tasks` |
| Apply Progress | `sdd/{change-name}/apply-progress` |
| Verify Report | `sdd/{change-name}/verify-report` |
| Archive Report | `sdd/{change-name}/archive-report` |