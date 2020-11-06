import './Motion.css'
import * as React from 'react'
import { motion } from 'framer-motion'

export const Motion = () => {
  return (
    <motion.div
      data-testid="motion"
      style={{ width: 100, height: 100, backgroundColor: 'white' }}
      animate={{
        scale: [1, 2, 2, 1, 1],
        rotate: [0, 0, 270, 270, 0],
        borderRadius: ['20%', '20%', '50%', '50%', '20%'],
      }}
      transition={{
        duration: 2,
        ease: 'easeInOut',
        times: [0, 0.2, 0.5, 0.8, 1],
        loop: false,
        repeatDelay: 1,
      }}
    />
  )
}
