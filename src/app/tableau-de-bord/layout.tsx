import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex" style={{ height: '100vh', overflow: 'hidden', backgroundColor: 'var(--fond)' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
