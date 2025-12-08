import re
import sys

# Lê o arquivo SQL completo
with open('rodovias_sp_full.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Separa em linhas
lines = content.split('\n')

output_lines = []
skip_insert = False

for line in lines:
    # Mantém todas as linhas que não são INSERT
    if not line.strip().startswith('INSERT INTO'):
        output_lines.append(line)
        continue
    
    # Para linhas INSERT, verifica se contém 'SP' no campo uf
    # Verifica se é da tabela rodovias ou segmento_rodovia e se tem uf = 'SP'
    if ("INSERT INTO public.rodovias" in line or "INSERT INTO public.segmento_rodovia" in line):
        # Verifica se tem uf = 'SP' na linha
        if "'SP'" in line:
            output_lines.append(line)
        # else: pula a linha (não adiciona no output)
    else:
        # Outras tabelas, mantém
        output_lines.append(line)

# Escreve o arquivo filtrado
with open('rodovias_sp_filtered.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print(f"Arquivo filtrado criado: rodovias_sp_filtered.sql")
print(f"Total de linhas: {len(output_lines)}")
