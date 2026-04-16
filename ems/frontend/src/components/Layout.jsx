import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ title, children }) {
  return (
    <div className="app-wrap">
      <Sidebar />
      <div className="main">
        <Topbar title={title} />
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
