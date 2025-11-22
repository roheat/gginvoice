/**
 * Converts an image URL to base64
 * Handles CORS by proxying through our API if needed
 * Special handling for SVG files
 */
export async function imageToBase64(imageUrl: string): Promise<string> {
  try {
    console.log('Converting image to base64:', imageUrl);
    
    let response: Response;
    let isSvg = false;
    
    // For relative URLs (our own assets), fetch directly
    if (imageUrl.startsWith('/')) {
      const fullUrl = `${window.location.origin}${imageUrl}`;
      console.log('Fetching relative URL:', fullUrl);
      response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      isSvg = imageUrl.toLowerCase().endsWith('.svg') || (contentType?.includes('svg') ?? false);
    } else {
      // For external URLs, try direct fetch first, then proxy if CORS fails
      try {
        console.log('Trying direct fetch for external URL');
        response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          isSvg = imageUrl.toLowerCase().endsWith('.svg') || (contentType?.includes('svg') ?? false);
        } else {
          throw new Error(`Direct fetch failed: ${response.status}`);
        }
      } catch (corsError) {
        console.warn('Direct fetch failed, trying proxy:', corsError);
        // Fallback: proxy through our API to avoid CORS
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image via proxy: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        isSvg = imageUrl.toLowerCase().endsWith('.svg') || (contentType?.includes('svg') ?? false);
      }
    }
    
    // Client logos are now PNG/JPG only, so no SVG handling needed for client logos
    // SVG handling is only for app logo (which will be converted to PNG later)
    if (isSvg) {
      console.log('Processing SVG file - converting to PNG');
      const svgText = await response.text();
      
      // Convert SVG to PNG using canvas
      return new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            // Use natural dimensions or default to reasonable size
            const width = img.naturalWidth || img.width || 400;
            const height = img.naturalHeight || img.height || 200;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Fill white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Draw SVG
            ctx.drawImage(img, 0, 0, width, height);
            const pngDataUrl = canvas.toDataURL('image/png', 1.0);
            URL.revokeObjectURL(url);
            console.log('SVG converted to PNG successfully, dimensions:', width, 'x', height);
            resolve(pngDataUrl);
          } catch (error) {
            URL.revokeObjectURL(url);
            console.error('Canvas conversion error:', error);
            // Fallback: try base64 SVG encoding
            try {
              const base64Svg = `data:image/svg+xml;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
              console.warn('Using SVG base64 fallback');
              resolve(base64Svg);
            } catch (e) {
              reject(e);
            }
          }
        };
        
        img.onerror = (error) => {
          URL.revokeObjectURL(url);
          console.error('Image load error:', error);
          // Fallback: try base64 SVG encoding
          try {
            const base64Svg = `data:image/svg+xml;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
            console.warn('Using SVG base64 fallback after load error');
            resolve(base64Svg);
          } catch (e) {
            reject(e);
          }
        };
        
        // Set crossOrigin to avoid CORS issues
        img.crossOrigin = 'anonymous';
        img.src = url;
      });
    }
    
    // For PNG/JPG images (client logos), convert blob to base64 directly
    console.log('Processing PNG/JPG image (client logo)');
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    console.log('Client logo converted to base64, type:', blob.type, 'length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Failed to convert image to base64:', imageUrl, error);
    return ''; // Return empty string, component handles missing images
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) {
        reject(new Error('FileReader returned empty result'));
        return;
      }
      resolve(result);
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Pre-load and convert all invoice images
 * Call this BEFORE rendering the PDF
 */
export async function prepareInvoiceImages(
  appLogoUrl: string,
  clientLogoUrl?: string | null
): Promise<{
  appLogoBase64: string;
  clientLogoBase64?: string;
}> {
  const [appLogoBase64, clientLogoBase64] = await Promise.all([
    imageToBase64(appLogoUrl),
    clientLogoUrl ? imageToBase64(clientLogoUrl) : Promise.resolve(undefined),
  ]);
  
  return { 
    appLogoBase64: appLogoBase64 || '', 
    clientLogoBase64: clientLogoBase64 || undefined 
  };
}

