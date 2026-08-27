import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - var(--banner-h, 0px))', backgroundColor: 'var(--fond)' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
