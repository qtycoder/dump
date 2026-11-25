// Illustrations for the homepage carousel (trusted, static SVG).
// To show your own photos instead, see HOME_SLIDES in js/views/home.js.

const ART = {
  pc: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Desktop computer set-up">
<defs>
<linearGradient id="pcS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9c8e6"/><stop offset="1" stop-color="#3b6a9c"/></linearGradient>
<linearGradient id="pcB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfefe"/><stop offset="1" stop-color="#cdd8e6"/></linearGradient>
</defs>
<ellipse cx="320" cy="348" rx="250" ry="12" fill="#1b2a44" opacity=".12"/>
<rect x="150" y="26" width="320" height="205" rx="20" fill="url(#pcB)" stroke="#fff" stroke-width="3"/>
<rect x="166" y="42" width="288" height="168" rx="10" fill="url(#pcS)"/>
<rect x="184" y="58" width="110" height="64" rx="8" fill="#fff" opacity=".85"/>
<rect x="304" y="58" width="132" height="28" rx="8" fill="#fff" opacity=".6"/>
<rect x="304" y="94" width="132" height="28" rx="8" fill="#fff" opacity=".4"/>
<path d="M184 170h40l14-30 22 52 18-34 14 12h140" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M290 231h40l10 52h-60z" fill="url(#pcB)"/>
<rect x="235" y="281" width="150" height="14" rx="7" fill="url(#pcB)" stroke="#fff" stroke-width="2"/>
<rect x="190" y="306" width="210" height="34" rx="10" fill="url(#pcB)" stroke="#fff" stroke-width="2"/>
<path d="M204 317h182M204 328h182" stroke="#9fb3cc" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 6"/>
<rect x="422" y="304" width="28" height="38" rx="14" fill="url(#pcB)" stroke="#fff" stroke-width="2"/>
<path d="M436 304v15" stroke="#9fb3cc" stroke-width="2"/>
<rect x="510" y="62" width="86" height="240" rx="16" fill="url(#pcB)" stroke="#fff" stroke-width="3"/>
<rect x="524" y="86" width="58" height="8" rx="4" fill="#9fb3cc"/>
<rect x="524" y="104" width="58" height="8" rx="4" fill="#9fb3cc"/>
<circle cx="553" cy="262" r="21" fill="#4a7fb5" opacity=".22"/>
<circle cx="553" cy="262" r="12" fill="#4a7fb5"/>
</svg>`,

  printer: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Office printer">
<defs>
<linearGradient id="ptS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9c8e6"/><stop offset="1" stop-color="#3b6a9c"/></linearGradient>
<linearGradient id="ptB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfefe"/><stop offset="1" stop-color="#cdd8e6"/></linearGradient>
</defs>
<ellipse cx="320" cy="346" rx="230" ry="12" fill="#1b2a44" opacity=".12"/>
<g transform="rotate(-3 320 100)">
<rect x="225" y="30" width="190" height="130" rx="8" fill="#fff" stroke="#c9d6e6" stroke-width="2"/>
<path d="M245 62h120M245 82h150M245 102h100" stroke="#b6c6da" stroke-width="6" stroke-linecap="round"/>
</g>
<rect x="120" y="150" width="400" height="140" rx="30" fill="url(#ptB)" stroke="#fff" stroke-width="3"/>
<rect x="150" y="168" width="340" height="14" rx="7" fill="#b9c8dc"/>
<rect x="150" y="205" width="120" height="48" rx="12" fill="url(#ptS)"/>
<path d="M166 229h50" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
<circle cx="298" cy="229" r="7" fill="#3bb273"/>
<circle cx="322" cy="229" r="7" fill="#4a7fb5"/>
<rect x="170" y="268" width="300" height="22" rx="8" fill="#cdd8e6"/>
<rect x="205" y="272" width="230" height="68" rx="6" fill="#fff" stroke="#c9d6e6" stroke-width="2"/>
<path d="M225 292h170M225 306h130" stroke="#b6c6da" stroke-width="6" stroke-linecap="round"/>
<rect x="225" y="318" width="40" height="8" rx="4" fill="#4fb3e8"/>
<rect x="272" y="318" width="40" height="8" rx="4" fill="#e86aa6"/>
<rect x="319" y="318" width="40" height="8" rx="4" fill="#f2c94c"/>
</svg>`,

  network: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Network switch and Wi-Fi">
<defs>
<linearGradient id="nwB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfefe"/><stop offset="1" stop-color="#cdd8e6"/></linearGradient>
</defs>
<g fill="none" stroke="#4a7fb5" stroke-width="10" stroke-linecap="round">
<path d="M240 120a110 110 0 01160 0" opacity=".3"/>
<path d="M262 148a76 76 0 01116 0" opacity=".6"/>
<path d="M286 176a40 40 0 0168 0"/>
</g>
<circle cx="320" cy="198" r="10" fill="#4a7fb5"/>
<rect x="100" y="236" width="440" height="74" rx="18" fill="url(#nwB)" stroke="#fff" stroke-width="3"/>
<g fill="#41546d">
<rect x="124" y="262" width="34" height="28" rx="5"/><rect x="170" y="262" width="34" height="28" rx="5"/>
<rect x="216" y="262" width="34" height="28" rx="5"/><rect x="262" y="262" width="34" height="28" rx="5"/>
<rect x="308" y="262" width="34" height="28" rx="5"/><rect x="354" y="262" width="34" height="28" rx="5"/>
<rect x="400" y="262" width="34" height="28" rx="5"/><rect x="446" y="262" width="34" height="28" rx="5"/>
</g>
<g fill="#3bb273">
<circle cx="141" cy="250" r="3.5"/><circle cx="187" cy="250" r="3.5"/><circle cx="233" cy="250" r="3.5"/><circle cx="279" cy="250" r="3.5"/>
<circle cx="325" cy="250" r="3.5"/><circle cx="371" cy="250" r="3.5"/><circle cx="417" cy="250" r="3.5"/><circle cx="463" cy="250" r="3.5"/>
</g>
<g fill="none" stroke-width="6" stroke-linecap="round">
<path d="M187 290v28q0 22-26 30" stroke="#4fb3e8"/>
<path d="M279 290v34q0 14 16 22" stroke="#f2994a"/>
<path d="M417 290v28q0 22 28 30" stroke="#3bb273"/>
</g>
<ellipse cx="320" cy="352" rx="220" ry="6" fill="#1b2a44" opacity=".1"/>
</svg>`,

  cctv: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CCTV camera">
<defs>
<linearGradient id="ccB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfefe"/><stop offset="1" stop-color="#cdd8e6"/></linearGradient>
<linearGradient id="ccS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9c8e6"/><stop offset="1" stop-color="#3b6a9c"/></linearGradient>
</defs>
<rect x="70" y="70" width="26" height="170" rx="8" fill="#cdd8e6"/>
<path d="M96 132h96" stroke="#9fb3cc" stroke-width="16" stroke-linecap="round"/>
<g transform="rotate(12 360 160)">
<rect x="180" y="110" width="260" height="100" rx="30" fill="url(#ccB)" stroke="#fff" stroke-width="3"/>
<rect x="170" y="100" width="280" height="14" rx="7" fill="#b9c8dc"/>
<circle cx="392" cy="160" r="36" fill="#2b3c56"/>
<circle cx="392" cy="160" r="24" fill="url(#ccS)"/>
<circle cx="392" cy="160" r="8" fill="#fff" opacity=".8"/>
<circle cx="218" cy="160" r="6" fill="#e5483b"/>
</g>
<circle cx="480" cy="60" r="9" fill="#e5483b"/>
<text x="496" y="67" font-size="20" font-weight="700" fill="#566176" font-family="system-ui,sans-serif">REC</text>
<g fill="none" stroke="#4a7fb5" stroke-width="8" stroke-linecap="round">
<path d="M470 262a40 40 0 0140 40" opacity=".4"/>
<path d="M470 236a66 66 0 0166 66" opacity=".7"/>
<path d="M470 210a92 92 0 0192 92"/>
</g>
</svg>`,

  emr: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hospital information system on a laptop">
<defs>
<linearGradient id="emS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9c8e6"/><stop offset="1" stop-color="#3b6a9c"/></linearGradient>
<linearGradient id="emB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfefe"/><stop offset="1" stop-color="#cdd8e6"/></linearGradient>
</defs>
<rect x="140" y="34" width="360" height="226" rx="18" fill="url(#emB)" stroke="#fff" stroke-width="3"/>
<rect x="156" y="50" width="328" height="194" rx="10" fill="#f4f8fc"/>
<rect x="156" y="50" width="70" height="194" rx="10" fill="url(#emS)"/>
<path d="M191 92v28M177 106h28" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
<path d="M172 156h38M172 176h38M172 196h38" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
<rect x="250" y="66" width="140" height="14" rx="7" fill="#c9d6e6"/>
<rect x="250" y="90" width="220" height="10" rx="5" fill="#dde6f0"/>
<rect x="250" y="170" width="28" height="60" rx="6" fill="#86acd2"/>
<rect x="290" y="140" width="28" height="90" rx="6" fill="#4a7fb5"/>
<rect x="330" y="120" width="28" height="110" rx="6" fill="#86acd2"/>
<rect x="370" y="150" width="28" height="80" rx="6" fill="#4a7fb5"/>
<rect x="410" y="110" width="28" height="120" rx="6" fill="#86acd2"/>
<path d="M110 260h420l-18 32H128z" fill="url(#emB)" stroke="#fff" stroke-width="3"/>
<rect x="280" y="266" width="80" height="8" rx="4" fill="#b9c8dc"/>
<ellipse cx="320" cy="334" rx="230" ry="10" fill="#1b2a44" opacity=".1"/>
</svg>`,
};
