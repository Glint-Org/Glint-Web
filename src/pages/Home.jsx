import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UploadZone from '../components/UploadZone';
import SessionImporter from '../components/SessionImporter';
import { loadAllTemplates } from '../utils/templateLoader';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'play', label: 'Play Store' },
  { id: 'ios', label: 'App Store' },
  { id: 'social', label: 'Social' },
];

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    loadAllTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter((t) => t.store === activeCategory || !t.store);

  const handleUpload = (files) => {
    const urls = files.map((f) => URL.createObjectURL(f));
    navigate('/editor', { state: { screenshots: urls } });
  };

  const handleSessionImport = ({ screenshots: imported, session: importedSession }) => {
    navigate('/editor', { state: { screenshots: imported, session: importedSession } });
  };

  const handleStartFromTemplate = (template) => {
    navigate('/editor', { state: { template } });
  };

  return (
    <div className="min-h-screen glint-gradient-bg">
      <header className="border-b border-glint-border bg-glint-surface/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Glint" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Glint Web</h1>
              <p className="text-sm text-gray-500">Store-ready screenshots in minutes</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#templates" className="text-gray-600 hover:text-gray-900">Templates</a>
            <a href="#upload" className="text-gray-600 hover:text-gray-900">Upload</a>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-glint-surface-2 transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun size={18} className="text-glint-text-secondary" /> : <Moon size={18} className="text-glint-text-secondary" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Beautiful store screenshots.<br />
            <span className="text-glint-accent font-bold">No device needed.</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Start with a template, upload your screenshots, export for Play Store and App Store.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 glint-btn-primary rounded-xl text-base">Browse Templates</button>
            <button onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 border border-gray-300 rounded-xl text-base text-gray-700 hover:bg-white/80 transition-colors">Start from Scratch</button>
          </div>
        </section>

        <section id="templates" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
            <p className="text-gray-500">Professional designs ready to use. Click to start editing.</p>
          </div>
          <div className="flex gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-glint-accent text-glint-text-on-accent shadow-md' : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (<div key={i} className="aspect-[9/16] rounded-2xl bg-white/50 animate-pulse" />))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map((t) => (<TemplateCard key={t.id} template={t} onClick={() => handleStartFromTemplate(t)} />))}
            </div>
          )}
        </section>

        <section id="upload" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Or Start from Scratch</h3>
            <p className="text-gray-500">Upload your screenshots and customize everything.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glint-card rounded-2xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-glint-accent-muted text-glint-accent text-xs flex items-center justify-center font-bold">1</span>
                Upload Screenshots
              </h4>
              <UploadZone onUpload={handleUpload} />
            </div>
            <div className="glint-card rounded-2xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-glint-accent-muted text-glint-accent text-xs flex items-center justify-center font-bold">2</span>
                Import glint_capture Session
              </h4>
              <SessionImporter onImport={handleSessionImport} />
              <p className="text-xs text-gray-400 mt-3">Folder with session.json + PNGs from glint capture</p>
            </div>
          </div>
        </section>

        <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-200">
          <p>Part of the <a href="https://github.com/darkmintis/Glint-Org" className="text-glint-accent hover:text-glint-accent-hover">Glint</a> ecosystem</p>
        </footer>
      </main>
    </div>
  );
}

function TemplateCard({ template, onClick }) {
  const bgStyle = getPreviewBg(template);
  return (
    <button onClick={onClick} className="group text-left rounded-2xl overflow-hidden border border-gray-200 hover:border-glint-accent hover:shadow-lg transition-all bg-white">
      <div className="aspect-[9/16] relative overflow-hidden" style={bgStyle}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {template.layers?.some((l) => l.type === 'device-frame') && (
            <div className="w-16 h-28 rounded-lg border-2 border-white/40 bg-white/20 backdrop-blur-sm mb-3" />
          )}
          {template.layers?.filter((l) => l.type === 'headline').map((l, i) => (
            <div key={i} className="text-white text-xs font-bold text-center drop-shadow-lg px-2">{l.placeholder || 'Your Headline'}</div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Use this template</div>
      </div>
      <div className="p-3">
        <div className="font-medium text-sm text-gray-900 truncate">{template.name}</div>
        <div className="text-xs text-gray-500 truncate">{template.description}</div>
      </div>
    </button>
  );
}

function getPreviewBg(template) {
  const bgLayer = template.layers?.find((l) => l.type === 'background');
  if (!bgLayer) return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
  if (bgLayer.theme === 'sunset-gradient') return { background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)' };
  if (bgLayer.theme === 'ocean-gradient') return { background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' };
  if (bgLayer.theme === 'purple-gradient') return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
  if (bgLayer.theme === 'mint-gradient') return { background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' };
  if (bgLayer.theme === 'dark-solid') return { background: '#1a1a2e' };
  if (bgLayer.theme === 'dark-minimal') return { background: '#0d0d0d' };
  if (bgLayer.theme === 'ios-light') return { background: '#f5f5f7' };
  if (bgLayer.theme === 'light-solid') return { background: '#ffffff' };
  return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
}
