// Debug utility for EventDetailsScreen
export const debugEventData = (data, source = 'unknown') => {
  console.log(`🔍 [${source}] Event data debug:`, {
    eventId: data?.event_id || data?.id,
    title: data?.title,
    hasFaqs: !!data?.faqs,
    faqsType: typeof data?.faqs,
    faqsIsArray: Array.isArray(data?.faqs),
    faqsLength: Array.isArray(data?.faqs) ? data?.faqs.length : 'not array',
    faqsSample: Array.isArray(data?.faqs) ? data?.faqs.slice(0, 2) : data?.faqs
  })
}

export const processFaqs = (faqs) => {
  if (!faqs) {
    console.log('🔍 No FAQs provided')
    return []
  }

  if (Array.isArray(faqs)) {
    console.log('🔍 FAQs already array:', faqs.length)
    return faqs
  }

  if (typeof faqs === 'string') {
    try {
      const parsed = JSON.parse(faqs)
      console.log('🔍 FAQs parsed from string:', parsed.length)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('❌ Error parsing FAQs string:', error)
      return []
    }
  }

  console.warn('⚠️ FAQs in unexpected format:', typeof faqs)
  return []
}