import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Users, Plus, Download, Upload, Trash2, X, Edit2, Check } from 'lucide-react';

interface UserModalProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onCreateUser: (name: string, avatar: string, roleDescription: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserName?: (userId: string, newName: string) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

const EMOJI_AVATARS = ['🐱', '😼', '😸', '🙀', '😽', '🦁', '🐅', '🐆'];

export const UserModal: React.FC<UserModalProps> = ({
  currentUser,
  users,
  onSelectUser,
  onCreateUser,
  onDeleteUser,
  onUpdateUserName,
  onExportData,
  onImportData,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🐱');
  const [newRole, setNewRole] = useState('');

  // Inline name editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleStartEdit = (user: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUserId(user.id);
    setEditingNameValue(user.name);
  };

  const handleSaveEdit = (userId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingNameValue.trim() && onUpdateUserName) {
      onUpdateUserName(userId, editingNameValue.trim());
    }
    setEditingUserId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateUser(newName.trim(), newAvatar, newRole.trim() || '專屬股票觀察員');
    setNewName('');
    setNewRole('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-300" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">切換與管理觀察者 (User Profiles)</h3>
              <p className="text-xs text-slate-400">各使用者保有獨立關注的個股觀察庫</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-400 hover:text-slate-100 border border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!isCreating ? (
            <>
              {/* Existing User List */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold">選擇目前使用者：</div>
                {users.map((user) => {
                  const isActive = user.id === currentUser.id;
                  const isEditingThis = editingUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        if (!isEditingThis) {
                          onSelectUser(user);
                          onClose();
                        }
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isActive
                          ? 'bg-zinc-800 border-zinc-600 shadow-xs'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Circular Avatar */}
                        <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                          {user.avatar}
                        </div>

                        <div className="flex-1">
                          {isEditingThis ? (
                            <form
                              onSubmit={(e) => handleSaveEdit(user.id, e)}
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-100 focus:outline-none focus:border-slate-400 w-full"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={(e) => handleSaveEdit(user.id, e)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                                title="儲存名稱"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </form>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-100">{user.name}</span>
                                {isActive && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-zinc-900 font-bold">
                                    使用中
                                  </span>
                                )}
                                <button
                                  onClick={(e) => handleStartEdit(user, e)}
                                  className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                                  title="修改名稱"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-xs text-slate-400">
                                {user.roleDescription} • 追蹤 {user.watchlist.length} 檔
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete button (except if it's the only user) */}
                      {users.length > 1 && !isActive && !isEditingThis && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`確定要刪除使用者「${user.name}」及其觀察庫嗎？`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-2 rounded-xl hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors ml-2"
                          title="刪除此使用者"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create User Button */}
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors border border-zinc-700"
              >
                <Plus className="w-4 h-4" />
                <span>建立新觀察者身分 (例如：貓奴D)</span>
              </button>

              {/* Export / Import Section */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="text-xs text-slate-400 font-bold">資料備份與設定檔匯入匯出：</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onExportData}
                    className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-300" />
                    <span>匯出 JSON 配置</span>
                  </button>

                  <label className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>匯入 JSON 配置</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={onImportData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* Create New User Form */
            <form onSubmit={handleCreateSubmit} className="space-y-4 bg-zinc-950 p-4.5 rounded-2xl border border-zinc-800">
              <div className="text-sm font-bold text-slate-100 mb-2">建立新的觀察者帳號</div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">使用者名稱</label>
                <input
                  type="text"
                  placeholder="例如：貓奴D (短線飆股高手)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-slate-100 focus:border-zinc-600 focus:outline-none"
                  required
                />
              </div>

              {/* Avatar Emoji */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">選擇貓咪圖示</label>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      className={`p-2 rounded-xl text-xl border transition-all ${
                        newAvatar === emoji
                          ? 'bg-zinc-800 border-zinc-500 scale-105'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">關注偏好簡述</label>
                <input
                  type="text"
                  placeholder="例如：專注AI伺服器與AI應用個股"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-slate-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="w-1/2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold rounded-xl text-xs border border-zinc-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-white text-zinc-900 font-bold rounded-xl text-xs shadow-md"
                >
                  確認建立
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
