'use client'

import { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  fallback?: string
  threshold?: number
  rootMargin?: string
  blurDataURL?: string
}

export function LazyImage({
  src,
  alt,
  fallback = '/images/placeholder.png',
  threshold = 0.1,
  rootMargin = '50px',
  className,
  blurDataURL,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src as string)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current)
      }
    }
  }, [src, threshold, rootMargin])

  return (
    <div ref={imageRef} className={cn('relative', className)}>
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
      />
      {isLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />}
    </div>
  )
}
