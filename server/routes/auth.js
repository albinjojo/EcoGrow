import { Router } from 'express'
import {
  forgotPassword,
  googleAuth,
  googleOAuthCallback,
  googleOAuthStart,
  login,
  signup,
} from '../controllers/authController.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/google', googleAuth)
router.get('/google/start', googleOAuthStart)
router.get('/google/callback', googleOAuthCallback)
router.post('/forgot-password', forgotPassword)

export default router
