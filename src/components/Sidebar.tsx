import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Home, Edit3, FolderOpen } from 'lucide-react'
import type { NavItem } from '@/types'

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'Home'
  },
  {
    label: 'Editor',
    path: '/editor',
    icon: 'Edit3'
  },
  {
    label: 'Modelos',
    path: '/models',
    icon: 'FolderOpen'
  }
]

const iconMap = {
  Home,
  Edit3,
  FolderOpen
}

const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap]
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

