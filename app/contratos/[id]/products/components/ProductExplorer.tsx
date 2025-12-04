'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Folder, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Archive,
  Plus,
  Upload,
  Search,
  ChevronRight,
  Home,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Move,
  X,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface ProductFolder {
  id: string
  name: string
  description?: string
  created_at: string
  creator?: {
    name: string
  }
  _count?: {
    sub_folders: number
    files: number
  }
}

interface ProductFile {
  id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  file_type: string
  mime_type: string
  uploaded_at: string
  uploader?: {
    name: string
  }
}

interface ProductExplorerProps {
  contractId: string
  contractName: string
}

export default function ProductExplorer({ contractId, contractName }: ProductExplorerProps) {
  const router = useRouter()
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<ProductFolder[]>([])
  const [files, setFiles] = useState<ProductFile[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Produtos' }
  ])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<ProductFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFolderContents()
  }, [currentFolderId])

  async function loadFolderContents() {
    try {
      setLoading(true)
      
      // Load folders
      const foldersRes = await fetch(
        `/api/contracts/${contractId}/products/folders?parent=${currentFolderId || ''}`
      )
      if (!foldersRes.ok) throw new Error('Erro ao carregar pastas')
      const foldersData = await foldersRes.json()
      setFolders(foldersData.folders || [])

      // Load files
      const filesRes = await fetch(
        `/api/contracts/${contractId}/products/files?folder=${currentFolderId || ''}`
      )
      if (!filesRes.ok) throw new Error('Erro ao carregar arquivos')
      const filesData = await filesRes.json()
      setFiles(filesData.files || [])
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  function getNextFolderName(): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    // Regex to match "Medicao - Month Year" (case insensitive)
    const pattern = /^Medição\s*-\s*([a-zA-Zç]+)\s*(\d{4})$/i

    // Find all folders matching the pattern
    const matches = folders
      .map(f => {
        const match = f.name.match(pattern)
        if (!match) return null
        
        const monthIndex = months.findIndex(m => m.toLowerCase() === match[1].toLowerCase())
        if (monthIndex === -1) return null

        return {
          original: f.name,
          monthIndex,
          year: parseInt(match[2])
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.monthIndex - a.monthIndex
      })

    // If no pattern found, return current month/year
    if (matches.length === 0) {
      const now = new Date()
      return `Medição - ${months[now.getMonth()]} ${now.getFullYear()}`
    }

    // Get the latest folder
    const latest = matches[0]
    let nextMonthIndex = latest.monthIndex + 1
    let nextYear = latest.year

    if (nextMonthIndex > 11) {
      nextMonthIndex = 0
      nextYear++
    }

    return `Medição - ${months[nextMonthIndex]} ${nextYear}`
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      toast.error('Digite um nome para a pasta')
      return
    }

    try {
      const res = await fetch(`/api/contracts/${contractId}/products/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parent_folder_id: currentFolderId
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao criar pasta')
      }

      toast.success('Pasta criada com sucesso!')
      setNewFolderName('')
      setShowNewFolderModal(false)
      loadFolderContents()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar pasta')
    }
  }

  function openNewFolderModal() {
    setNewFolderName('')
    setShowNewFolderModal(true)
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }



  async function handleUploadFile(file: File) {
    // Check file size (50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      toast.error(`O arquivo é muito grande (${formatFileSize(file.size)}). O limite máximo é 50MB.`)
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (currentFolderId) {
      formData.append('folder_id', currentFolderId)
    }

    try {
      const res = await fetch(`/api/contracts/${contractId}/products/files`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      toast.success('Arquivo enviado com sucesso!')
      loadFolderContents()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar arquivo')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    await handleUploadFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    // Only show drag state if dragging files from OS
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleUploadFile(file)
    }
  }

  function handleFileDragStart(e: React.DragEvent, file: ProductFile) {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'FILE', id: file.id }))
    e.dataTransfer.effectAllowed = 'move'
  }

  async function handleMoveFile(fileId: string, targetFolderId: string | null) {
    try {
      const res = await fetch(`/api/contracts/${contractId}/products/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: targetFolderId })
      })

      if (!res.ok) throw new Error('Erro ao mover arquivo')

      toast.success('Arquivo movido com sucesso')
      loadFolderContents()
    } catch (error) {
      toast.error('Erro ao mover arquivo')
    }
  }

  async function handleFolderDrop(e: React.DragEvent, targetFolder: ProductFolder) {
    e.preventDefault()
    e.stopPropagation()
    
    const data = e.dataTransfer.getData('application/json')
    if (!data) return

    try {
      const item = JSON.parse(data)
      if (item.type === 'FILE') {
        await handleMoveFile(item.id, targetFolder.id)
      }
    } catch (error) {
      console.error('Invalid drag data', error)
    }
  }

  async function handleBreadcrumbDrop(e: React.DragEvent, targetFolderId: string | null) {
    e.preventDefault()
    e.stopPropagation()
    
    const data = e.dataTransfer.getData('application/json')
    if (!data) return

    try {
      const item = JSON.parse(data)
      if (item.type === 'FILE') {
        // Don't move if already in the target folder
        if (currentFolderId === targetFolderId) return
        await handleMoveFile(item.id, targetFolderId)
      }
    } catch (error) {
      console.error('Invalid drag data', error)
    }
  }

  async function handleDeleteFile(file: ProductFile) {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return

    try {
      const res = await fetch(`/api/contracts/${contractId}/products/files/${file.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao excluir arquivo')

      toast.success('Arquivo excluído com sucesso')
      loadFolderContents()
      if (previewFile?.id === file.id) setPreviewFile(null)
    } catch (error) {
      toast.error('Erro ao excluir arquivo')
    }
  }

  async function handleDeleteFolder(folder: ProductFolder) {
    if ((folder._count?.files || 0) > 0 || (folder._count?.sub_folders || 0) > 0) {
      toast.error('A pasta não está vazia')
      return
    }

    if (!confirm('Tem certeza que deseja excluir esta pasta?')) return

    try {
      const res = await fetch(`/api/contracts/${contractId}/products/folders/${folder.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir pasta')
      }

      toast.success('Pasta excluída com sucesso')
      loadFolderContents()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir pasta')
    }
  }

  function handleFileClick(file: ProductFile) {
    setPreviewFile(file)
  }

  function handleFolderClick(folder: ProductFolder) {
    setCurrentFolderId(folder.id)
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }])
  }

  function handleBreadcrumbClick(index: number) {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id)
  }

  function getFileIcon(file: ProductFile) {
    if (file.file_type === 'IMAGE') {
      return (
        <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <img 
            src={file.file_path} 
            alt={file.original_filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )
    }

    let icon = <File className="w-12 h-12 text-gray-400" />
    let colorClass = "text-gray-500"
    let bgClass = "bg-gray-100 dark:bg-gray-800"

    switch (file.file_type) {
      case 'PDF':
        icon = <FileText className="w-12 h-12 text-red-500" />
        bgClass = "bg-red-50 dark:bg-red-900/20"
        break
      case 'SPREADSHEET':
        icon = <FileSpreadsheet className="w-12 h-12 text-green-600" />
        bgClass = "bg-green-50 dark:bg-green-900/20"
        break
      case 'ARCHIVE':
        icon = <Archive className="w-12 h-12 text-purple-500" />
        bgClass = "bg-purple-50 dark:bg-purple-900/20"
        break
    }

    return (
      <div className={`w-full h-24 mb-2 rounded-lg flex items-center justify-center ${bgClass}`}>
        {icon}
      </div>
    )
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredFiles = files.filter(f => 
    f.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 transition-colors ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-xl pointer-events-none">
          <div className="text-center">
            <Upload className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Solte o arquivo aqui para enviar
            </h2>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📦 Produtos - {contractName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie documentos e arquivos de produtos
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {breadcrumbs.map((crumb, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('opacity-50')
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('opacity-50')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('opacity-50')
                    handleBreadcrumbDrop(e, crumb.id)
                  }}
                >
                  {index === 0 ? (
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      <span className="font-medium">{crumb.name}</span>
                    </button>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                      >
                        {crumb.name}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={openNewFolderModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Pasta</span>
              </button>
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{isUploading ? 'Enviando...' : 'Upload'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar arquivos e pastas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {/* Folders */}
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900/40')
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/40')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/40')
                    handleFolderDrop(e, folder)
                  }}
                >
                  <button
                    onClick={() => handleFolderClick(folder)}
                    className="flex flex-col items-center w-full"
                  >
                    <Folder className="w-16 h-16 text-yellow-500 group-hover:scale-110 transition-transform" />
                    <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white text-center line-clamp-2">
                      {folder.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {folder._count?.files || 0} arquivos
                    </span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder)
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-gray-800 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                    title="Excluir pasta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Files */}
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, file)}
                  onClick={() => handleFileClick(file)}
                  className="group flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md relative cursor-pointer active:cursor-grabbing"
                >
                  <div className="w-full">
                    {getFileIcon(file)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-center line-clamp-2 w-full break-words">
                    {file.original_filename}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(file.file_size)}
                  </span>
                  
                  {/* Actions */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFile(file)
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-gray-800 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                    title="Excluir arquivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Esta pasta está vazia'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Nova Pasta
            </h3>
            <input
              type="text"
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewFolderModal(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {previewFile.file_type === 'IMAGE' ? (
                    <img 
                      src={previewFile.file_path} 
                      alt={previewFile.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(previewFile)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {previewFile.original_filename}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(previewFile.file_size)} • {new Date(previewFile.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
              {previewFile.file_type === 'IMAGE' ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={previewFile.file_path}
                    alt={previewFile.original_filename}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : previewFile.file_type === 'PDF' ? (
                <iframe
                  src={`${previewFile.file_path}#toolbar=0`}
                  className="w-full h-full"
                  title={previewFile.original_filename}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                    {getFileIcon(previewFile)}
                  </div>
                  <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Visualização não disponível
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    Este tipo de arquivo não pode ser visualizado diretamente aqui.
                    Você pode baixá-lo ou abri-lo em uma nova aba.
                  </p>
                  <a
                    href={previewFile.file_path}
                    download
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Baixar Arquivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
