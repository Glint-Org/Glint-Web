import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Upload } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UploadZone from '../components/UploadZone';
import SessionImporter from '../components/SessionImporter';
import { loadAllTemplates, filterVisibleTemplates, browseFilterId } from '../utils/templateLoader';
import TemplateSetPreview from '../components/TemplateSetPreview';
import StoreBrowseFilters from '../components/StoreBrowseFilters';
import { parseGlint, isGlintFile } from '../utils/projectPack';

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [device, setDevice] = useState('all');
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    loadAllTemplates({ enabledOnly: true })
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const filteredTemplates = filterVisibleTemplates(
    templates,
    browseFilterId(platform, device),
  );

  const handleUpload = (urls) => {
    navigate('/editor', { state: { screenshots: urls } });
  };

  const handleSessionImport = ({ screenshots: imported, session: importedSession }) => {
    navigate('/editor', { state: { screenshots: imported, session: importedSession } });
  };

  const handleProjectImport = (pack) => {
    navigate('/editor', { state: { glintPack: pack } });
  };

  const glintFileRef = useRef(null);

  const handleGlintFileImport = async (file) => {
    if (!file || !isGlintFile(file)) {
      alert('Not a valid .glint file');
      return;
    }
    try {
      const pack = await parseGlint(file);
      navigate('/editor', { state: { glintPack: pack } });
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message || err}`);
    }
  };

  const handleGlintFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleGlintFileImport(file);
    e.target.value = '';
  };

  const handleStartFromTemplate = (template) => {
    navigate('/editor', { state: { template } });
  };

  return (
    <div className="h-screen overflow-y-auto glint-gradient-bg">
      <header className="border-b border-glint-border bg-glint-surface/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Glint" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold text-glint-text">Glint</h1>
              <p className="text-sm text-glint-text-secondary">Store screenshots, simply</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#templates" className="text-glint-text-secondary hover:text-glint-text">Templates</a>
            <a href="#upload" className="text-glint-text-secondary hover:text-glint-text">Upload</a>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-glint-surface-2 transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun size={18} className="text-glint-text-secondary" /> : <Moon size={18} className="text-glint-text-secondary" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-glint-text tracking-tight leading-tight">
            Beautiful store screenshots.<br />
            <span className="text-glint-accent font-bold">No device needed.</span>
          </h2>
          <p className="text-glint-text-secondary text-lg max-w-xl mx-auto">
            Capture real app UI, polish on a frames board with store templates, export ZIP - then preview on device with Glint View.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 glint-btn-primary rounded-xl text-base">Browse Templates</button>
            <button onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 border border-glint-border-strong rounded-xl text-base text-glint-text-secondary hover:bg-glint-surface transition-colors">Upload Screenshots</button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glint-card rounded-2xl p-6 space-y-3 text-left">
            <h3 className="font-semibold text-glint-text">By hand</h3>
            <p className="text-sm text-glint-text-secondary">
              Import screenshots, load a template pack, edit frames, export ZIP. No login.
            </p>
          </div>
          <div className="glint-card rounded-2xl p-6 space-y-3 text-left">
            <h3 className="font-semibold text-glint-text">Automation</h3>
            <p className="text-sm text-glint-text-secondary">
              Run glint capture in scripts or CI. Same session.json + PNGs. Headless polish is on the roadmap.
            </p>
          </div>
          <div className="glint-card rounded-2xl p-6 space-y-3 text-left">
            <h3 className="font-semibold text-glint-text">AI agents</h3>
            <p className="text-sm text-glint-text-secondary">
              Cursor or Copilot installs Capture, captures real UI, applies a template. Skills and docs keep it on rails.
            </p>
          </div>
        </section>

        <section id="templates" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-glint-text">Templates</h3>
            <p className="text-glint-text-secondary">
              Pick a design pack, open it in the editor, swap placeholder app shots for yours, then edit text and colors.
            </p>
          </div>
          <StoreBrowseFilters
            platform={platform}
            device={device}
            onPlatformChange={setPlatform}
            onDeviceChange={setDevice}
          />
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl bg-glint-surface/50 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6 hide-scrollbar">
              {filteredTemplates.map((t, i) => (
                <TemplateShowcaseRow
                  key={t.id}
                  template={t}
                  index={i}
                  onClick={() => handleStartFromTemplate(t)}
                />
              ))}
            </div>
          )}
        </section>

        <section id="upload" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-glint-text">Or start from your screenshots</h3>
            <p className="text-glint-text-secondary">Upload PNGs or import a Capture / Bridge session folder.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glint-card rounded-2xl p-6">
              <h4 className="font-semibold text-glint-text mb-4">Upload Screenshots</h4>
              <UploadZone onUpload={handleUpload} />
            </div>
            <div className="glint-card rounded-2xl p-6">
              <h4 className="font-semibold text-glint-text mb-4">Import session folder</h4>
              <SessionImporter
                onImport={handleSessionImport}
                onProjectImport={handleProjectImport}
              />
              <p className="text-xs text-glint-text-tertiary mt-3">session.json + PNGs from Capture or Bridge</p>
            </div>
            <div className="glint-card rounded-2xl p-6">
              <h4 className="font-semibold text-glint-text mb-4">Open .glint project</h4>
              <button
                onClick={() => glintFileRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-glint-border rounded-xl text-sm text-glint-text-secondary hover:text-glint-text hover:border-glint-accent transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Import .glint file
              </button>
              <input
                ref={glintFileRef}
                type="file"
                accept=".glint,.glintpack,.glint.zip"
                onChange={handleGlintFileInput}
                className="hidden"
              />
              <p className="text-xs text-glint-text-tertiary mt-3">Resume editing from a saved .glint project</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-glint-border/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-2 text-xs text-glint-text-tertiary">
          <img src="/logo.png" alt="" className="w-4 h-4 rounded opacity-70" />
          <span>
            Part of the{' '}
            <a
              href="https://github.com/Glint-Org"
              className="text-glint-text-secondary hover:text-glint-accent transition-colors"
            >
              Glint
            </a>{' '}
            ecosystem
          </span>
        </div>
      </footer>
    </div>
  );
}

function TemplateShowcaseRow({ template, onClick, index = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShown(true);
      },
      { rootMargin: '40px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      data-template-id={template.id}
      aria-label={template.name || template.id || 'Use template'}
      title={template.name || template.id}
      className={`group w-full rounded-2xl overflow-hidden border border-glint-border bg-glint-surface
        focus:outline-none focus:ring-2 focus:ring-glint-accent/40
        transition-[transform,box-shadow,border-color] duration-300 ease-out
        hover:-translate-y-1 hover:border-glint-accent hover:shadow-xl hover:shadow-black/25
        ${shown ? 'glint-reveal' : 'opacity-0 translate-y-4'}`}
      style={shown ? { animationDelay: `${Math.min(index, 6) * 70}ms` } : undefined}
    >
      <TemplateSetPreview template={template} />
    </button>
  );
}
