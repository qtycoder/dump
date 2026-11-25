/* ==========================================================
   data.js — all editable content lives here.
   To add/change a person: edit the arrays below and drop the
   photo into assets/images/board/ (transparent .webp or .png).
   ========================================================== */

const IMG = "assets/images/board/";

window.ISSHI = {
  specialties: [
    { name: "Internal Medicine", icon: "stethoscope" },
    { name: "Cardiology", icon: "heart-pulse" },
    { name: "Orthopedics", icon: "bone" },
    { name: "Obstetrics & Gynaecology", icon: "baby" },
    { name: "Neurology", icon: "brain" },
    { name: "Psychiatry", glyph: "Ψ" },
    { name: "Emergency Care", icon: "ambulance", emergency: true },
  ],

  services: [
    "24/7 Emergency", "24/7 Pharmacy", "Internal Medicine", "General & Laparoscopic Surgery",
    "Endoscopy", "Ultrasound", "2D Echocardiogram", "Pediatrics", "X-Ray / CT-Scan",
    "Laboratory", "OB-Gyne", "Hemodialysis", "Ophthalmology",
  ],

  hmos: ["MediCard", "Maxicare", "Cocolife", "Intellicare", "Avega", "iCare"],

  directory: [
    { name: "OPD / Information", icon: "info" },
    { name: "Emergency Room", icon: "siren" },
    { name: "Laboratory", icon: "flask-conical" },
    { name: "Pharmacy", icon: "pill" },
    { name: "Radiology", icon: "scan-line" },
    { name: "Hemodialysis", icon: "droplets" },
    { name: "PhilHealth", icon: "shield-check" },
    { name: "Medical Records", icon: "folder-open" },
    { name: "Billing", icon: "receipt" },
    { name: "Human Resources Department", icon: "users" },
    { name: "Business Office / Marketing", icon: "megaphone" },
  ],
  phonePlaceholder: "0917-XXX-XXXX",

  // Current president — featured card
  president: {
    name: "Carlo C. Calderon", creds: "MD, FPUA", specialty: "Urologist",
    role: "President", term: "2026 – Present", photo: IMG + "carlo-calderon.webp",
  },

  officers: [
    { name: "Allan P. Tupong", creds: "MD, FPOGS", specialty: "Obstetrician & Gynecologist", role: "Vice President", photo: IMG + "allan-tupong.webp" },
    { name: "Diwata Grace F. Bausa", creds: "MD, DPSP", specialty: "Pathologist", role: "Secretary", photo: IMG + "diwata-bausa.webp" },
    { name: "Clarita N. Miranda", creds: "MD, BPBR", specialty: "Radiologist", role: "Finance Director", photo: IMG + "clarita-miranda.webp" },
    { name: "Marimae B. Lopez", creds: "MD, FPPS, MHA, MMHA", specialty: "Pediatrician", role: "Medical Director", photo: IMG + "marimae-lopez.webp" },
  ],

  directors: [
    { name: "Nick Erwin A. Ifurung", creds: "MD", specialty: "IM-Pulmonologist", role: "Board of Directors", photo: IMG + "nick-ifurung.webp" },
    { name: "Marites M. Butaran", creds: "MD, FPOGS", specialty: "Obstetrician & Gynecologist", role: "Board of Directors", photo: IMG + "marites-butaran.webp" },
    { name: "Joanna Michelle U. Casareno", creds: "MD", specialty: "Pediatrician", role: "Board of Directors", photo: IMG + "joanna-casareno.webp" },
    { name: "Raul O. Macaraeg", creds: "MD, DPPS", specialty: "General Surgeon", role: "Board of Directors", photo: IMG + "raul-macaraeg.webp" },
    { name: "Liza Katrina K. Sarangaya", creds: "MD", specialty: "Anesthesiologist", role: "Board of Directors", photo: IMG + "liza-sarangaya.webp" },
  ],

  pastPresidents: [
    { name: "Reyflor A. Gaspar", creds: "MD, FPCP", specialty: "IM-Cardiologist", term: "2015 – 2020", photo: IMG + "reyflor-gaspar.webp" },
    { name: "Jose O. Macaraeg", creds: "MD, FPCP, FPSG, FPSDE", specialty: "IM-Gastroenterologist", term: "2020 – 2022", photo: IMG + "jose-macaraeg.webp" },
    { name: "Elenwhite C. Luna", creds: "MD, FPCP", specialty: "IM-Nephrologist", term: "2022 – 2023", photo: IMG + "elenwhite-luna.webp" },
    { name: "Raul V. Babaran", creds: "Ret.", specialty: "", term: "2023 – 2025", photo: IMG + "raul-babaran.webp" },
    { name: "Esteban T. Fontanilla Jr.", creds: "MD, FICS", specialty: "Orthopedic Surgeon & Traumatology", term: "2025 – 2026", photo: IMG + "esteban-fontanilla.webp" },
  ],
};
