interface TabPanelProps {
  children: React.ReactNode;
  activeTab: string;
  id: string;
}

export function TabPanel({ children, activeTab, id }: TabPanelProps) {
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className="animate-fade-in w-full h-full"
    >
      {children}
    </div>
  );
}
