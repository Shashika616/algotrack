'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationData {
  problemId?: string;
  problemName?: string;
  topicId?: string;
  topicName?: string;
}

interface DashboardContextType {
  navigationData: NavigationData | null;
  setNavigation: (data: NavigationData) => void;
  clearNavigation: () => void;
  navigateToProblem: (problemId: string, problemName: string) => void;
  navigateToTopic: (topicId: string, topicName: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);

  const setNavigation = (data: NavigationData) => {
    setNavigationData(data);
  };

  const clearNavigation = () => {
    setNavigationData(null);
  };

  // These will be used by the dashboard page
  const navigateToProblem = (problemId: string, problemName: string) => {
    setNavigationData({ problemId, problemName });
  };

  const navigateToTopic = (topicId: string, topicName: string) => {
    setNavigationData({ topicId, topicName });
  };

  return (
    <DashboardContext.Provider value={{ 
      navigationData, 
      setNavigation, 
      clearNavigation,
      navigateToProblem,
      navigateToTopic
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}