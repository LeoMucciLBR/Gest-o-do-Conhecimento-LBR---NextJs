import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

async function main() {
  console.log('Iniciando recuperação de dados de rodovias federais (DNIT)...')

  for (const uf of UFS) {
    try {
      const iso = new Date().toISOString()
      const url = `https://servicos.dnit.gov.br/sgplan/apigeo/snv/listarbrporuf?data=${encodeURIComponent(iso)}&uf=${uf}`
      
      console.log(`Buscando BRs para ${uf}...`)
      const resp = await fetch(url)
      
      if (!resp.ok) {
        console.error(`Falha ao buscar dados para ${uf}: ${resp.statusText}`)
        continue
      }

      const json: { uf: string; lista_br: string } = await resp.json()
      const lista = json.lista_br?.split(',').map((s) => s.trim()).filter(Boolean) ?? []

      console.log(`Encontradas ${lista.length} BRs em ${uf}`)

      for (const br of lista) {
        // Como não temos os detalhes de km inicial/final da API simples,
        // vamos criar um registro genérico para a rodovia no estado.
        // O usuário poderá ajustar depois ou podemos melhorar o script se acharmos uma API de segmentos.
        
        await prisma.rodovias.upsert({
          where: {
            codigo_uf: {
              codigo: br,
              uf: uf
            }
          },
          update: {},
          create: {
            nome: `BR-${br}/${uf}`,
            codigo: `${br}-${uf}`, // Making code unique per state to satisfy @unique constraint
            uf: uf,
            km_inicial: 0,
            km_final: 0, // Placeholder
            tipo: 'FEDERAL',
            descricao: `Rodovia Federal BR-${br} no estado de ${uf}`,
            extensao_km: 0
          }
        })
      }
    } catch (error) {
      console.error(`Erro ao processar ${uf}:`, error)
    }
  }

  console.log('Recuperação concluída!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
