// Language Translations for Object Detection System
const translations = {
  en: {
    // Page Title
    pageTitle: 'Home | Object Recognition and Navigation for Visually Impaired Person',
    
    // Header
    headerTitle: 'Object Recognition and Navigation',
    
    // Navigation
    navHome: 'Home',
    navInfo: 'Object Information',
    
    // Hero Section
    heroTitle: 'Enhancing Object Recognition and Navigation for Visually Impaired Persons',
    heroDescription: 'Integrating deep-learning object detection to deliver real-time guidance and obstacle alerts for visually impaired users.',
    
    // Feature Cards
    featureRealtimeTitle: 'Real-time Detection',
    featureRealtimeDesc: 'Use your device camera to start detecting objects in real-time with advanced AI technology.',
    featureInfoTitle: 'Object Information',
    featureInfoDesc: 'Learn more about Object Recognition and Navigation technology and their impact on accessibility.',
    
    // Detection Section
    detectTitle: 'Detect Object',
    useCameraBtn: 'Use Camera',
    stopCameraBtn: 'Stop Camera',
    previewTitle: 'Preview',
    loadingText: 'Analyzing...',
    placeholderText: 'Click "Use Camera" to start detection',
    
    // Footer
    footerText: '© 2025 Enhancing Object Recognition. All rights reserved.',
    
    // Voice Announcements
    personDetected: 'Person detected',
    peopleDetected: 'people detected',
    stairsWarning: 'Warning! Stairs ahead',
    doorAhead: 'Door ahead',
    doorsDetected: 'doors detected',
    objectDetected: 'detected',
    
    // Accessibility
    toggleMenuLabel: 'Toggle navigation menu',
    modalLabel: 'Full size image preview',
    loadingLabel: 'Loading'
  },
  
  tl: {
    // Page Title (Tagalog)
    pageTitle: 'Home | Pagkilala ng Bagay at Nabigasyon para sa Taong May Kapansanan sa Paningin',
    
    // Header
    headerTitle: 'Pagkilala ng Bagay at Nabigasyon',
    
    // Navigation
    navHome: 'Home',
    navInfo: 'Impormasyon ng Bagay',
    
    // Hero Section
    heroTitle: 'Pagpapahusay ng Pagkilala ng Bagay at Nabigasyon para sa mga Taong May Kapansanan sa Paningin',
    heroDescription: 'Pagsasama ng deep-learning object detection upang magbigay ng real-time na gabay at babala sa hadlang para sa mga gumagamit na may kapansanan sa paningin.',
    
    // Feature Cards
    featureRealtimeTitle: 'Real-time na Pagtuklas',
    featureRealtimeDesc: 'Gamitin ang camera ng iyong device upang magsimulang magtuklas ng mga bagay sa real-time gamit ang advanced na teknolohiya ng AI.',
    featureInfoTitle: 'Impormasyon ng Bagay',
    featureInfoDesc: 'Matuto pa tungkol sa teknolohiya ng Pagkilala ng Bagay at Nabigasyon at ang kanilang epekto sa accessibility.',
    
    // Detection Section
    detectTitle: 'Tuklasin ang Bagay',
    useCameraBtn: 'Gamitin ang Camera',
    stopCameraBtn: 'Itigil ang Camera',
    previewTitle: 'Preview',
    loadingText: 'Sinusuri...',
    placeholderText: 'I-click ang "Gamitin ang Camera" upang magsimula ng pagtuklas',
    
    // Footer
    footerText: '© 2025 Pagpapahusay ng Pagkilala ng Bagay. Lahat ng karapatan ay nakalaan.',
    
    // Voice Announcements
    personDetected: 'May taong nakita',
    peopleDetected: 'mga tao ang nakita',
    stairsWarning: 'Babala! May hagdan sa harap',
    doorAhead: 'May pinto sa harap',
    doorsDetected: 'mga pinto ang nakita',
    objectDetected: 'nakita',
    
    // Accessibility
    toggleMenuLabel: 'Buksan o isara ang navigation menu',
    modalLabel: 'Buong laki ng preview ng larawan',
    loadingLabel: 'Nag-loload'
  },
  
  ceb: {
    // Page Title (Cebuano)
    pageTitle: 'Home | Pag-ila sa Butang ug Nabigasyon alang sa Tawo nga adunay Kapansanan sa Panan-aw',
    
    // Header
    headerTitle: 'Pag-ila sa Butang ug Nabigasyon',
    
    // Navigation
    navHome: 'Home',
    navInfo: 'Impormasyon sa Butang',
    
    // Hero Section
    heroTitle: 'Pagpaayo sa Pag-ila sa Butang ug Nabigasyon alang sa mga Tawo nga adunay Kapansanan sa Panan-aw',
    heroDescription: 'Paghiusa sa deep-learning object detection aron maghatag ug real-time nga giya ug pasidaan sa babag alang sa mga tiggamit nga adunay kapansanan sa panan-aw.',
    
    // Feature Cards
    featureRealtimeTitle: 'Real-time nga Pagpangita',
    featureRealtimeDesc: 'Gamita ang camera sa imong device aron magsugod sa pagpangita sa mga butang sa real-time gamit ang advanced nga teknolohiya sa AI.',
    featureInfoTitle: 'Impormasyon sa Butang',
    featureInfoDesc: 'Pagkat-on pa mahitungod sa teknolohiya sa Pag-ila sa Butang ug Nabigasyon ug ang ilang epekto sa accessibility.',
    
    // Detection Section
    detectTitle: 'Pangitaa ang Butang',
    useCameraBtn: 'Gamita ang Camera',
    stopCameraBtn: 'Hunonga ang Camera',
    previewTitle: 'Preview',
    loadingText: 'Gi-analisar...',
    placeholderText: 'I-click ang "Gamita ang Camera" aron magsugod sa pagpangita',
    
    // Footer
    footerText: '© 2025 Pagpaayo sa Pag-ila sa Butang. Tanang katungod gi-reservar.',
    
    // Voice Announcements
    personDetected: 'Adunay tawo nga nakita',
    peopleDetected: 'ka tawo ang nakita',
    stairsWarning: 'Pasidaan! Adunay hagdanan sa atubangan',
    doorAhead: 'Adunay pultahan sa atubangan',
    doorsDetected: 'ka pultahan ang nakita',
    objectDetected: 'nakita',
    
    // Accessibility
    toggleMenuLabel: 'Ablihi o sirahi ang navigation menu',
    modalLabel: 'Tibuok nga gidak-on sa preview sa hulagway',
    loadingLabel: 'Nag-load'
  }
};

