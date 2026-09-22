import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from './Avatar.jsx';
import { RatingStars } from './Rating.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatImagePath } from '../utils/format.js';
import { CATEGORY_EMOJI } from '../utils/constants.js';

export default function ItemCard({ item, index = 0 }) {
  const image = item.images?.[0];
  const owner = item.owner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-cardhover"
    >
      <Link to={`/items/${item._id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={formatImagePath(image)}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
            <ImageOff className="h-10 w-10" />
            <span className="text-xs font-medium">{CATEGORY_EMOJI[item.category]} {item.category}</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <StatusBadge status={item.status} label={item.status === 'AVAILABLE' ? 'Available' : undefined} />
        </div>
        {item.condition && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700 backdrop-blur">
            {item.condition}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary-600">
            {CATEGORY_EMOJI[item.category]} {item.category}
          </span>
        </div>
        <Link to={`/items/${item._id}`}>
          <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-primary-700">
            {item.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <Avatar user={owner} size="xs" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-700">{owner?.name || 'Unknown'}</p>
              <div className="flex items-center gap-1">
                <RatingStars rating={owner?.rating} size={11} />
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {item.location}
          </span>
        </div>

        <Link
          to={`/items/${item._id}`}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
        >
          View Details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}