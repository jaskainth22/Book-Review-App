import request from 'supertest'
import app from './server'

describe('Server', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('OK')
  })

  test('GET /api should return welcome message', async () => {
    const response = await request(app).get('/api')
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Book Review Platform API')
  })

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent')
    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Route not found')
  })
})