import html2canvas from 'html2canvas';

export async function exportToJPEG(elementRef: HTMLElement | null, filename: string) {
  if (!elementRef) return;
  
  try {
    const canvas = await html2canvas(elementRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });
    
    const link = document.createElement('a');
    link.download = `${filename}.jpeg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  } catch (error) {
    console.error('Error exporting to JPEG:', error);
  }
}
