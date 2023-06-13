interface IProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export default function AppLayout({ sidebar, children }: IProps) {
  return (
    <div className="flex max-h-full overflow-hidden">
      {sidebar ? (
        <div className="w-18 flex flex-col bg-slate-900">{sidebar}</div>
      ) : null}
      {children}
    </div>
  )
}
