'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Activity, FileText, Users, Clock } from 'lucide-react'
import AllLogsTab from './components/AllLogsTab'
import LoginLogsTab from './components/LoginLogsTab'
import ContractLogsTab from './components/ContractLogsTab'
import SessionsTab from './components/SessionsTab'

type TabType = 'all' | 'login' | 'contracts' | 'sessions'

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const tabs = [
    { id: 'all' as TabType, label: 'Todos os Logs', icon: Activity, color: 'blue' },
    { id: 'login' as TabType, label: 'Login/Auth', icon: Shield, color: 'green' },
    { id: 'contracts' as TabType, label: 'Contratos', icon: FileText, color: 'purple' },
    { id: 'sessions' as TabType, label: 'Sessões Ativas', icon: Users, color: 'orange' },
  ]

  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      const colors: Record<string, string> = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-500',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-500',
      }
      return colors[color]
    }
    return 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Auditoria do Sistema
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Histórico completo de atividades e sessões ativas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg
                  font-semibold transition-all duration-200 border-2
                  ${getColorClasses(tab.color, isActive)}
                `}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">{tab.label}</span>
                <span className="text-xs sm:hidden">{tab.label.split(' ')[0]}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {activeTab === 'all' && <AllLogsTab />}
        {activeTab === 'login' && <LoginLogsTab />}
        {activeTab === 'contracts' && <ContractLogsTab />}
        {activeTab === 'sessions' && <SessionsTab />}
      </motion.div>
    </div>
  )
}
