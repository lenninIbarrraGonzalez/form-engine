import { useState, useCallback, useRef, type ReactNode } from 'react'
import { t, type Lang } from './translations'
import examples from './examples'

interface AboutProps {
  onTryExample: (schema: string) => void
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

function MobileCarousel({ items, gridClass = 'sm:grid-cols-2' }: { items: ReactNode[]; gridClass?: string }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)
  const next = () => setIndex((i) => (i + 1) % items.length)

  return (
    <>
      {/* Mobile carousel */}
      <div className="sm:hidden relative">
        <div
          className="overflow-hidden"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const delta = touchStartX.current - e.changedTouches[0].clientX
            if (Math.abs(delta) > 40) delta > 0 ? next() : prev()
            touchStartX.current = null
          }}
        >
          {items.map((item, i) => (
            <div key={i} className={i === index ? 'block' : 'hidden'}>{item}</div>
          ))}
        </div>

        <button type="button" onClick={prev} aria-label="Previous"
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
          ‹
        </button>
        <button type="button" onClick={next} aria-label="Next"
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
          ›
        </button>

        <div className="flex justify-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-gray-300 hover:bg-gray-400'}`} />
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className={`hidden sm:grid ${gridClass} gap-4`}>
        {items}
      </div>
    </>
  )
}

