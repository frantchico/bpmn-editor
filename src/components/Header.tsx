import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FileText, Download, Upload, Settings } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">BPMN Modeler</h1>
          </Link>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  )
}

export default Header

