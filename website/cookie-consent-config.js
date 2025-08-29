import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js';

CookieConsent.run({

  categories: {
      necessary: {
          enabled: true,  // this category is enabled by default
          readOnly: true  // this category cannot be disabled
      },
      analytics: {},
      auth: { enabled: true }
  },

  language: {
      default: 'en',
      translations: {
          en: {
              consentModal: {
                  title: 'We use cookies!',
                  description: 'We use cookies to keep you logged in, and to track site performance data.',
                  acceptAllBtn: 'Accept all',
                  acceptNecessaryBtn: 'Reject all',
                  showPreferencesBtn: 'Manage Individual preferences'
              },
              preferencesModal: {
                  title: 'Manage cookie preferences',
                  acceptAllBtn: 'Accept all',
                  acceptNecessaryBtn: 'Reject all',
                  savePreferencesBtn: 'Accept current selection',
                  closeIconLabel: 'Close modal',
                  sections: [
                      {
                          title: 'Mmmm...  cookies... ',
                          description: 'You can enable or disable specific cookies in this interface.'
                      },
                      {
                          title: 'User authorization cookies',
                          description: 'These cookies are used to keep you logged in.  If disabled, you may be logged out every time you refresh.',

                          linkedCategory: 'auth'
                          //this field will generate a toggle linked to the 'necessary' category
                          // linkedCategory: 'necessary'
                      },
                      {
                          title: 'Performance and Analytics',
                          description: 'These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.',
                          linkedCategory: 'analytics',
                          
                      },
                      // {
                      //     title: 'More information',
                      //     description: 'For any queries in relation to my policy on cookies and your choices, please <a href="#contact-page">contact us</a>'
                      // }
                  ]
              }
          }
      }
  }
});
document.documentElement.classList.add('cc--darkmode');
