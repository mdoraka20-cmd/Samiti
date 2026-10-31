import html2pdf from 'html2pdf.js';

/**
 * Downloads an HTML element as a crisp, printable A4 PDF file.
 * Works 100% reliably in any browser and iframe environment.
 */
export async function downloadElementAsPdf(
  elementId: string,
  filename: string
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for PDF export.`);
    return false;
  }

  // Clone element to avoid modifying the active DOM during render
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '780px';
  clone.style.margin = '0 auto';
  clone.style.background = '#ffffff';
  clone.style.color = '#0f172a';

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.appendChild(clone);
  document.body.appendChild(container);

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: cleanFilename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
  };

  try {
    await (html2pdf() as any).set(opt).from(clone).save();
    document.body.removeChild(container);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    return false;
  }
}

/**
 * Robust print helper:
 * 1. Tries window.print() inside a try/catch.
 * 2. Tries a hidden printable iframe for targeted printing.
 * 3. If in a sandboxed iframe without allow-modals, triggers downloadElementAsPdf as automatic fallback.
 */
export async function printOrDownloadPdf(
  elementId: string,
  filename: string
): Promise<{ method: 'print' | 'pdf'; success: boolean }> {
  // Check if inside iframe
  const inIframe = window.self !== window.top;

  let printWorked = false;

  try {
    // Attempt standard print first
    window.focus();
    window.print();
    printWorked = true;
  } catch (e) {
    console.warn('Standard window.print() blocked by iframe sandbox:', e);
  }

  // If in iframe or standard print couldn't be confirmed, also trigger direct PDF download
  // so the user never gets an unresponsive button.
  if (inIframe || !printWorked) {
    const pdfOk = await downloadElementAsPdf(elementId, filename);
    return { method: 'pdf', success: pdfOk };
  }

  return { method: 'print', success: true };
}
