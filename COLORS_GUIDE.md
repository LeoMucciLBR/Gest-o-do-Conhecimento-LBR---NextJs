# Guia de Aplicação de Cores da Marca

## Substituições Realizadas

### Gradientes Primários da Marca
- Substituir: `from-blue-600 via-purple-600 to-pink-600` 
- Por: Classes customizadas usando `#2f4982` (lbr-primary)

### Aplicação no Tailwind

Use as seguintes classes dos nossos componentes:

1. **Título com Gradiente**:
```tsx
className="bg-gradient-to-r from-lbr-primary via-secondary to-accent dark:from-lbr-primary dark:via-secondary-dark dark:to-accent-dark bg-clip-text text-transparent"
```

2. **Linha Decorativa**:
```tsx
className="bg-gradient-to-r from-lbr-primary via-secondary to-accent"
```

3. **Progress Indicators**:
```tsx
className="bg-gradient-to-r from-lbr-primary to-secondary"
```

4. **Botões Primários**:
```tsx
className="bg-gradient-to-r from-lbr-primary to-lbr-primary-hover hover:from-lbr-primary-hover hover:to-lbr-primary shadow-lbr-primary"
```

5. **Cards com Borda Gradiente**:
```tsx
className="bg-gradient-to-br from-lbr-primary to-secondary"
```

6. **Tabs Ativas**:
```tsx
className="bg-gradient-to-r from-lbr-primary to-secondary shadow-lbr-primary"
```

## Cores de Seções

### Seção Geral (Roxo Secundário)
- Background: `from-secondary-light`
- Border: `border-secondary`
- Icon/Accent: `text-secondary`

### Seção Cliente (Âmbar/Accent)
- Background: `from-accent-light`
- Border: `border-accent`
- Icon/Accent: `text-accent`

### Seção Equipe (Cyan)
- Background: `from-cyan-light`
- Border: `border-cyan`
- Icon/Accent: `text-cyan`

### Seção Obras (Pink)
- Background: `from-pink-light`
- Border: `border-pink`
- Icon/Accent: `text-pink`
