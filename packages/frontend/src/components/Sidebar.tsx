import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Home, Edit3, FolderOpen, LayoutDashboard, Network } from 'lucide-react' // Added LayoutDashboard, Network
import type { NavItem } from '@/types'
import { useNavigation } from '@/context/NavigationContext'; // Added import

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
  FolderOpen,
  LayoutDashboard, // Added
  Network // Added
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { navigateTo } = useNavigation(); // Added useNavigation

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {/* New Navigation Items using context */}
          <li>
            <button
              onClick={() => navigateTo({ view: 'general' })}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                // Basic active state check, can be improved if currentView is available here
                // For now, let's assume no specific active state for these buttons or handle it later
                "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>General Dashboard</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigateTo({ view: 'hierarchy' })}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Network className="h-5 w-5" />
              <span>Hierarchy Manager</span>
            </button>
          </li>

          {/* Existing Router-Link based items - you might want to migrate these too eventually */}
          {navItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
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

