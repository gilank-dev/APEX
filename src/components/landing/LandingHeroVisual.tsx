'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function LandingHeroVisual() {
  return (
    <div className="lg:col-span-5 relative flex justify-center w-full max-w-full overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10" />
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        className="w-full max-w-md sm:max-w-full bg-white border border-border rounded-lg shadow-xl overflow-hidden p-2"
      >
        <Image 
          src="/apex_dashboard_mockup.webp" 
          alt="Apex enterprise control center dashboard interface displaying live telemetry, shift attendance, and low-stock SKU inventory" 
          width={800}
          height={500}
          priority
          className="w-full h-auto rounded-md object-cover"
        />
      </motion.div>
    </div>
  )
}
