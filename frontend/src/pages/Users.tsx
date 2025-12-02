import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    role_display: string;
    phone: string;
    is_active: boolean;
}

const Users = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'seller',
        phone: '',
        password: '',
    });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await authAPI.get('/users/');
            const usersData = response.data.results || response.data;
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            toast.current?.show({
                severity: 'error',
                summary: t('messages.error'),
                detail: t('users.loadError'),
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await authAPI.put(`/users/${editingUser.id}/`, formData);
                toast.current?.show({
                    severity: 'success',
                    summary: t('messages.success'),
                    detail: t('users.userUpdated'),
                    life: 3000,
                });
            } else {
                await authAPI.post('/users/', formData);
                toast.current?.show({
                    severity: 'success',
                    summary: t('messages.success'),
                    detail: t('users.userCreated'),
                    life: 3000,
                });
            }
            await fetchUsers();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.current?.show({
                severity: 'error',
                summary: t('messages.error'),
                detail: t('users.saveError'),
                life: 3000,
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('users.confirmDelete'))) return;

        try {
            await authAPI.delete(`/users/${id}/`);
            toast.current?.show({
                severity: 'success',
                summary: t('messages.success'),
                detail: t('users.userDeleted'),
                life: 3000,
            });
            await fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.current?.show({
                severity: 'error',
                summary: t('messages.error'),
                detail: t('users.deleteError'),
                life: 3000,
            });
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            phone: user.phone,
            password: '',
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            role: 'seller',
            phone: '',
            password: '',
        });
    };

    const getRoleSeverity = (role: string) => {
        switch (role) {
            case 'admin':
                return 'danger';
            case 'accountant':
                return 'info';
            default:
                return 'success';
        }
    };

    // Template Columns
    const userBodyTemplate = (rowData: User) => {
        return (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {rowData.first_name?.[0]?.toUpperCase() || rowData.username?.[0]?.toUpperCase()}
                </div>
                <div>
                    <div className="font-medium text-slate-900">
                        {rowData.first_name} {rowData.last_name}
                    </div>
                    <div className="text-sm text-slate-500">{rowData.username}</div>
                </div>
            </div>
        );
    };

    const roleBodyTemplate = (rowData: User) => {
        return (
            <Tag value={t(`roles.${rowData.role}`)} severity={getRoleSeverity(rowData.role)} />
        );
    };

    const statusBodyTemplate = (rowData: User) => {
        return (
            <Tag
                value={rowData.is_active ? t('common.active') : t('common.inactive')}
                severity={rowData.is_active ? 'success' : 'danger'}
            />
        );
    };

    const actionsBodyTemplate = (rowData: User) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    onClick={() => openEditModal(rowData)}
                    tooltip={t('buttons.edit')}
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    onClick={() => handleDelete(rowData.id)}
                    disabled={rowData.id === currentUser?.id}
                    tooltip={t('buttons.delete')}
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    const header = (
        <div className="flex justify-between items-center">
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder={t('users.searchPlaceholder')}
                    className="w-80"
                />
            </span>
            <Button
                label={t('users.newUser')}
                icon="pi pi-plus"
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            />
        </div>
    );

    // Check admin access
    if (currentUser?.role !== 'admin') {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-700">{t('messages.accessDenied')}</h2>
                <p className="text-slate-600 mt-2">{t('users.accessDenied')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toast ref={toast} />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('users.title')}</h1>
                <p className="text-slate-600 mt-1">{t('users.subtitle')}</p>
            </div>

            {/* DataTable */}
            <div className="card">
                <DataTable
                    value={users}
                    loading={loading}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    globalFilter={globalFilter}
                    header={header}
                    emptyMessage={t('users.notFound')}
                    className="p-datatable-sm"
                    stripedRows
                >
                    <Column field="username" header={t('form.username')} body={userBodyTemplate} sortable></Column>
                    <Column field="email" header={t('form.email')} sortable></Column>
                    <Column field="role" header={t('form.role')} body={roleBodyTemplate} sortable></Column>
                    <Column field="phone" header={t('form.phone')} body={(rowData) => rowData.phone || '-'}></Column>
                    <Column field="is_active" header={t('form.status')} body={statusBodyTemplate} sortable></Column>
                    <Column header={t('table.actions')} body={actionsBodyTemplate} style={{ width: '120px' }}></Column>
                </DataTable>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">
                            {editingUser ? t('users.editUser') : t('users.newUser')}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.username')}</label>
                                <InputText
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full"
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.email')}</label>
                                <InputText
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.firstName')}</label>
                                    <InputText
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.lastName')}</label>
                                    <InputText
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.role')}</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="seller">{t('roles.seller')}</option>
                                    <option value="accountant">{t('roles.accountant')}</option>
                                    <option value="admin">{t('roles.admin')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.phone')}</label>
                                <InputText
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full"
                                />
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.password')}</label>
                                    <InputText
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full"
                                        required={!editingUser}
                                        minLength={12}
                                        placeholder={t('form.passwordPlaceholder')}
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    label={t('buttons.cancel')}
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                                />
                                <Button
                                    type="submit"
                                    label={editingUser ? t('buttons.save') : t('buttons.create')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
