import { motion } from 'framer-motion';

export default function Reveal({ children, delay = 0, y = 22, className, once = true, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.55, 0.24, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}