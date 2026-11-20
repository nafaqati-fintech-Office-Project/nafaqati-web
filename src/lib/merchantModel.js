import api from './api.js'
import { categoryCodeOf, isValidModel, predictLocal } from './localModel.js'

// Suggests a category for a merchant name in the browser, with no server call per name. The model (about 0.8 MB
// compressed) is downloaded once, the first time a suggestion is wanted, and kept for the session; the browser
// cache and the server's version file keep it current. Suggestions are best-effort: any failure means "no suggestion".
const MODEL_PATH = '/api/ai-service/model/mobile'

let loading = null

function loadModel() {
  loading ??= api
    .get(MODEL_PATH, { timeout: 60_000 })
    .then(({ data }) => {
      if (!isValidModel(data)) throw new Error('unusable model file')
      return data
    })
    .catch((error) => {
      loading = null // try again next time
      throw error
    })
  return loading
}

// { code, confidence } when the model is sure enough (the server's 70% threshold), else null. Never throws.
export async function suggestCategoryCode(merchant) {
  try {
    const model = await loadModel()
    const answer = predictLocal(model, merchant)
    if (!answer || answer.confidence < model.threshold) return null
    return { code: categoryCodeOf(answer.category), confidence: answer.confidence }
  } catch {
    return null
  }
}
