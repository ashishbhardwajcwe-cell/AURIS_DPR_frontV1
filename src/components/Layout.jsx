import { Outlet } from 'react-router-dom';
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
  return (
    <div style={shellStyle}>
      <Header />
      <main style={mainStyle}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
