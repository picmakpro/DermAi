import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUT_DIR = path.join(__dirname, '..', 'test')
const PAYLOAD_PATH = path.join(OUT_DIR, 'payload.json')
const RESPONSE_PATH = path.join(OUT_DIR, 'response.json')
const REPORT_PATH = path.join(OUT_DIR, 'report.md')

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function fileExists(p) {
  try { await fs.access(p); return true } catch { return false }
}

function defaultPayload() {
  return {
    // V2 API format
    photos: [
      { 
        id: "test-photo-1",
        file: "data:image/jpeg;base64,test",
        preview: "test",
        type: "face-frontal",
        quality: "good"
      }
    ],
    userProfile: {
      age: 29,
      gender: "female",
      skinType: "combination"
    },
    skinConcerns: {
      primary: ["acne", "pores"]
    },
    currentRoutine: {
      morningProducts: [],
      eveningProducts: [],
      monthlyBudget: "50-100"
    },
    catalog: {
      products: [
        { id:"p_cleanser_combo_budget", name:"Gel Nettoyant Doux", brand:"DemoBrand",
          category:"cleanser", price:8.90, priority_score:90, in_stock:true,
          skin_types:["combination","oily","normal"], target_concerns:["pores","acne","oil_control"],
          budget_tier:"budget", clinical_proven:false, dermatologist_recommended:false },
        { id:"p_moisturizer_combo", name:"Hydratant Équilibrant", brand:"DemoBrand",
          category:"moisturizer", price:12.90, priority_score:85, in_stock:true,
          skin_types:["combination","normal","sensitive"], target_concerns:["dehydration","barrier_support"],
          budget_tier:"mid", clinical_proven:false, dermatologist_recommended:true },
        { id:"p_sunscreen_face", name:"Crème Solaire Visage SPF50", brand:"DemoBrand",
          category:"sunscreen", price:14.90, priority_score:95, in_stock:true,
          skin_types:["oily","combination","normal","sensitive"], target_concerns:["uv_protection","pigmentation"],
          budget_tier:"mid", clinical_proven:true, dermatologist_recommended:true },
        { id:"p_niacinamide_serum", name:"Sérum Niacinamide 10%", brand:"DemoBrand",
          category:"treatment", subcategory:"niacinamide", price:15.90, priority_score:88, in_stock:true,
          skin_types:["oily","combination","normal"], target_concerns:["pores","oil_control","texture"],
          budget_tier:"mid", clinical_proven:false, dermatologist_recommended:true },
        { id:"p_retinoid_low", name:"Rétinoïde Faible", brand:"DemoBrand",
          category:"treatment", subcategory:"retinoid", price:19.90, priority_score:80, in_stock:true,
          skin_types:["normal","combination"], target_concerns:["wrinkles","texture","acne"],
          budget_tier:"mid", clinical_proven:false, dermatologist_recommended:false },
        { id:"p_spot_bha", name:"Soin Local BHA", brand:"DemoBrand",
          category:"spot_treatment", price:9.50, priority_score:78, in_stock:true,
          skin_types:["oily","combination","normal"], target_concerns:["acne","blemishes"],
          budget_tier:"budget", clinical_proven:false, dermatologist_recommended:false }
      ]
    }
  }
}

function deepFindAllNumbersByKey(obj, key) {
  const out = []
  const stack = [obj]
  while (stack.length) {
    const cur = stack.pop()
    if (cur && typeof cur === 'object') {
      for (const k of Object.keys(cur)) {
        const v = cur[k]
        if (k === key && typeof v === 'number') out.push(v)
        if (v && typeof v === 'object') stack.push(v)
      }
    }
  }
  return out
}

function stringify(obj) {
  return JSON.stringify(obj, null, 2)
}

function containsAll(str, arr) {
  return arr.every(s => str.includes(`"${s}"`))
}

async function main() {
  await ensureDir(OUT_DIR)

  // Ensure payload
  if (!(await fileExists(PAYLOAD_PATH))) {
    await fs.writeFile(PAYLOAD_PATH, stringify(defaultPayload()), 'utf-8')
    console.log(`Created ${path.relative(process.cwd(), PAYLOAD_PATH)} (default payload)`)
  }

  const raw = await fs.readFile(PAYLOAD_PATH, 'utf-8')
  const payload = JSON.parse(raw)

  // Try /api/analyze then /api/diagnose if 404
  let url = 'http://localhost:3000/api/analyze'
  let res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  if (res.status === 404) {
    url = 'http://localhost:3000/api/diagnose'
    res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  }

  const status = res.status
  let bodyText = await res.text()
  let json
  try { json = JSON.parse(bodyText) } catch { json = null }

  // Save raw response
  await fs.writeFile(RESPONSE_PATH, json ? stringify(json) : bodyText, 'utf-8')

  // Evaluate heuristics on JSON (works even if adapted/legacy)
  const checks = []
  if (json) {
    const jstr = stringify(json)
    const hasScores = containsAll(jstr, ["hydration","wrinkles","firmness","radiance","pores","spots","darkCircles","skinAge"])
    const has3Phases = containsAll(jstr, ["immediate","adaptation","maintenance"])
    const noFallbacks = jstr.includes('"noFallbacks": true')
    const utilizationCandidates = deepFindAllNumbersByKey(json, 'utilization_pct')
    const utilOk = utilizationCandidates.some(n => n >= 80 && n <= 110)

    checks.push({name:"HTTP 200", ok: status === 200, detail:`status=${status}`})
    checks.push({name:"Vision scores (8)", ok: hasScores})
    checks.push({name:"Routine 3 phases", ok: has3Phases})
    checks.push({name:"Products noFallbacks=true", ok: noFallbacks})
    checks.push({name:"Budget utilization 80–110%", ok: utilOk, detail:`found: [${utilizationCandidates.join(', ')}]`})
  } else {
    checks.push({name:"HTTP 200", ok: status === 200, detail:`status=${status}`})
    checks.push({name:"Response is JSON", ok: false, detail:"Server returned non-JSON (see test/response.json)"})
  }

  // Build report
  const passCount = checks.filter(c => c.ok).length
  const total = checks.length
  const lines = []
  lines.push(`# DermAI E2E Report`)
  lines.push(`- Endpoint: \`${url}\``)
  lines.push(`- Status: ${status}`)
  lines.push(`- Result: ${passCount}/${total} checks passed`)
  lines.push(``)
  for (const c of checks) {
    lines.push(`- ${c.ok ? '✅' : '❌'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
  }
  lines.push(``)
  lines.push(`Artifacts:`)
  lines.push(`- Payload: \`test/payload.json\``)
  lines.push(`- Response: \`test/response.json\``)
  await fs.writeFile(REPORT_PATH, lines.join('\n'), 'utf-8')

  // Console summary
  console.log(lines.join('\n'))
  
  // Provider and pipeline information
  console.log('\n📊 Provider & Pipeline Info:')
  if (json && json.pipeline) {
    console.log(`- Pipeline: ${json.pipeline}`)
  }
  if (json && json.error) {
    console.log(`- Provider: ${json.error.name || 'Unknown'}`)
    console.log(`- Error: ${json.error.message}`)
    if (json.hint) {
      console.log(`- Hint: ${json.hint}`)
    }
  } else if (json && json.data && json.data.metadata) {
    console.log(`- AI Model: ${json.data.metadata.ai_model_used || 'Unknown'}`)
    console.log(`- Analysis Version: ${json.data.metadata.analysis_version || 'Unknown'}`)
  }
  
  if (status !== 200) process.exitCode = 1
}

main().catch(err => {
  console.error('E2E test crashed:', err)
  process.exitCode = 1
})
