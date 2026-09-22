import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ImagePlus, Save, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, PageLoader, ButtonLoader } from '../components/index.js';
import { CATEGORIES, CONDITIONS, LOCATIONS, CATEGORY_EMOJI } from '../utils/constants.js';
import { getError, formatImagePath } from '../utils/format.js';

export default function ItemForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    condition: '',
    location: 'Main Block',
    availability: true,
  });
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/items/${id}`)
      .then((res) => {
        const item = res.data.item;
        if (String(item.ownerId._id || item.ownerId) !== String(user.id) && user.role !== 'admin') {
          toast.error('You can only edit your own items.');
          navigate('/lending');
          return;
        }
        setForm({
          name: item.name,
          description: item.description || '',
          category: item.category,
          condition: item.condition,
          location: item.location,
          availability: item.availability,
        });
        setExistingImages(item.images || []);
      })
      .catch((err) => {
        setError(getError(err));
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, user, navigate, toast]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setBool = (key) => (e) => setForm({ ...form, [key]: e.target.checked });
  const setPill = (key) => (value) => setForm({ ...form, [key]: value });

  const onFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 6) {
      toast.error('You can upload up to 6 images.');
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    if (selected.length > 0) {
      setPreviewUrl(URL.createObjectURL(selected[0]));
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setPreviewUrl('');
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.name.trim() || !form.category || !form.condition) {
      setError('Name, category and condition are required.');
      setSaving(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
      if (existingImages.length) {
        existingImages.forEach((img) => data.append('existingImages', img));
      }
      files.forEach((file) => data.append('images', file));

      if (isEdit) {
        const res = await api.put(`/items/${id}`, data);
        toast.success(res.data.message, 'Item updated');
      } else {
        if (files.length === 0) {
          setError('Please add at least one image of your item.');
          setSaving(false);
          return;
        }
        const res = await api.post('/items', data);
        toast.success(res.data.message, 'Item listed');
      }
      navigate('/lending');
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const firstPreview = files.length
    ? URL.createObjectURL(files[0])
    : existingImages.length
      ? formatImagePath(existingImages[0])
      : '';
  const photoCount = files.length + existingImages.length;

  return (
    <div className="mx-auto max-w-6xl pb-28 lg:pb-0">
      <PageHeader
        title={isEdit ? 'Edit item' : 'Add item'}
        subtitle={
          isEdit
            ? 'Update your listing so students know exactly what to expect.'
            : 'Share something you own with students who need it — completely free.'
        }
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      <form id="item-form" onSubmit={submit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="surface-section relative overflow-hidden p-6">
              <div className="divider-gradient absolute inset-x-6 top-0" />
              <p className="eyebrow">Step 1 · Basics</p>
              <div className="mt-3">
                <label className="label" htmlFor="item-name">Item name</label>
                <input
                  id="item-name"
                  required
                  className="input"
                  placeholder="e.g. Scientific Calculator"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>
            </section>

            <section className="surface-section relative overflow-hidden p-6">
              <div className="divider-gradient absolute inset-x-6 top-0" />
              <p className="eyebrow">Step 2 · Details</p>

              <div className="mt-3">
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPill('category')(c)}
                      className={`pill ${form.category === c ? 'pill-active' : 'pill-idle'}`}
                    >
                      <span aria-hidden>{CATEGORY_EMOJI[c]}</span> {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="label">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPill('condition')(c)}
                      className={`pill ${form.condition === c ? 'pill-active' : 'pill-idle'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="label">Location</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPill('location')(l)}
                      className={`pill ${form.location === l ? 'pill-active' : 'pill-idle'}`}
                    >
                      <MapPin className="h-3.5 w-3.5" /> {l}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="surface-section relative overflow-hidden p-6">
              <div className="divider-gradient absolute inset-x-6 top-0" />
              <p className="eyebrow">Step 3 · About</p>
              <div className="mt-3">
                <label className="label" htmlFor="item-desc">Description</label>
                <textarea
                  id="item-desc"
                  rows={4}
                  className="input"
                  placeholder="Describe the item, what it's useful for, and any care instructions."
                  value={form.description}
                  onChange={set('description')}
                />
              </div>
            </section>

            <section className="surface-section relative overflow-hidden p-6">
              <div className="divider-gradient absolute inset-x-6 top-0" />
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Step 4 · Photos</p>
                <span className="input-chip">{photoCount}/6</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {existingImages.map((img, i) => (
                  <div
                    key={`e-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
                  >
                    <img src={formatImagePath(img)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-slate-600 opacity-0 shadow transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {files.map((file, i) => (
                  <div
                    key={`n-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
                  >
                    <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {existingImages.length + i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-slate-600 opacity-0 shadow transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <label className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-500">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-primary-100">
                    <ImagePlus className="h-5 w-5" />
                  </span>
                  <span className="px-2 text-center text-[11px] font-medium">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
                </label>
              </div>
              {!isEdit && files.length === 0 && (
                <p className="mt-2 text-xs text-slate-400">At least one photo is required.</p>
              )}
            </section>

            <div className="hidden items-center justify-between border-t border-slate-200/70 pt-6 lg:flex">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <ButtonLoader>{isEdit ? 'Saving…' : 'Listing…'}</ButtonLoader>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'List item'}
                  </>
                )}
              </button>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="surface-section overflow-hidden shadow-card">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-indigo-400 to-accent-500" />
              <div className="p-5">
                <p className="eyebrow">Listing preview</p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50">
                  {firstPreview ? (
                    <img src={firstPreview} alt="" className="aspect-[16/10] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center text-slate-300">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <p className="mt-3 truncate text-sm font-bold text-slate-900">
                  {form.name || 'Untitled item'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.category && (
                    <span className="badge bg-primary-50 text-primary-700 ring-1 ring-primary-200">
                      <span aria-hidden>{CATEGORY_EMOJI[form.category] || '📦'}</span> {form.category}
                    </span>
                  )}
                  {form.condition && (
                    <span className="badge bg-slate-50 text-slate-600 ring-1 ring-slate-200">{form.condition}</span>
                  )}
                  {form.location && (
                    <span className="badge bg-accent-50 text-accent-700 ring-1 ring-accent-200">
                      <MapPin className="h-3 w-3" /> {form.location}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {photoCount} photo{photoCount === 1 ? '' : 's'} ·{' '}
                  {form.availability ? 'Available to borrow' : 'Hidden from Discover'}
                </p>
              </div>
            </div>

            <div className="surface-section p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Available for borrowing</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Turn this off to temporarily hide the item from Discover.
                  </p>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={form.availability}
                    onChange={setBool('availability')}
                  />
                  <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-accent-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-accent-100 bg-gradient-to-br from-accent-50 to-white p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-accent-800">100% free, always</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-accent-700">
                    No rentals, deposits or payments. Ever. Lending builds community trust.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary whitespace-nowrap">
            Cancel
          </button>
          <button type="submit" form="item-form" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? (
              <ButtonLoader>{isEdit ? 'Saving…' : 'Listing…'}</ButtonLoader>
            ) : (
              <>
                <Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'List item'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}