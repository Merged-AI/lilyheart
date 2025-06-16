/**
 * Utility functions for safely parsing JSON responses from AI models
 */

/**
 * Safely parses JSON that might be wrapped in markdown code blocks
 * Common patterns from AI models:
 * - ```json { ... } ```
 * - ```JSON { ... } ```
 * - ``` { ... } ```
 * - `{ ... }`
 */
export function safeParseAIJson<T = any>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string')
  }

  // Clean the text by removing markdown code block indicators
  let cleaned = text.trim()
  
  // Remove opening code block markers
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*/gi, '')
  
  // Remove closing code block markers
  cleaned = cleaned.replace(/\s*```\s*$/g, '')
  
  // Remove any remaining backticks at start/end
  cleaned = cleaned.replace(/^`+|`+$/g, '')
  
  // Trim whitespace
  cleaned = cleaned.trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (error) {
    // Provide more detailed error information
    throw new Error(`Failed to parse JSON. Original error: ${error instanceof Error ? error.message : 'Unknown error'}. Cleaned text (first 200 chars): ${cleaned.substring(0, 200)}${cleaned.length > 200 ? '...' : ''}`)
  }
}

/**
 * Safely parses JSON with fallback to a default value
 */
export function safeParseAIJsonWithFallback<T>(text: string, fallback: T): T {
  try {
    return safeParseAIJson<T>(text)
  } catch (error) {
    console.warn('Failed to parse AI JSON, using fallback:', error)
    return fallback
  }
}

/**
 * Checks if a string looks like it might contain JSON
 */
export function looksLikeJson(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }
  
  const trimmed = text.trim()
  
  // Check for common JSON patterns
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed.includes('```json') ||
    trimmed.includes('```JSON') ||
    (trimmed.startsWith('```') && trimmed.endsWith('```'))
  )
}

/**
 * Extracts JSON from mixed content (text + JSON)
 * Useful when AI responds with explanation followed by JSON
 */
export function extractJsonFromMixedContent(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null
  }
  
  // Look for JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json|JSON)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/i)
  if (codeBlockMatch) {
    return codeBlockMatch[1]
  }
  
  // Look for standalone JSON objects
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
  if (jsonObjectMatch) {
    return jsonObjectMatch[0]
  }
  
  // Look for standalone JSON arrays
  const jsonArrayMatch = text.match(/\[[\s\S]*\]/)
  if (jsonArrayMatch) {
    return jsonArrayMatch[0]
  }
  
  return null
}

/**
 * Parses AI response that might contain both explanation and JSON
 */
export function parseAIResponseWithJson<T = any>(text: string): { explanation?: string; data: T } {
  const jsonPart = extractJsonFromMixedContent(text)
  
  if (!jsonPart) {
    throw new Error('No JSON found in AI response')
  }
  
  const data = safeParseAIJson<T>(jsonPart)
  
  // Extract explanation (text before the JSON)
  let explanation: string | undefined
  const jsonIndex = text.indexOf(jsonPart)
  if (jsonIndex > 0) {
    explanation = text.substring(0, jsonIndex).trim()
    // Remove common prefixes
    explanation = explanation.replace(/^(here's|here is|the result is|result:)/i, '').trim()
  }
  
  return { explanation, data }
} 