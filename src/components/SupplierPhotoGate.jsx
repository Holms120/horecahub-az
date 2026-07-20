import { useRef, useState } from 'react'
import { Camera, ImagePlus, LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

// Storage writes require an authenticated session (own_folder_insert in
// 004_storage_policies.sql), which does not exist yet at signup time while
// email confirmation is pending — so the photo can't be uploaded during the
// Register.jsx form itself. This gate closes that gap at the earliest point
// it's technically possible: right after the pending supplier's first
// authenticated session (post email confirmation).
export default function SupplierPhotoGate({ children }) {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const mustAddPhoto = !loading && !!user && !!profile
    && profile.supplier_status === 'pending'
    && !profile.logo_url
    && !profile.is_admin

  if (!mustAddPhoto) return children

  function handleChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) { setError('Yalnız JPG, PNG, WEBP formatlar qəbul edilir'); return }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Maksimum fayl ölçüsü ${MAX_MB}MB-dır`); return }
    setError('')
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSave() {
    if (!file) { setError('Zəhmət olmasa şəkil seçin'); return }
    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true, contentType: file.type })
    if (uploadErr) { setError('Yüklənmə xətası: ' + uploadErr.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', user.id)
    if (updateErr) { setError(updateErr.message); setUploading(false); return }

    await refreshProfile()
    setUploading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-blue-100 mx-auto mb-5 flex items-center justify-center overflow-hidden border-2 border-gray-200">
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover" />
            : <ImagePlus size={28} className="text-blue-400" />}
        </div>
        <h1 className="text-lg font-bold text-navy mb-2">Profil şəklini əlavə edin</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Təchizatçı müraciətinizin nəzərdən keçirilməsi üçün profil şəkli tələb olunur.
          Şəkli əlavə etdikdən sonra platformadan istifadəyə davam edə bilərsiniz.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="sr-only" />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-navy hover:bg-gray-50 mb-3 transition-colors">
          <Camera size={16} /> {file ? 'Şəkli dəyiş' : 'Şəkil seç'}
        </button>
        <button type="button" onClick={handleSave} disabled={!file || uploading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
          {uploading ? 'Yüklənir...' : 'Yadda saxla və davam et'}
        </button>
        <button type="button" onClick={signOut}
          className="w-full flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <LogOut size={12} /> Çıxış et
        </button>
      </div>
    </div>
  )
}
