import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const mainStyle = {
  flex: 1,
};

export default function Layout() {
  const location = useLocation();
  return (
    <div style={shellStyle}>
      <Header />
      {/* key on pathname re-mounts the page wrapper so the entrance
          animation replays on every route change */}
      <main style={mainStyle} className="page-enter" key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
