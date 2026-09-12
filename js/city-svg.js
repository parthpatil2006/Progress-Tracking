// city-svg.js
function getCitySVG(days) {
  // SVG stages based on Section H
  // Simplified silhouettes for demonstration
  let buildings = '';
  if (days >= 1) buildings += '<rect x="20" y="160" width="30" height="30" fill="#4B5563" /><rect x="25" y="170" width="6" height="6" fill="#FACC15" />'; // House with light
  if (days >= 3) buildings += '<rect x="60" y="160" width="30" height="30" fill="#4B5563" /><path d="M50 190 L100 190" stroke="#4F8EF7" stroke-width="2" />'; // House + path
  if (days >= 7) buildings += '<rect x="100" y="150" width="40" height="40" fill="#374151" /><rect x="105" y="160" width="30" height="10" fill="#60A5FA" opacity="0.4" />'; // Shop
  if (days >= 10) buildings += '<rect x="150" y="110" width="45" height="80" fill="#374151" /><rect x="160" y="120" width="25" height="40" fill="#FACC15" opacity="0.3" />'; // Apartment
  if (days >= 20) buildings += '<rect x="210" y="80" width="50" height="110" fill="#1F2937" /><rect x="220" y="90" width="30" height="80" fill="#4F8EF7" opacity="0.2" />'; // Office
  if (days >= 50) buildings += '<rect x="280" y="40" width="55" height="150" fill="#111827" /><rect x="290" y="50" width="35" height="130" fill="#FFFFFF" opacity="0.1" />'; // Skyscraper
  if (days >= 100) buildings += '<rect x="350" y="10" width="60" height="180" fill="#030712" /><circle cx="380" cy="30" r="2" fill="#F75A5A" />'; // Landmark

  return `
    <svg viewBox="0 0 440 200" width="100%" height="200" style="background: linear-gradient(#0F1117, #1E2235);">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1E2235;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0F1117;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="440" height="200" fill="url(#skyGrad)" />
      <line x1="0" y1="190" x2="440" y2="190" stroke="#2A2D3E" stroke-width="2" />
      ${buildings}
    </svg>
  `;
}
