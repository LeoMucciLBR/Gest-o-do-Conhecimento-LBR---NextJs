Devido ao tamanho massivo do arquivo CadastroContrato.tsx (1713 linhas), vou criar uma implementação híbrida:

## Estratégia de Refatoração

### Fase 1: Migração Direta ✅ (ATUAL)
- Migrar arquivo para Next.js preservando estrutura
- Adaptar imports e navegação
- Manter funcionalidade 100%
- Dark mode support

### Fase 2: Refatoração Incremental (FUTURO)
A ser feito depois quando o formulário estiver funcionando:
- [ ] Separar componentes (15+ arquivos)
  - GeralSection.tsx
  - ClienteSection.tsx  
  - EquipeSection.tsx
  - ObrasSection.tsx
  - TabNavigation.tsx
- [ ] Implementar react-hook-form com Zod
- [ ] Server Actions para submit
- [ ] Testes unitários

## Arquivos Criados

✅ `lib/validation.ts` - Schemas Zod (preparação futura)
✅ `components/InputWithValidation.tsx` - Input reutilizável

## Próximo Passo

Migrar o arquivo completo para Next.js mantendo estrutura atual, depois refatorar incrementalmente conforme necessário.
