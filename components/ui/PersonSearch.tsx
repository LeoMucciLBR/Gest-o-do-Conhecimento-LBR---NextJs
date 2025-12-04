'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, UserPlus, Loader2, User } from 'lucide-react'

interface Person {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  celular?: string
  telefone?: string
  profissao?: string
}

interface PersonSearchProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelect: (person: Person) => void
  onCreateNew?: () => void
  placeholder?: string
  role?: string
  tipo?: 'INTERNA' | 'CLIENTE'
  excludeIds?: string[]  // IDs of people to exclude from results
}

export default function PersonSearch({
  label,
  value,
  onChange,
  onSelect,
  onCreateNew,
  placeholder = 'Digite o nome',
  role,
  tipo,
  excludeIds = []
}: PersonSearchProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounce search
  const [debouncedValue, setDebouncedValue] = useState(value)

  // Memoize excludeIds to prevent infinite loop
  const excludeIdsKey = useMemo(() => excludeIds.join(','), [excludeIds])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true)
      try {
        // If search is empty, fetch all people (no search param)
        let url = debouncedValue.trim() 
          ? `/api/people?search=${encodeURIComponent(debouncedValue)}`
          : '/api/people?search='  // Empty search to get all
        
        if (role) {
          url += `&role=${role}`
        }
        if (tipo) {
          url += `&tipo=${tipo}`
        }
        
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          const allPeople = data.people || []
          // Filter out already-selected people
          const filtered = allPeople.filter((p: Person) => !excludeIds.includes(p.id))
          setPeople(filtered)
        }
      } catch (error) {
        console.error('Error fetching people:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPeople()
  }, [debouncedValue, role, tipo, excludeIdsKey])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (person: Person) => {
    onSelect(person)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Trigger search even if empty (will fetch all)
      setDebouncedValue(value)
      setShowDropdown(true)
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (people.length > 0 || onCreateNew) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 max-h-60 overflow-y-auto">
          {people.length > 0 && (
            <ul className="py-2">
              {people.map((person) => (
                <li
                  key={person.id}
                  onClick={() => handleSelect(person)}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{person.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {person.email || 'Sem email'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onCreateNew && (
            <button
              type="button"
              onClick={() => {
                onCreateNew()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 border-t border-slate-200 dark:border-gray-700 flex items-center gap-2 text-green-600 dark:text-green-400 font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar nova pessoa
            </button>
          )}
        </div>
      )}
    </div>
  )
}
