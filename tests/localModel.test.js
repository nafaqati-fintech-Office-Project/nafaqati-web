import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { categoryCodeOf, classProbabilities, cleanMerchantText, isValidModel, predictLocal } from '../src/lib/localModel.js'

// The browser model must give the server's answers. The model file is the server's export and the cases are the
// Python model's answers (merchant_api_project/scripts/make_mobile_parity.py); they live next to the other apps,
// so the check is skipped when this folder is checked out alone.
const MODELS = new URL('../../merchant_api_project/models/mobile/', import.meta.url)
const FIXTURE = new URL('../../fintech-mobile-app/src/features/categorizer/__fixtures__/localModelParity.json', import.meta.url)
const parity = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : null
const modelFile = parity && existsSync(MODELS) ? readdirSync(MODELS).find((f) => f === `${parity.version}.json`) : null
const model = modelFile ? JSON.parse(readFileSync(join(MODELS.pathname.replace(/^\/([A-Za-z]:)/, '$1'), modelFile), 'utf8')) : null

describe('browser merchant model', () => {
  it('turns model class names into backend category codes', () => {
    assert.equal(categoryCodeOf('Food & Beverage'), 'FOOD_AND_BEVERAGE')
    assert.equal(categoryCodeOf('Clothing & Shopping'), 'CLOTHING_AND_SHOPPING')
    assert.equal(categoryCodeOf('Loans/EMI'), 'LOANS_EMI')
    assert.equal(categoryCodeOf('Fuel'), 'FUEL')
  })

  it('cleans bank noise like the server', () => {
    assert.equal(cleanMerchantText('POS PANDA RET 1234 RIYADH'), 'PANDA RET')
    assert.equal(cleanMerchantText('NOON.COM*ORDER 8472'), 'NOON.COM ORDER')
    assert.equal(cleanMerchantText('***'), '')
  })

  it('rejects broken model files', () => {
    assert.equal(isValidModel(null), false)
    assert.equal(isValidModel({ format: 1 }), false)
  })

  it('matches the server on every parity case', { skip: !model && 'model export or fixture not found' }, () => {
    assert.ok(isValidModel(model))
    const problems = []
    for (const c of parity.cases) {
      const cleaned = cleanMerchantText(c.text.trim())
      if (cleaned !== c.cleaned) problems.push(['clean', c.text, cleaned, c.cleaned])
      const got = predictLocal(model, c.text)
      if (c.category === null) {
        if (got !== null) problems.push(['expected no answer', c.text])
        continue
      }
      if (!got) {
        problems.push(['no answer', c.text])
        continue
      }
      if (Math.abs(got.confidence - c.confidence) > 0.002) problems.push(['confidence', c.text, got.confidence, c.confidence])
      if (got.category !== c.category && c.confidence - c.runner_up >= 0.004) problems.push(['category', c.text, got.category, c.category])
    }
    assert.deepEqual(problems, [])
    const p = classProbabilities(model, 'Starbucks')
    assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-6)
  })
})
