// vms-backend/src/config/passport.js
const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Admin } = require('../models');

passport.use(new MicrosoftStrategy({
    clientID: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    callbackURL: process.env.MS_REDIRECT_URI,
    scope: ['user.read'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const { tenant } = req;
      if (!tenant) return done(new Error('Tenant could not be resolved.'), null);
      
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email in Microsoft profile.'), null);

      let admin = await Admin.findOne({ where: { oauthId: profile.id, tenantId: tenant.id } });

      if (!admin) {
        admin = await Admin.create({
          tenantId: tenant.id,
          email: email,
          name: profile.displayName,
          oauthProvider: 'microsoft',
          oauthId: profile.id,
        });
      }
      return done(null, admin);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
        const { tenant } = req;
        if (!tenant) return done(new Error('Tenant could not be resolved.'), null);

        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email in Google profile.'), null);

        let admin = await Admin.findOne({ where: { oauthId: profile.id, tenantId: tenant.id } });
        
        if (!admin) {
            admin = await Admin.create({
                tenantId: tenant.id,
                email: email,
                name: profile.displayName,
                oauthProvider: 'google',
                oauthId: profile.id,
            });
        }
        return done(null, admin);
    } catch (error) {
        done(error, null);
    }
  }
));