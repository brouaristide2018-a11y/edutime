import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Save, Image as ImageIcon, Layout, Loader, Plus, Trash2, Upload } from 'lucide-react';

export function SuperAdminSettings() {
  const platformSettings = useStore(state => state.platformSettings);
  const updatePlatformSettings = useStore(state => state.updatePlatformSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [config, setConfig] = useState({
    logoUrl: platformSettings?.publicSite?.logoUrl || '',
    heroTitle: platformSettings?.publicSite?.heroTitle || 'La gestion scolaire réinventée pour demain.',
    heroSubtitle: platformSettings?.publicSite?.heroSubtitle || "Optimisez le suivi des professeurs, automatisez la paie et gérez vos emplois du temps avec une simplicité déconcertante. Conçu pour les établissements d'excellence.",
    sliderDuration: platformSettings?.publicSite?.sliderDuration || 3000,
    heroBgImages: platformSettings?.publicSite?.heroBgImages || [
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2070"
    ]
  });

  useEffect(() => {
    if (platformSettings?.publicSite) {
      setConfig({
        logoUrl: platformSettings.publicSite.logoUrl || '',
        heroTitle: platformSettings.publicSite.heroTitle || 'La gestion scolaire réinventée pour demain.',
        heroSubtitle: platformSettings.publicSite.heroSubtitle || "Optimisez le suivi des professeurs, automatisez la paie et gérez vos emplois du temps avec une simplicité déconcertante. Conçu pour les établissements d'excellence.",
        sliderDuration: platformSettings.publicSite.sliderDuration || 3000,
        heroBgImages: platformSettings.publicSite.heroBgImages || config.heroBgImages
      });
    }
  }, [platformSettings]);

  const compressImageToBase64 = (file: File, isLogo: boolean): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxWidth = isLogo ? 400 : 1280;
          const maxHeight = isLogo ? 400 : 720;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context failed'));

          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = isLogo && file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const quality = isLogo && mimeType === 'image/png' ? undefined : 0.6;

          const dataUrl = canvas.toDataURL(mimeType, quality);

          if (dataUrl.length > 800000) {
            reject(new Error('Image trop volumineuse même après compression. Veuillez essayer une autre image plus petite.'));
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => reject(new Error('Erreur de lecture de l\'image.'));
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'heroBg', index?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("L'image est trop volumineuse (max 8 MB).");
      return;
    }

    try {
      setErrorMsg('');
      if (target === 'logo') setIsUploadingLogo(true);
      else if (index !== undefined) setUploadingImageIndex(index);

      const dataUrl = await compressImageToBase64(file, target === 'logo');

      if (target === 'logo') {
        setConfig(prev => ({ ...prev, logoUrl: dataUrl }));
      } else if (target === 'heroBg' && index !== undefined) {
        const newImages = [...config.heroBgImages];
        newImages[index] = dataUrl;
        setConfig(prev => ({ ...prev, heroBgImages: newImages }));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors du traitement de l'image.");
    } finally {
      setIsUploadingLogo(false);
      setUploadingImageIndex(null);
      event.target.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      updatePlatformSettings({ publicSite: config });
      setSuccessMsg('Paramètres enregistrés avec succès.');
    } catch (error) {
      console.error(error);
      setErrorMsg('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const addImageUrl = () => {
    setConfig(prev => ({
      ...prev,
      heroBgImages: [...prev.heroBgImages, '']
    }));
  };

  const updateImageUrl = (index: number, url: string) => {
    const newImages = [...config.heroBgImages];
    newImages[index] = url;
    setConfig(prev => ({ ...prev, heroBgImages: newImages }));
  };

  const removeImageUrl = (index: number) => {
    const newImages = [...config.heroBgImages];
    newImages.splice(index, 1);
    setConfig(prev => ({ ...prev, heroBgImages: newImages }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto mb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 border-b-4 border-indigo-500 pb-2 inline-block">Apparence & Paramètres</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* GLOBAL OPTIONS */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <Layout className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Paramètres Généraux</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo EduTime (Public & Connexion)</label>
              <div className="flex items-center gap-4">
                <input
                  type="url"
                  value={config.logoUrl}
                  onChange={e => setConfig({...config, logoUrl: e.target.value})}
                  placeholder="URL de l'image (ex: https://...)"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                <span className="text-gray-400 font-medium">OU</span>
                <label className={`relative cursor-pointer bg-white py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploadingLogo ? <Loader size={18} className="animate-spin text-indigo-600" /> : <Upload size={18} className="text-indigo-600" />}
                  <span>{isUploadingLogo ? 'Upload...' : 'Téléverser'}</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    disabled={isUploadingLogo}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">Collez une URL d'image ou téléversez un fichier depuis votre ordinateur (max 5 MB).</p>
              {config.logoUrl && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 max-w-xs relative group">
                  <p className="text-xs text-gray-500 mb-2">Aperçu :</p>
                  <img src={config.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durée du défilement des images (en ms)</label>
              <input
                type="number"
                value={config.sliderDuration}
                onChange={e => setConfig({...config, sliderDuration: parseInt(e.target.value) || 3000})}
                min="1000"
                step="500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-2">3000 équivaut à 3 secondes.</p>
            </div>
          </div>
        </section>

        {/* HERO TEXT */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <ImageIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Textes Héros (Page Publique)</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre Principal</label>
              <input
                type="text"
                value={config.heroTitle}
                onChange={e => setConfig({...config, heroTitle: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre / Paragraphe</label>
              <textarea
                value={config.heroSubtitle}
                onChange={e => setConfig({...config, heroSubtitle: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                required
              />
            </div>
          </div>
        </section>

        {/* BACKGROUND SLIDER IMAGES */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Images de Fond (Diaporama)</h2>
            </div>
            <button
              type="button"
              onClick={addImageUrl}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200 text-sm"
            >
              <Plus size={16} /> Ajouter une image
            </button>
          </div>

          <div className="space-y-4">
            {config.heroBgImages.map((img, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full flex items-center gap-4">
                  <input
                    type="url"
                    value={img}
                    onChange={e => updateImageUrl(index, e.target.value)}
                    placeholder="URL de l'image"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <span className="text-gray-400 font-medium">OU</span>
                  <label className={`relative cursor-pointer bg-white py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors ${uploadingImageIndex === index ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingImageIndex === index ? <Loader size={18} className="animate-spin text-indigo-600" /> : <Upload size={18} className="text-indigo-600" />}
                    <span>{uploadingImageIndex === index ? 'Upload...' : 'Téléverser'}</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'heroBg', index)}
                      disabled={uploadingImageIndex !== null}
                    />
                  </label>
                </div>
                {img && (
                  <img src={img} alt="Preview" className="h-12 w-20 object-cover rounded-md border border-gray-200" />
                )}
                <button
                  type="button"
                  onClick={() => removeImageUrl(index)}
                  className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200 shrink-0"
                  title="Supprimer cette image"
                  disabled={config.heroBgImages.length <= 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {config.heroBgImages.length <= 1 && (
              <p className="text-amber-600 text-sm italic mt-2">Vous devez avoir au moins une image.</p>
            )}
            <p className="text-sm text-gray-500 mt-4">Vous pouvez coller une URL d'image ou téléverser vos propres images (max 5 MB par fichier).</p>
          </div>
        </section>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-lg">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-700 border-l-4 border-green-500 rounded-r-lg font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 font-bold"
          >
            {isSaving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
    </div>
  );
}
