function renderCitySVG(cityDays) {
  const container = document.getElementById('city-svg-wrapper');
  if (!container) return;

  // Render SVG based on cityDays
  // The skyline builds cumulatively.
  
  let buildings = '';
  
  // Base ground
  buildings += `<rect x="0" y="199" width="100%" height="1" fill="var(--border)" />`;

  if (cityDays >= 1) {
    // Small house 1
    buildings += `<rect x="40" y="160" width="30" height="40" fill="#1A2838" />`;
    buildings += `<polygon points="35,160 55,145 75,160" fill="#2A1A2E" />`;
    buildings += `<rect x="50" y="170" width="10" height="10" fill="#F5A623" />`;
  }
  
  if (cityDays >= 3) {
    // House 2
    buildings += `<rect x="90" y="150" width="40" height="50" fill="#1E2A1E" />`;
    buildings += `<rect x="100" y="160" width="8" height="12" fill="#F5A623" />`;
    buildings += `<rect x="115" y="160" width="8" height="12" fill="#F5A623" />`;
  }
  
  if (cityDays >= 5) {
    // Trees
    buildings += `<circle cx="20" cy="180" r="15" fill="#1A4A2E" />`;
    buildings += `<circle cx="150" cy="185" r="10" fill="#1A4A2E" />`;
    buildings += `<circle cx="165" cy="175" r="18" fill="#1A4A2E" />`;
  }

  if (cityDays >= 10) {
    // Apartment
    buildings += `<rect x="180" y="120" width="60" height="80" fill="#1A2838" />`;
    for(let r=0; r<3; r++) {
      for(let c=0; c<3; c++) {
        buildings += `<rect x="${188 + c*16}" y="${130 + r*20}" width="8" height="12" fill="#F5A623" />`;
      }
    }
  }

  if (cityDays >= 20) {
    // Office Tower
    buildings += `<rect x="260" y="80" width="50" height="120" fill="#1E2A1E" />`;
    for(let r=0; r<5; r++) {
      for(let c=0; c<2; c++) {
        buildings += `<rect x="${270 + c*20}" y="${90 + r*20}" width="12" height="12" fill="#F5A623" />`;
      }
    }
  }

  if (cityDays >= 50) {
    // Skyscraper
    buildings += `<rect x="330" y="40" width="60" height="160" fill="#1A2838" />`;
    buildings += `<polygon points="330,40 360,10 390,40" fill="#2A1A2E" />`;
    for(let r=0; r<8; r++) {
      for(let c=0; c<3; c++) {
        buildings += `<rect x="${340 + c*15}" y="${50 + r*18}" width="6" height="10" fill="#F5A623" />`;
      }
    }
  }
  
  if (cityDays >= 75) {
    // City Hall Dome
    buildings += `<rect x="410" y="140" width="80" height="60" fill="#2A1A2E" />`;
    buildings += `<path d="M 410 140 A 40 40 0 0 1 490 140 Z" fill="#1E2A1E" />`;
  }

  // Ensure full width coverage by scaling SVG
  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="xMidYMax meet">
      ${buildings}
    </svg>
  `;
}
