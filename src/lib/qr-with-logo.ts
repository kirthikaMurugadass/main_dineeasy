import QRCode from "qrcode";

interface QRWithLogoOptions {
  url: string;
  logoUrl?: string | null;
  width?: number;
  margin?: number;
  qrColor?: string;
  bgColor?: string;
  logoSize?: number; // Percentage of QR code size (20-25%)
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Generate QR code as PNG Data URL with logo overlay
 */
export async function generateQRWithLogoPNG({
  url,
  logoUrl,
  width = 1024,
  margin = 2,
  qrColor = "#000000",
  bgColor = "#FFFFFF",
  logoSize = 0.22, // 22% of QR size
  errorCorrectionLevel = "H",
}: QRWithLogoOptions): Promise<string> {
  // Generate base QR code
  const qrDataUrl = await QRCode.toDataURL(url, {
    width,
    margin,
    color: {
      dark: qrColor,
      light: bgColor,
    },
    errorCorrectionLevel,
  });

  // If no logo, return plain QR code
  if (!logoUrl) {
    return qrDataUrl;
  }

  // Create canvas to overlay logo
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Set canvas size
      canvas.width = width;
      canvas.height = width;

      // Draw QR code
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 0, 0, width, width);

        // Calculate logo dimensions
        const logoDimension = width * logoSize;
        const logoX = (width - logoDimension) / 2;
        const logoY = (width - logoDimension) / 2;

        // Draw white circular background for logo
        const padding = logoDimension * 0.15; // 15% padding
        const circleRadius = (logoDimension + padding * 2) / 2;
        const circleCenterX = width / 2;
        const circleCenterY = width / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, 2 * Math.PI);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.restore();

        // Draw logo in center
        ctx.save();
        ctx.beginPath();
        ctx.arc(circleCenterX, circleCenterY, logoDimension / 2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoDimension, logoDimension);
        ctx.restore();

        resolve(canvas.toDataURL("image/png"));
      };

      qrImg.onerror = () => reject(new Error("Failed to load QR code image"));
      qrImg.src = qrDataUrl;
    };

    img.onerror = () => {
      // If logo fails to load, return QR code without logo
      console.warn("Failed to load logo, generating QR without logo");
      resolve(qrDataUrl);
    };

    img.src = logoUrl;
  });
}

/**
 * Generate QR code as SVG string with logo overlay
 */
export async function generateQRWithLogoSVG({
  url,
  logoUrl,
  width = 1024,
  margin = 2,
  qrColor = "#000000",
  bgColor = "#FFFFFF",
  logoSize = 0.22,
  errorCorrectionLevel = "H",
}: QRWithLogoOptions): Promise<string> {
  // Generate base QR code SVG
  let svgString = await QRCode.toString(url, {
    type: "svg",
    width,
    margin,
    color: {
      dark: qrColor,
      light: bgColor,
    },
    errorCorrectionLevel,
  });

  // If no logo, return plain QR SVG
  if (!logoUrl) {
    return svgString;
  }

  // Convert logo to base64 data URL for embedding
  const logoDataUrl = await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      // If logo fails to load, return QR without logo
      console.warn("Failed to load logo, generating QR without logo");
      resolve("");
    };

    img.src = logoUrl;
  });

  if (!logoDataUrl) {
    return svgString;
  }

  // Parse SVG and inject logo
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgElement = svgDoc.documentElement;

  // Calculate logo dimensions
  const logoDimension = width * logoSize;
  const logoX = (width - logoDimension) / 2;
  const logoY = (width - logoDimension) / 2;
  const padding = logoDimension * 0.15;
  const circleRadius = (logoDimension + padding * 2) / 2;
  const circleCenterX = width / 2;
  const circleCenterY = width / 2;

  // Create white circle background
  const circle = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", circleCenterX.toString());
  circle.setAttribute("cy", circleCenterY.toString());
  circle.setAttribute("r", circleRadius.toString());
  circle.setAttribute("fill", bgColor);

  // Create circular clip path for logo
  const defs = svgDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
  const clipPath = svgDoc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
  clipPath.setAttribute("id", "logo-clip");
  const clipCircle = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
  clipCircle.setAttribute("cx", circleCenterX.toString());
  clipCircle.setAttribute("cy", circleCenterY.toString());
  clipCircle.setAttribute("r", (logoDimension / 2).toString());
  clipPath.appendChild(clipCircle);
  defs.appendChild(clipPath);

  // Create logo image
  const logoImage = svgDoc.createElementNS("http://www.w3.org/2000/svg", "image");
  logoImage.setAttribute("href", logoDataUrl);
  logoImage.setAttribute("x", logoX.toString());
  logoImage.setAttribute("y", logoY.toString());
  logoImage.setAttribute("width", logoDimension.toString());
  logoImage.setAttribute("height", logoDimension.toString());
  logoImage.setAttribute("clip-path", "url(#logo-clip)");

  // Insert defs and logo elements
  if (svgElement.querySelector("defs")) {
    svgElement.querySelector("defs")?.appendChild(clipPath);
  } else {
    svgElement.insertBefore(defs, svgElement.firstChild);
  }
  svgElement.appendChild(circle);
  svgElement.appendChild(logoImage);

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgDoc);
}
