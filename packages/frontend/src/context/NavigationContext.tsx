import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ViewType = 'general' | 'project' | 'area' | 'subarea' | 'editor' | 'settings'; // Add more as needed

export interface NavigationView {
  view: ViewType;
  itemId?: string; // ID of the project, area, subarea, model
  // parentId?: string; // Optional: for breadcrumbs or complex back logic
  // params?: Record<string, any>; // Optional: for additional parameters
}

interface NavigationContextType {
  currentView: NavigationView;
  navigateTo: (view: NavigationView) => void;
}

const defaultInitialView: NavigationView = { view: 'general' };

export const NavigationContext = createContext<NavigationContextType>({
  currentView: defaultInitialView,
  navigateTo: () => console.warn('navigateTo function not yet initialized'),
});

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<NavigationView>(defaultInitialView);

  const navigateTo = (viewInfo: NavigationView) => {
    console.log('Navigating to:', viewInfo); // Log navigation attempts
    setCurrentView(viewInfo);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
