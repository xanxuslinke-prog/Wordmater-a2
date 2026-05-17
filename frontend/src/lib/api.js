import axios from 'axios'

export const API_BASE = 'http://127.0.0.1:5000'

export const api = axios.create({ baseURL: API_BASE })

// ----- Request: attach access token -----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ----- Response: try refresh on 401, then bounce to login -----
let refreshing = null

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // 401 = expired/invalid access token. Try refresh once.
    if (
      err.response?.status === 401 &&
      !original._retried &&
      !original.url.includes('/refresh') &&
      !original.url.includes('/login')
    ) {
      original._retried = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          // De-dupe concurrent refreshes
          refreshing = refreshing || axios.post(
            `${API_BASE}/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )
          const { data } = await refreshing
          refreshing = null

          localStorage.setItem('token', data.token)
          original.headers.Authorization = `Bearer ${data.token}`
          return api(original)
        } catch {
          refreshing = null
        }
      }

      // Refresh failed or no refresh token → log out
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('is_admin')
      localStorage.removeItem('username')
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }

    return Promise.reject(err)
  }
)
