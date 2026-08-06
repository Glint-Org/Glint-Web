import { useState } from 'react';
import { exportAsPNG } from '../utils/canvasEngine';
import { downloadSinglePNG, downloadBatchZip } from '../utils/exportHelper';

export default function ExportManager({ canvas, screenshots }) {
  const [exporting, setExporting] = useState(false);

  const handleExportSingle = () => {
    if (!canvas) return;
    const dataUrl = exportAsPNG(canvas);
    downloadSinglePNG(dataUrl, 'telor-frame.png');
  };

  const handleExportAll = async () => {
    if (!canvas || !screenshots.length) return;
    setExporting(true);
    const dataUrls = screenshots.map(() => exportAsPNG(canvas));
    const filenames = screenshots.map((_, i) => `screen_${i + 1}.png`);
    await downloadBatchZip(dataUrls, filenames);
    setExporting(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">Export</h3>
      <button
        onClick={handleExportSingle}
        disabled={!canvas}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Export Current Frame
      </button>
      <button
        onClick={handleExportAll}
        disabled={!canvas || !screenshots.length || exporting}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Export All as ZIP'}
      </button>
    </div>
  );
}
