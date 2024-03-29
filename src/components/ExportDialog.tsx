import {useCallback, useMemo, useState} from 'react';
import {MdOutlineDownload} from 'react-icons/md';

import {Button} from '@/src/components/Button';
import {ComboRange} from '@/src/components/ComboRange';
import {Dialog} from '@/src/components/Dialog';

const exportTypes = ['webp', 'png', 'jpeg'];

const getSupportedExportTypes = (() => {
  let canvas: HTMLCanvasElement | undefined;
  return (allTypes: string[]) => {
    if (!canvas) canvas = document.createElement('canvas');
    return allTypes.filter((type) =>
      canvas!.toDataURL(`image/${type}`).startsWith(`data:image/${type}`),
    );
  };
})();

function estimateFileSizeB(dataURL: string) {
  const {b64} =
    dataURL.match(/data:image\/[^;]+;base64,(?<b64>.+)/)?.groups ?? {};
  if (!b64) throw new Error('Invalid data URL');
  const binary = atob(b64);
  return binary.length;
}

const bytesFormat = new Intl.NumberFormat(navigator.language, {
  maximumFractionDigits: 2,
});
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${bytesFormat.format(bytes / Math.pow(k, i))} ${sizes[i]}`;
}

function generateDataURL(
  canvas: HTMLCanvasElement | undefined | null,
  exportType: string,
  quality: number,
) {
  if (!canvas) return null;
  return canvas.toDataURL(`image/${exportType}`, quality);
}

export function ExportDialog({
  isOpen,
  handleClose,
  canvas,
  filename,
}: {
  isOpen: boolean;
  handleClose: () => void;
  canvas: HTMLCanvasElement | undefined | null;
  filename: string;
}) {
  const [exportFilename, setExportFilename] = useState(filename);
  const [quality, setQuality] = useState(1);
  const [exportType, setExportType] = useState(exportTypes[0]);
  const dataURL = useMemo(
    () => isOpen && generateDataURL(canvas, exportType, quality),
    [canvas, exportType, isOpen, quality],
  );

  const supportedExportTypes = useMemo(
    () => getSupportedExportTypes(exportTypes),
    [],
  );

  const fileSize = useMemo(() => {
    if (!dataURL) return null;
    return formatBytes(estimateFileSizeB(dataURL));
  }, [dataURL]);

  const handleDownload = useCallback(() => {
    if (!dataURL) return;
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `${exportFilename}.${exportType}`;
    a.click();
    handleClose();
  }, [dataURL, exportFilename, exportType, handleClose]);

  return (
    <Dialog
      isOpen={isOpen}
      handleClose={handleClose}
      title="Export"
      showCloseButton
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <label className="form-control">
            Filename
            <div className="flex flex-row items-center gap-2">
              <input
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                className="input input-bordered input-sm grow"
              />
              <select
                id="exportType"
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="select select-bordered select-sm shrink"
              >
                {supportedExportTypes.map((type) => (
                  <option key={type} value={type}>
                    .{type}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="form-control">
            Quality
            <ComboRange
              value={quality}
              onChange={setQuality}
              min={0}
              max={1}
              step={0.01}
            />
          </label>
          <div>
            <div>Preview</div>
            {isOpen && dataURL && (
              <img
                src={dataURL}
                alt="Preview"
                className="mx-auto select-none h-[256px]"
                onDragStart={(e) => e.preventDefault()}
              />
            )}
            <div>Size: {fileSize}</div>
          </div>
          <Button
            size="lg"
            icon={<MdOutlineDownload />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
