'use client'

import { motion } from 'framer-motion'
import { Clock, CreditCard, TrendingUp, Calendar } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 }
  }
}

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingBentoGrid() {
  const bentoFeatures = [
    {
      title: 'Real-Time Selfie Attendance',
      description: 'Instant front-camera selfie verification. Light, privacy-centric, and secure from proxy manipulation.',
      icon: <Clock className="w-5 h-5 text-primary" />,
      badge: 'Real-Time',
      className: 'md:col-span-2'
    },
    {
      title: 'Automated Payroll Engine',
      description: 'Server-side automated tax computations, allowances, and digital salary slips dispatched in one run.',
      icon: <CreditCard className="w-5 h-5 text-primary" />,
      badge: '99.9% Accurate',
      className: 'md:col-span-1'
    },
    {
      title: 'Operations Analytics',
      description: 'High-density charts and performance indicators tracking shift attendance, task progress, and low stocks.',
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      badge: 'Telemetry',
      className: 'md:col-span-1'
    },
    {
      title: 'Dynamic Roster & Workflow',
      description: 'Flexible morning and night shift allocation, custom approval policies, and online reimbursement logs.',
      icon: <Calendar className="w-5 h-5 text-primary" />,
      badge: 'Flexible',
      className: 'md:col-span-2'
    }
  ]

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {bentoFeatures.map((feat, idx) => (
        <motion.div
          key={idx}
          variants={fadeInUp}
          className={`bg-white border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between min-h-60 relative group ${feat.className}`}
        >
          <div className="absolute top-4 right-4 bg-orange-50 border border-primary/20 text-primary text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] tracking-wide uppercase">
            {feat.badge}
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 border border-primary/10 flex items-center justify-center mb-6">
            {feat.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide group-hover:text-primary transition-colors">{feat.title}</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed normal-case">{feat.description}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
