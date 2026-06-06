import { Link } from 'react-router-dom';
import { colors, fonts, spacing } from '../styles/theme.js';

const footerStyle = {
  background: '#0B1220',
  color: colors.textOnDarkMuted,
  borderTop: `1px solid ${colors.navy700}`,
  marginTop: spacing['3xl'],
  paddingTop: spacing.xl,
  paddingBottom: spacing.xl,
};

const innerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing.md,
};

const linksStyle = {
  display: 'flex',
  gap: spacing.lg,
};

const linkStyle = {
  color: colors.textOnDarkMuted,
  fontFamily: fonts.body,
  fontSize: '14px',
};

const copyStyle = {
  color: colors.textOnDarkMuted,
  fontFamily: fonts.body,
  fontSize: '13px',
};

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div className="container" style={innerStyle}>
        <span style={copyStyle}>© AURIS · DPR Analyzer Pro</span>
        <nav style={linksStyle} aria-label="Footer">
          <Link to="/privacy" style={linkStyle}>
            Privacy
          </Link>
          <Link to="/confidentiality" style={linkStyle}>
            Confidentiality
          </Link>
        </nav>
      </div>
    </footer>
  );
}
