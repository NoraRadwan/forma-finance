import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './styles.css';
import './styles/sheets.css';
import './styles/credit.css';

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