export function About({ onTryExample }: AboutProps) {
  const [lang, setLang] = useState<Lang>('es')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const prevCard = useCallback(
    (total: number) => setCarouselIndex((i) => (i - 1 + total) % total),
    [],
  )
  const nextCard = useCallback((total: number) => setCarouselIndex((i) => (i + 1) % total), [])

  const tr = t[lang]

  const handleCopyExample = useCallback((index: number) => {
    const schema = JSON.stringify(examples[index].schema, null, 2)
    void navigator.clipboard.writeText(schema).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    })
  }, [])

  const handleTryExample = useCallback(
    (index: number) => {
      const schema = JSON.stringify(examples[index].schema, null, 2)
      onTryExample(schema)
    },
    [onTryExample],
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-16">
      {/* Lang toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setLang((l) => (l === 'es' ? 'en' : 'es'))}
          className="text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          {tr.nav.toggle}
        </button>
      </div>

      {/* Hero */}
      <section className="text-center space-y-4">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
          {tr.hero.badge}
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">{tr.hero.title}</h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">{tr.hero.subtitle}</p>
      </section>

      {/* Use cases */}
      <section className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{tr.useCases.title}</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-3xl">{tr.useCases.intro}</p>
        </div>

        <div className="relative">
          {/* Card */}
          <div
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2 min-h-[180px]"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const delta = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(delta) > 40) delta > 0 ? nextCard(tr.useCases.items.length) : prevCard(tr.useCases.items.length)
              touchStartX.current = null
            }}
          >
            {tr.useCases.items.map((item, i) => (
              <div key={item.industry} className={i === carouselIndex ? 'block' : 'hidden'}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.industry}</p>
                    <p className="text-xs text-indigo-500 font-medium">{item.companies}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Prev / Next */}
          <button
            type="button"
            onClick={() => prevCard(tr.useCases.items.length)}
            aria-label="Previous"
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => nextCard(tr.useCases.items.length)}
            aria-label="Next"
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          >
            ›
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {tr.useCases.items.map((item, i) => (
              <button
                key={item.industry}
                type="button"
                onClick={() => setCarouselIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === carouselIndex ? 'bg-indigo-500' : 'bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50 px-5 py-4">
          <p className="font-bold text-indigo-800 text-sm mb-1">{tr.useCases.whyTitle}</p>
          <p className="text-sm text-indigo-700 leading-relaxed">{tr.useCases.why}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">{tr.howItWorks.title}</h2>

        {/* 3-column diagram */}
        <div className="flex flex-col md:flex-row items-start gap-4">
          {tr.howItWorks.layers.map((layer, i) => (
            <div key={layer.label} className="flex md:items-start gap-2 flex-1 w-full md:w-auto">
              <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-bold text-indigo-600 mb-2">{layer.label}</div>
                <p className="text-sm text-gray-500 leading-relaxed">{layer.desc}</p>
              </div>
              {i < tr.howItWorks.layers.length - 1 && (
                <span className="hidden md:inline text-gray-400 text-lg mt-5 flex-shrink-0">
                  {tr.howItWorks.arrow}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Internal layers */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800 text-sm">
            {tr.howItWorks.details.title}
          </div>
          <div className="divide-y divide-gray-100">
            {tr.howItWorks.details.items.map((item) => (
              <div key={item.name} className="px-5 py-4 flex gap-4 items-start">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-gray-800">{item.name}</span>
                  <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{tr.howToUse.title}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[tr.howToUse.demos, tr.howToUse.playground].map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3"
            >
              <h3 className="font-bold text-gray-800">{section.title}</h3>
              <ol className="space-y-2">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Schema guide */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">{tr.schemaGuide.title}</h2>

        {/* Root structure */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">{tr.schemaGuide.rootTitle}</h3>
          <p className="text-sm text-gray-500">{tr.schemaGuide.rootDesc}</p>
          <CodeBlock
            code={`// Flat form
{ "title": "My form", "fields": [ /* ...fields */ ] }

// Multi-step wizard
{
  "title": "My wizard",
  "steps": [
    { "title": "Step 1", "fields": [ /* ...fields */ ] },
    { "title": "Step 2", "fields": [ /* ...fields */ ] }
  ]
}`}
          />
        </div>

        {/* Field types */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">{tr.schemaGuide.fieldTypesTitle}</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-gray-700 w-32">type</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tr.schemaGuide.fieldTypes.map((ft) => (
                  <tr key={ft.type}>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">
                        {ft.type}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{ft.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validations */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">{tr.schemaGuide.validationsTitle}</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-gray-700 w-48">Key</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tr.schemaGuide.validations.map((v) => (
                  <tr key={v.key}>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">
                        {v.key}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{v.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conditions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">{tr.schemaGuide.conditionsTitle}</h3>
          <p className="text-sm text-gray-500">{tr.schemaGuide.conditionsDesc}</p>
          <CodeBlock
            code={`// Simple condition
{ "showIf": { "field": "accountType", "operator": "equals", "value": "company" } }

// AND — all conditions must be true
{ "showIf": { "and": [
    { "field": "role", "operator": "equals", "value": "admin" },
    { "field": "active", "operator": "equals", "value": true }
] } }

// OR — at least one condition must be true
{ "showIf": { "or": [
    { "field": "plan", "operator": "equals", "value": "pro" },
    { "field": "plan", "operator": "equals", "value": "enterprise" }
] } }`}
          />
          <p className="text-sm text-gray-500">
            <span className="font-semibold">{tr.schemaGuide.operatorsLabel}</span>{' '}
            {tr.schemaGuide.operators.map((op, i) => (
              <span key={op}>
                <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-xs">
                  {op}
                </code>
                {i < tr.schemaGuide.operators.length - 1 && ' · '}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* Examples */}
      <section className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{tr.examples.title}</h2>
          <p className="text-gray-500 mt-1 text-sm">{tr.examples.subtitle}</p>
        </div>
        <div className="space-y-6">
          {tr.examples.items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 whitespace-nowrap">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyExample(i)}
                    className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {copiedIndex === i ? tr.examples.copiedBtn : tr.examples.copyBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTryExample(i)}
                    className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    {tr.examples.tryBtn}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
                  {JSON.stringify(examples[i].schema, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{tr.tips.title}</h2>
        <MobileCarousel
          items={tr.tips.items.map((tip) => (
            <div
              key={tip.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex gap-4"
            >
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{tip.title}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <span>
          {tr.footer.builtBy}{' '}
          <span className="font-semibold text-gray-600">{tr.footer.name}</span>
        </span>
        <div className="flex items-center gap-4">
          {tr.footer.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-indigo-600 transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
