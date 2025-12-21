import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRouter from './routes/auth.js'

dotenv.config()

const app = express()

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((err, _req, res, _next) => {
  const status = err.status || 500
  const message = err.message || 'Unexpected server error.'
  res.status(status).json({ message })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth server running on port ${port}`)
})