// Current language state
let currentLanguage = localStorage.getItem('language') || 'en';

// Get translation
function t(key) {
  return translations[currentLanguage][key] || translations['en'][key] || key;
}

// Update all text content on the page
function updatePageLanguage() {
  // Update document title
  document.title = t('pageTitle');
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && currentLanguage !== 'en') {
    metaDesc.content = t('heroDescription');
  }
  
  // Update header
  const headerTitle = document.querySelector('header h1');
  if (headerTitle) {
    headerTitle.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> ${t('headerTitle')}`;
  }
  
  // Update navigation
  updateElementText('[href="./index.html"]', t('navHome'));
  updateElementText('[href="./information.html"]', t('navInfo'));
  
  // Update hero section
  updateElementText('.hero-section h2', t('heroTitle'));
  updateElementText('.hero-section > p', t('heroDescription'));
  
  // Update feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards[0]) {
    featureCards[0].querySelector('h3').textContent = t('featureRealtimeTitle');
    featureCards[0].querySelector('p').textContent = t('featureRealtimeDesc');
  }
  if (featureCards[1]) {
    featureCards[1].querySelector('h3').textContent = t('featureInfoTitle');
    featureCards[1].querySelector('p').textContent = t('featureInfoDesc');
  }
  
  // Update detection section
  updateElementText('.detection-section h2', t('detectTitle'));
  updateButtonText('#useCameraBtn', 'fa-video', t('useCameraBtn'));
  updateButtonText('#stopCameraBtn', 'fa-stop', t('stopCameraBtn'));
  updateElementText('.box-title', t('previewTitle'));
  updateElementText('#loadingSpinner p', t('loadingText'));
  updateElementText('#previewPlaceholder', t('placeholderText'));
  
  // Update footer
  updateElementText('footer p', t('footerText'));
  
  // Update ARIA labels
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) menuToggle.setAttribute('aria-label', t('toggleMenuLabel'));
  
  const modal = document.getElementById('imageModal');
  if (modal) modal.setAttribute('aria-label', t('modalLabel'));
  
  const loadingSvg = document.querySelector('#loadingSpinner svg');
  if (loadingSvg) loadingSvg.setAttribute('aria-label', t('loadingLabel'));
}

// Helper function to update element text
function updateElementText(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

// Helper function to update button text (preserving icon)
function updateButtonText(selector, iconClass, text) {
  const button = document.querySelector(selector);
  if (button) {
    button.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
  }
}

// Change language
function changeLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageLanguage();
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Dispatch event for other scripts
    document.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-lang="${lang}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  updatePageLanguage();
  
  // Set active language button
  const activeBtn = document.querySelector(`[data-lang="${currentLanguage}"]`);
  if (activeBtn) activeBtn.classList.add('active');
});

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.translations = translations;
  window.t = t;
  window.changeLanguage = changeLanguage;
  window.getCurrentLanguage = () => currentLanguage;
}