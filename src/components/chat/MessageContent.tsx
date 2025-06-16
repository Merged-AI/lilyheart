'use client'

import React from 'react'

interface MessageContentProps {
  content: string
  className?: string
}

export default function MessageContent({ content, className = '' }: MessageContentProps) {
  // Function to format the message content
  const formatContent = (text: string) => {
    // Split by double line breaks to create paragraphs
    const paragraphs = text.split('\n\n')
    
    return paragraphs.map((paragraph, paragraphIndex) => {
      // Handle numbered lists (1., 2., etc.)
      if (/^\d+\./.test(paragraph.trim())) {
        const lines = paragraph.split('\n')
        return (
          <div key={paragraphIndex} className="space-y-2">
            {lines.map((line, lineIndex) => {
                             if (/^\d+\./.test(line.trim())) {
                // This is a numbered list item
                const textWithoutNumber = line.replace(/^\d+\.\s*/, '')
                const formattedLine = formatInlineText(textWithoutNumber)
                return (
                  <div key={lineIndex} className="flex items-start space-x-2">
                    <span className="text-purple-600 font-semibold text-sm mt-0.5 flex-shrink-0">
                      {line.match(/^\d+\./)?.[0]}
                    </span>
                    <span className="text-sm leading-relaxed">
                      {formattedLine}
                    </span>
                  </div>
                )
              } else if (line.trim()) {
                // Regular line within numbered list context
                return (
                  <div key={lineIndex} className="ml-6 text-sm leading-relaxed">
                    {formatInlineText(line)}
                  </div>
                )
              }
              return null
            }).filter(Boolean)}
          </div>
        )
      }
      
      // Handle bullet points (•, -, *)
      else if (/^[•\-*]\s/.test(paragraph.trim())) {
        const lines = paragraph.split('\n')
        return (
          <div key={paragraphIndex} className="space-y-1">
                         {lines.map((line, lineIndex) => {
               if (/^[•\-*]\s/.test(line.trim())) {
                 const textWithoutBullet = line.replace(/^[•\-*]\s*/, '')
                 const formattedLine = formatInlineText(textWithoutBullet)
                 return (
                   <div key={lineIndex} className="flex items-start space-x-2">
                     <span className="text-purple-600 text-sm mt-1 flex-shrink-0">•</span>
                     <span className="text-sm leading-relaxed">
                       {formattedLine}
                     </span>
                   </div>
                 )
               }
               return null
            }).filter(Boolean)}
          </div>
        )
      }
      
      // Handle regular paragraphs
      else {
        const lines = paragraph.split('\n').filter(line => line.trim())
        return (
          <div key={paragraphIndex} className="space-y-2">
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="text-sm leading-relaxed">
                {formatInlineText(line)}
              </div>
            ))}
          </div>
        )
      }
    })
  }

  // Function to handle inline formatting (bold, etc.)
  const formatInlineText = (text: string) => {
    // Handle bold text (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2)
        return (
          <strong key={index} className="font-semibold text-purple-800">
            {boldText}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {formatContent(content)}
    </div>
  )
} 