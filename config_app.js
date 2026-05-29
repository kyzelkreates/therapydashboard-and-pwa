/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * App Configuration
 * ============================================================
 */

export const APP_CONFIG = {
  name:        'AP3X Therapy',
  shortName:   'AP3X',
  version:     '2.0.0',
  buildStage:  'Patient Support & Therapy System',
  tagline:     'Therapy Session Companion Platform',

  products: {
    clinicianDashboard: {
      name:   'AP3X Therapy Session & Care Coordination Dashboard',
      short:  'Clinician Dashboard',
      route:  '/dashboard'
    },
    patientPWA: {
      name:   'AP3X Patient Wellbeing & Session Companion PWA',
      short:  'Patient Companion',
      route:  '/patient-app'
    },
    demoHub: {
      name:   'AP3X Therapy Support System Demo Hub',
      short:  'Demo Hub',
      route:  '/demo'
    }
  },

  theme: {
    default: 'dark',
    options: ['dark']
  },

  features: {
    sidebar:          true,
    topnav:           true,
    pwa:              true,
    routing:          true,
    auth:             true,
    ai:               true,
    sessionSimulation: true,
    patientPWA:       true,
    demoMode:         true,
  },

  // Disclaimer displayed throughout the system
  disclaimer: 'This system is a session tracking simulation and wellbeing reflection support tool. It is NOT a medical diagnosis, clinical treatment, or healthcare authority system. Always consult a qualified professional for medical or clinical needs.',
}

export default APP_CONFIG
