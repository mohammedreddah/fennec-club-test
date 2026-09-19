import { useEffect, useState } from 'react';
import * as foldersApi from '../../api/folders.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

export default function Folders() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [savingFolder, setSavingFolder] = useState(false);

  const [docFormOpen, setDocFormOpen] = useState(false);
  const [docFolderId, setDocFolderId] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'folder'|'document', item }
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setFolders(await foldersApi.listFolders());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFolder = async (payload) => {
    setSavingFolder(true);
    try {
      if (editingFolder) {
        await foldersApi.updateFolder(editingFolder.id, payload);
        showToast(t('toast.updated'));
      } else {
        await foldersApi.createFolder({ ...payload, display_order: folders.length });
        showToast(t('toast.created'));
      }
      setFolderFormOpen(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingFolder(false);
    }
  };

  const saveDoc = async (payload) => {
    setSavingDoc(true);
    try {
      if (editingDoc) {
        await foldersApi.updateRequirement(editingDoc.id, payload);
        showToast(t('toast.updated'));
      } else {
        const folder = folders.find((f) => f.id === docFolderId);
        await foldersApi.createRequirement({
          ...payload,
          folder_id: docFolderId,
          display_order: folder?.documents?.length || 0,
        });
        showToast(t('toast.created'));
      }
      setDocFormOpen(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDelete = async () => {
    setConfirmLoading(true);
    try {
      if (confirmTarget.type === 'folder') {
        await foldersApi.deleteFolder(confirmTarget.item.id);
      } else {
        await foldersApi.deleteRequirement(confirmTarget.item.id);
      }
      showToast(t('toast.deleted'));
      setConfirmTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">{t('folders.title')}</h1>
          <p className="text-dune-600">{t('folders.subtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingFolder(null);
            setFolderFormOpen(true);
          }}
        >
          + {t('folders.new')}
        </button>
      </div>

      {folders.length === 0 ? (
        <EmptyState title={t('folders.noneFound')} description={t('folders.noneFoundDesc')} />
      ) : (
        <div className="space-y-4">
          {folders.map((folder) => (
            <div key={folder.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-display text-lg">{folder.name}</p>
                  {folder.description && <p className="text-sm text-dune-600">{folder.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary !px-3 !py-1 text-xs"
                    onClick={() => {
                      setEditingFolder(folder);
                      setFolderFormOpen(true);
                    }}
                  >
                    {t('folders.editFolder')}
                  </button>
                  <button
                    className="btn-ghost !px-3 !py-1 text-xs text-absent"
                    onClick={() => setConfirmTarget({ type: 'folder', item: folder })}
                  >
                    {t('folders.deleteFolder')}
                  </button>
                </div>
              </div>

              {folder.documents.length === 0 ? (
                <p className="text-sm text-dune-300 mb-3">{t('folders.noDocsYet')}</p>
              ) : (
                <ul className="divide-y divide-dune-100 mb-3">
                  {folder.documents.map((doc) => (
                    <li key={doc.id} className="py-2 flex items-center justify-between text-sm">
                      <span>{doc.name}</span>
                      <div className="flex gap-2">
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs"
                          onClick={() => {
                            setEditingDoc(doc);
                            setDocFolderId(folder.id);
                            setDocFormOpen(true);
                          }}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs text-absent"
                          onClick={() => setConfirmTarget({ type: 'document', item: doc })}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="btn-ghost !px-2 !py-1 text-xs text-fennec-600"
                onClick={() => {
                  setEditingDoc(null);
                  setDocFolderId(folder.id);
                  setDocFormOpen(true);
                }}
              >
                {t('folders.addDoc')}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={folderFormOpen}
        onClose={() => setFolderFormOpen(false)}
        title={editingFolder ? t('folders.edit') : t('folders.new')}
      >
        <FolderForm initial={editingFolder} saving={savingFolder} onSubmit={saveFolder} t={t} />
      </Modal>

      <Modal
        open={docFormOpen}
        onClose={() => setDocFormOpen(false)}
        title={editingDoc ? t('folders.editDoc') : t('folders.newDoc')}
      >
        <DocForm initial={editingDoc} saving={savingDoc} onSubmit={saveDoc} t={t} />
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title={confirmTarget?.type === 'folder' ? t('folders.deleteFolderTitle') : t('folders.deleteDocTitle')}
        message={
          confirmTarget?.type === 'folder'
            ? t('folders.deleteFolderMsg', { name: confirmTarget?.item?.name })
            : t('folders.deleteDocMsg', { name: confirmTarget?.item?.name })
        }
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function FolderForm({ initial, saving, onSubmit, t }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('common.required'));
      return;
    }
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="label">{t('common.name')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('folders.namePlaceholder')} />
        {error && <p className="text-xs text-absent mt-1">{error}</p>}
      </div>
      <div className="mb-6">
        <label className="label">{t('common.descriptionOptional')}</label>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}

function DocForm({ initial, saving, onSubmit, t }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('common.required'));
      return;
    }
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="label">{t('common.name')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('folders.docNamePlaceholder')} />
        {error && <p className="text-xs text-absent mt-1">{error}</p>}
      </div>
      <div className="mb-6">
        <label className="label">{t('common.descriptionOptional')}</label>
        <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
