// Helper function to create options from array of strings
export const createOptionsFromStrings = (items: string[]): { value: string; label: string }[] => {
  return items.map(item => ({ value: item, label: item }))
}

// Helper function to create options from rodovia list
export const createRodoviaOptions = (rodovias: any[]): { value: string; label: string }[] => {
  return rodovias.map(rod => ({ value: String(rod.id), label: rod.nome }))
}

// Helper function to create BR options
export const createBROptions = (brs: string[]): { value: string; label: string }[] => {
  return brs.map(br => ({ value: br, label: `BR-${br}` }))
}

// Predefined options
export const TIPO_OPTIONS = [
  { value: 'ESTADUAL', label: 'Estadual' },
  { value: 'FEDERAL', label: 'Federal' },
]
