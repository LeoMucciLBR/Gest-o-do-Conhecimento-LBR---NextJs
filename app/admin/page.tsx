'use client'

import { Users, FileText, Building2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Usuários',
      value: '---',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Contratos',
      value: '---',
      icon: FileText,
      href: '/engenharia/contratos',
      color: 'bg-green-500'
    },
    {
      title: 'Organizações',
      value: '---',
      icon: Building2,
      href: '/admin/organizations',
      color: 'bg-purple-500'
    },
    {
      title: 'Atividade',
      value: 'Normal',
      icon: TrendingUp,
      href: '/admin/activity',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-slate-600 dark:text-gray-400">
          Gerenciamento e monitoramento do sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="p-4 border-2 border-slate-200 dark:border-gray-700 rounded-lg hover:border-lbr-primary transition-colors"
          >
            <Users className="w-5 h-5 text-lbr-primary mb-2" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Gerenciar Usuários
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Visualizar e editar usuários do sistema
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
