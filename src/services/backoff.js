const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 429 means the gateway did not process the request: back off (Retry-After seconds, else 1 s, 2 s, 4 s) and send it again.
// Any other error, and a 429 after `retries` attempts, is thrown unchanged.
export async function withBackoff(send, { retries = 3, wait = sleep } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await send()
    } catch (error) {
      if (error?.response?.status !== 429 || attempt >= retries) throw error
      const retryAfter = Number(error.response.headers?.['retry-after'])
      await wait(retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 1000 * 2 ** attempt)
    }
  }
}
