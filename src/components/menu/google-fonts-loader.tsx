"use client";

import { useEffect } from "react";
import type { TypographyConfig } from "@/types/database";

const fontMap: Record<string, string> = {
  playfair: "Playfair+Display",
  poppins: "Poppins",
  inter: "Inter",
  dmsans: "DM+Sans",
  montserrat: "Montserrat",
  lora: "Lora",
  merriweather: "Merriweather",
  roboto: "Roboto",
  opensans: "Open+Sans",
  nunito: "Nunito",
  plusjakarta: "Plus+Jakarta+Sans",
};

interface GoogleFontsLoaderProps {
  typography?: TypographyConfig;
}

export function GoogleFontsLoader({ typography }: GoogleFontsLoaderProps) {
  useEffect(() => {
    if (!typography) return;

    const fonts = new Set<string>();
    
    // Add heading font
    if (typography.headingFont && fontMap[typography.headingFont]) {
      fonts.add(fontMap[typography.headingFont]);
    }
    
    // Add body font
    if (typography.bodyFont && fontMap[typography.bodyFont]) {
      fonts.add(fontMap[typography.bodyFont]);
    }
    
    // Add accent font if different
    if (typography.accentFont && fontMap[typography.accentFont]) {
      fonts.add(fontMap[typography.accentFont]);
    }

    if (fonts.size === 0) return;

    // Create or update link element
    const fontFamily = Array.from(fonts).join("&family=");
    const href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700;800&display=swap`;
    
    let link = document.querySelector(`link[data-google-fonts]`) as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-google-fonts", "true");
      document.head.appendChild(link);
    }
    
    // Always update href to force reload, even if same fonts
    // Force browser to reload the stylesheet by adding a timestamp
    const timestamp = Date.now();
    link.href = `${href}&t=${timestamp}`;
    
    // Preload fonts for better performance
    link.onload = () => {
      if (process.env.NODE_ENV === "development") {
        console.log("Google Fonts loaded:", Array.from(fonts));
      }
    };
  }, [
    typography?.headingFont,
    typography?.bodyFont,
    typography?.accentFont,
  ]);

  return null;
}
