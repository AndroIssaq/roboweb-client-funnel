"use client"

// Lazy-load pdfmake and register Arabic fonts (Cairo -> fallback Amiri -> fallback Roboto)
// Preferred paths:
//   - /public/fonts/cairo/Cairo-Regular.ttf
//   - /public/fonts/cairo/Cairo-Bold.ttf
// Fallback paths:
//   - /public/fonts/amiri/Amiri-Regular.ttf
//   - /public/fonts/amiri/Amiri-Bold.ttf
// If none exist, it falls back to built-in Roboto. We also map the discovered
// Arabic font to the key 'Cairo' so docDefinitions using font: 'Cairo' keep working.

let pdfMakeSingleton: any | null = null

async function fetchFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load font: ${url}`)
  const buf = await res.arrayBuffer()
  // Convert ArrayBuffer -> base64
  let binary = ""
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes, i, i + chunk))
  }
  return btoa(binary)
}

export async function getPdfMake(): Promise<any> {
  if (pdfMakeSingleton) return pdfMakeSingleton

  // Import core pdfmake
  const pdfMakeModule = await import('pdfmake/build/pdfmake')
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts')
  // @ts-ignore
  const pdfMake = pdfMakeModule.default || (pdfMakeModule as any)
  // Some builds require explicit binding of vfs
  // @ts-ignore
  const pdfFonts = pdfFontsModule.default || (pdfFontsModule as any)
  // @ts-ignore
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    // @ts-ignore
    pdfMake.vfs = { ...(pdfMake.vfs || {}), ...(pdfFonts.pdfMake.vfs || {}) }
  }

  // Compute base prefix (supports Next.js assetPrefix/basePath)
  const assetPrefix = (globalThis as any).__NEXT_DATA__?.assetPrefix || ''
  const withBase = (p: string) => `${assetPrefix}${p}`

  // Try to load Cairo fonts from public folder, then fall back to Amiri.
  let loadedArabicFamily: 'cairo' | 'amiri' | null = null
  try {
    const cairoRegularUrl = withBase('/fonts/cairo/Cairo-Regular.ttf')
    const cairoBoldUrl = withBase('/fonts/cairo/Cairo-Bold.ttf')
    const regularBase64 = await fetchFontAsBase64(cairoRegularUrl)
    let boldBase64: string
    try {
      boldBase64 = await fetchFontAsBase64(cairoBoldUrl)
    } catch (eBold) {
      console.warn('Cairo-Bold.ttf not found. Falling back to Cairo-Regular.ttf for bold.')
      boldBase64 = regularBase64
    }

    pdfMake.vfs = {
      ...(pdfMake.vfs || {}),
      'Cairo-Regular.ttf': regularBase64,
      'Cairo-Bold.ttf': boldBase64,
    }
    loadedArabicFamily = 'cairo'
  } catch (e) {
    // Try Amiri fallback
    try {
      const amiriRegularUrl = withBase('/fonts/amiri/Amiri-Regular.ttf')
      const amiriBoldUrl = withBase('/fonts/amiri/Amiri-Bold.ttf')
      const regularBase64 = await fetchFontAsBase64(amiriRegularUrl)
      let boldBase64: string
      try {
        boldBase64 = await fetchFontAsBase64(amiriBoldUrl)
      } catch (eBold2) {
        console.warn('Amiri-Bold.ttf not found. Falling back to Amiri-Regular.ttf for bold.')
        boldBase64 = regularBase64
      }

      pdfMake.vfs = {
        ...(pdfMake.vfs || {}),
        'Amiri-Regular.ttf': regularBase64,
        'Amiri-Bold.ttf': boldBase64,
      }
      loadedArabicFamily = 'amiri'
    } catch (e2) {
      console.warn('Arabic fonts (Cairo/Amiri) not found. Falling back to Roboto.', e2)
    }
  }

  // Set font mappings (map discovered Arabic family to key 'Cairo')
  const cairoMap =
    loadedArabicFamily === 'cairo'
      ? { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' }
      : loadedArabicFamily === 'amiri'
      ? { normal: 'Amiri-Regular.ttf', bold: 'Amiri-Bold.ttf', italics: 'Amiri-Regular.ttf', bolditalics: 'Amiri-Bold.ttf' }
      : { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' }

  pdfMake.fonts = {
    ...(pdfMake.fonts || {}),
    Cairo: cairoMap,
    Amiri: { normal: 'Amiri-Regular.ttf', bold: 'Amiri-Bold.ttf', italics: 'Amiri-Regular.ttf', bolditalics: 'Amiri-Bold.ttf' },
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  }

  // Final safety: guarantee vfs keys exist for Cairo family to avoid runtime errors
  pdfMake.vfs = pdfMake.vfs || {}
  // If Cairo regular missing, alias to Amiri or Roboto
  if (!pdfMake.vfs['Cairo-Regular.ttf']) {
    if (pdfMake.vfs['Amiri-Regular.ttf']) {
      pdfMake.vfs['Cairo-Regular.ttf'] = pdfMake.vfs['Amiri-Regular.ttf']
    } else if (pdfMake.vfs['Roboto-Regular.ttf']) {
      pdfMake.vfs['Cairo-Regular.ttf'] = pdfMake.vfs['Roboto-Regular.ttf']
    }
  }
  // If Cairo bold missing, alias to existing regular/bold
  if (!pdfMake.vfs['Cairo-Bold.ttf']) {
    if (pdfMake.vfs['Amiri-Bold.ttf']) {
      pdfMake.vfs['Cairo-Bold.ttf'] = pdfMake.vfs['Amiri-Bold.ttf']
    } else if (pdfMake.vfs['Cairo-Regular.ttf']) {
      pdfMake.vfs['Cairo-Bold.ttf'] = pdfMake.vfs['Cairo-Regular.ttf']
    } else if (pdfMake.vfs['Roboto-Medium.ttf']) {
      pdfMake.vfs['Cairo-Bold.ttf'] = pdfMake.vfs['Roboto-Medium.ttf']
    } else if (pdfMake.vfs['Roboto-Regular.ttf']) {
      pdfMake.vfs['Cairo-Bold.ttf'] = pdfMake.vfs['Roboto-Regular.ttf']
    }
  }

  // Sync global pdfMake (some builds reference window.pdfMake)
  ;(globalThis as any).pdfMake = pdfMake

  pdfMakeSingleton = pdfMake
  return pdfMake
}
