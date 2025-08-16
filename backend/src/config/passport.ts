import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { User } from '../models/User'
import { config } from './config'
import { logger } from '../utils/logger'

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
}, async (payload, done) => {
  try {
    const user = await User.findByPk(payload.userId)
    if (user) {
      return done(null, user)
    }
    return done(null, false)
  } catch (error) {
    logger.error('JWT Strategy error:', error)
    return done(error, false)
  }
}))

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info(`Google OAuth attempt for profile ID: ${profile.id}`)
    
    // Check if user already exists with this Google ID
    let user = await User.findOne({
      where: { googleId: profile.id }
    })

    if (user) {
      logger.info(`Existing Google user found: ${user.email}`)
      return done(null, user)
    }

    // Check if user exists with the same email
    const email = profile.emails?.[0]?.value
    if (!email) {
      logger.error('No email provided by Google OAuth')
      return done(new Error('No email provided by Google'), false)
    }

    user = await User.findOne({
      where: { email: email.toLowerCase() }
    })

    if (user) {
      // Link existing account with Google
      logger.info(`Linking existing account ${user.email} with Google ID: ${profile.id}`)
      user.googleId = profile.id
      await user.save()
      return done(null, user)
    }

    // Create new user
    const displayName = profile.displayName || profile.name?.givenName || 'User'
    const username = await generateUniqueUsername(email, profile.id)
    
    user = await User.create({
      email: email.toLowerCase(),
      username,
      displayName,
      googleId: profile.id,
      isEmailVerified: true, // Google emails are pre-verified
      avatar: profile.photos?.[0]?.value,
    })

    logger.info(`New Google user created: ${user.email}`)
    return done(null, user)
  } catch (error) {
    logger.error('Google OAuth Strategy error:', error)
    return done(error, false)
  }
}))

// Serialize user for session (not used in JWT setup, but required by Passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id)
    done(null, user)
  } catch (error) {
    done(error, false)
  }
})

/**
 * Generate a unique username from email and Google ID
 */
async function generateUniqueUsername(email: string, googleId: string): Promise<string> {
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  let username = baseUsername
  let counter = 1

  // Check if username is available
  while (await User.findOne({ where: { username } })) {
    username = `${baseUsername}${counter}`
    counter++
    
    // Fallback to Google ID if we can't generate a unique username
    if (counter > 100) {
      username = `user_${googleId.slice(-8)}`
      break
    }
  }

  return username
}

export default passport