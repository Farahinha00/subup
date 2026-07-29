import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: 'var(--fond)' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
