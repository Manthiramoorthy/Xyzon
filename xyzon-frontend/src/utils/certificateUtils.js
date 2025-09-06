import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function to preload all images with proper error handling
const preloadImages = async (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');

    if (images.length === 0) {
        console.log('No images found in certificate HTML');
        return html;
    }

    console.log(`Found ${images.length} images to preload`);

    const imagePromises = Array.from(images).map((img, index) => {
        return new Promise((resolve, reject) => {
            const originalSrc = img.src;
            console.log(`Preloading image ${index + 1}:`, originalSrc);

            // Create a new image for preloading
            const preloadImg = new Image();
            preloadImg.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
                console.warn(`Image ${index + 1} timeout:`, originalSrc);
                // Convert to base64 placeholder or remove
                img.style.display = 'none';
                resolve();
            }, 10000);

            preloadImg.onload = () => {
                clearTimeout(timeout);
                console.log(`Image ${index + 1} preloaded successfully:`, originalSrc);

                // Convert to base64 to embed in HTML
                const canvas = document.createElement('canvas');
                canvas.width = preloadImg.naturalWidth;
                canvas.height = preloadImg.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(preloadImg, 0, 0);

                try {
                    const dataURL = canvas.toDataURL('image/png');
                    img.src = dataURL;
                    console.log(`Image ${index + 1} converted to base64`);
                } catch (e) {
                    console.warn(`Failed to convert image ${index + 1} to base64:`, e);
                    img.style.display = 'none';
                }
                resolve();
            };

            preloadImg.onerror = () => {
                clearTimeout(timeout);
                console.warn(`Image ${index + 1} failed to load:`, originalSrc);
                img.style.display = 'none';
                resolve();
            };

            preloadImg.src = originalSrc;
        });
    });

    await Promise.all(imagePromises);
    console.log('All images preloaded and converted to base64');
    return doc.documentElement.outerHTML;
};

export const generateCertificatePDF = async (certificateHtml, fileName = 'certificate.pdf') => {
    try {
        console.log('Starting PDF generation...');

        // Preload and convert all images to base64 first
        const processedHtml = await preloadImages(certificateHtml);

        // Create a temporary container for the certificate HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = processedHtml;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '900px';
        tempContainer.style.height = '600px';
        tempContainer.style.background = 'white';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.overflow = 'hidden'; // Prevent content overflow
        tempContainer.style.boxSizing = 'border-box';

        document.body.appendChild(tempContainer);

        // Wait for fonts to load
        await document.fonts.ready;

        // Additional wait for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Generating canvas from HTML...');

        // Convert HTML to canvas with optimized settings
        const canvas = await html2canvas(tempContainer, {
            width: 900,
            height: 600,
            scale: 2,
            useCORS: false, // Since we converted images to base64
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 0, // No timeout since images are base64
            removeContainer: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 900,
            windowHeight: 600
        });

        // Remove the temporary container
        document.body.removeChild(tempContainer);

        console.log(`Canvas generated: ${canvas.width}x${canvas.height}`);

        // Create PDF with exact canvas dimensions to avoid white borders
        const imgData = canvas.toDataURL('image/png', 1.0);

        // Calculate PDF dimensions based on canvas aspect ratio
        const canvasAspectRatio = canvas.width / canvas.height;

        let pdfWidth, pdfHeight;
        if (canvasAspectRatio > 1) {
            // Landscape orientation
            pdfWidth = 297; // A4 landscape width in mm
            pdfHeight = pdfWidth / canvasAspectRatio;
        } else {
            // Portrait orientation
            pdfHeight = 210; // A4 portrait height in mm
            pdfWidth = pdfHeight * canvasAspectRatio;
        }

        const pdf = new jsPDF({
            orientation: canvasAspectRatio > 1 ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight] // Custom format to match content
        });

        // Add image to PDF with exact dimensions (no borders)
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Download the PDF
        pdf.save(fileName);

        console.log('PDF generated and downloaded successfully');
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF: ' + error.message);
    }
}; export const downloadCertificateHTML = (certificateHtml, fileName = 'certificate.html') => {
    try {
        const blob = new Blob([certificateHtml], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading HTML:', error);
        throw new Error('Failed to download HTML: ' + error.message);
    }
};

export const previewCertificate = (certificateHtml) => {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(certificateHtml);
    newWindow.document.close();
};
