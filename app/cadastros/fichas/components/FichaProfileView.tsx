'use client'

import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  User,
  Building2,
  Globe,
  Linkedin,
  Download,
  Share2
} from 'lucide-react'

interface Experiencia {
  id: string
  empresa: string
  cargo: string
  dataInicio: string
  dataFim: string
  descricao: string
}

interface Formacao {
  id: string
  instituicao: string
  curso: string
  nivel: string
  dataFormacao: string
  descricao: string
}

interface Certificado {
  id: string
  nome: string
  instituicao: string
  dataObtencao: string
}

interface FichaProfileViewProps {
  data: any
}

export default function FichaProfileView({ data }: FichaProfileViewProps) {
  const {
    tipo,
    cargo_cliente,
    nome,
    foto_perfil_url,
    profissao,
    resumo_profissional,
    email,
    telefone,
    celular,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
    nacionalidade,
    estado_civil,
    genero,
    data_nascimento,
    experiencias = [],
    formacoes = [],
    certificados = [],
    especialidades,
    idiomas,
    registro_profissional
  } = data

  // Simplified view for Cliente type
  if (tipo === 'CLIENTE') {
    const cargoLabel = cargo_cliente === 'GESTOR_AREA' ? 'Gestor da Área' : 
                       cargo_cliente === 'GERENTE_ENGENHARIA' ? 'Gerente de Engenharia' : 
                       'Cliente'

    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-gray-700 max-w-md mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-slate-200 dark:bg-gray-700 mx-auto mb-4">
            {foto_perfil_url ? (
              <img src={foto_perfil_url} alt={nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words">{nome}</h1>
          <p className="text-blue-600 dark:text-blue-400 font-medium text-lg">{cargoLabel}</p>
          <span className="inline-block mt-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
            Cliente
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-gray-700/50 rounded-xl">
            <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500 dark:text-gray-400">Email</p>
              <p className="text-slate-900 dark:text-white font-medium break-all">{email || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-gray-700/50 rounded-xl">
            <Phone className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-gray-400">Telefone</p>
              <p className="text-slate-900 dark:text-white font-medium">{celular || telefone || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Full view for INTERNA type
  return (
    <div className="min-h-full bg-slate-50 dark:bg-gray-900/50">
      {/* Hero Header */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 dark:from-gray-900 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative -mt-20 sm:-mt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar (Profile Info) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8 text-center relative overflow-hidden border border-slate-100 dark:border-gray-700">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-slate-200 dark:bg-gray-700 mx-auto">
                  {foto_perfil_url ? (
                    <img src={foto_perfil_url} alt={nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">{nome}</h1>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-lg mb-4">{profissao || 'Profissão não informada'}</p>
              
              <div className="flex justify-center gap-3 mb-6">
                <button className="p-2 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </button>
              </div>

              {registro_profissional && (
                <div className="inline-block px-4 py-1.5 bg-slate-100 dark:bg-gray-700 rounded-full text-sm font-medium text-slate-600 dark:text-gray-300">
                  {registro_profissional}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-slate-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Informações Pessoais
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Email</p>
                    <p className="text-slate-900 dark:text-white font-medium break-all">{email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Telefone / Celular</p>
                    <p className="text-slate-900 dark:text-white font-medium">{celular || telefone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Localização</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {cidade && estado ? `${cidade}, ${estado}` : endereco || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Nascimento</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {data_nascimento ? new Date(data_nascimento).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Info */}
            {(endereco || cidade || cep) && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-slate-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-500" />
                  Endereço
                </h3>
                <div className="space-y-3">
                  {endereco && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Logradouro</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {endereco}{numero ? `, ${numero}` : ''}
                      </p>
                    </div>
                  )}
                  {complemento && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Complemento</p>
                      <p className="text-slate-900 dark:text-white font-medium">{complemento}</p>
                    </div>
                  )}
                  {bairro && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Bairro</p>
                      <p className="text-slate-900 dark:text-white font-medium">{bairro}</p>
                    </div>
                  )}
                  {(cidade || estado) && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Cidade / Estado</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {[cidade, estado].filter(Boolean).join(' - ')}
                      </p>
                    </div>
                  )}
                  {cep && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">CEP</p>
                      <p className="text-slate-900 dark:text-white font-medium">{cep}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills / Languages */}
            {(especialidades || idiomas) && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-slate-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  Competências
                </h3>
                
                {especialidades && (
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">Especialidades</p>
                    <div className="flex flex-wrap gap-2">
                      {especialidades.split(',').map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {idiomas && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">Idiomas</p>
                    <div className="space-y-2">
                      {idiomas.split(',').map((lang: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">{lang.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Main Content) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Professional Summary */}
            {resumo_profissional && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 sm:p-8 border border-slate-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  Resumo Profissional
                </h3>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-lg">
                  {resumo_profissional}
                </p>
              </div>
            )}

            {/* Experience Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 sm:p-8 border border-slate-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-orange-500" />
                Experiência Profissional
              </h3>
              
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {experiencias.length > 0 ? (
                  experiencias.map((exp: Experiencia, i: number) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-slate-200 dark:bg-gray-700 group-[.is-active]:bg-orange-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-gray-700/50 p-4 rounded-xl border border-slate-200 dark:border-gray-600 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{exp.cargo}</h4>
                          <time className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                            {exp.dataInicio} - {exp.dataFim || 'Atual'}
                          </time>
                        </div>
                        <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">{exp.empresa}</p>
                        <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                          {exp.descricao}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 dark:text-gray-400 py-4 pl-8">Nenhuma experiência registrada.</p>
                )}
              </div>
            </div>

            {/* Education & Certificates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Education */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-slate-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-green-500" />
                  Formação
                </h3>
                <div className="space-y-6">
                  {formacoes.length > 0 ? (
                    formacoes.map((form: Formacao, i: number) => (
                      <div key={i} className="relative pl-6 border-l-2 border-green-200 dark:border-green-900">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{form.curso}</h4>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">{form.instituicao}</p>
                        <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                          <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">{form.nivel}</span>
                          <span>• {form.dataFormacao}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-gray-400 text-sm">Nenhuma formação registrada.</p>
                  )}
                </div>
              </div>

              {/* Certificates */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-slate-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  Certificados
                </h3>
                <div className="space-y-4">
                  {certificados.length > 0 ? (
                    certificados.map((cert: Certificado, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
                        <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{cert.nome}</h4>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{cert.instituicao}</p>
                          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500 mt-1">{cert.dataObtencao}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-gray-400 text-sm">Nenhum certificado registrado.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
