import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { expensesAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  category: number;
  category_name: string;
  description: string;
  amount: number;
  payment_method: string;
  payment_method_display: string;
  receipt_number: string;
  date: string;
  user_name: string;
}

const Expenses = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    payment_method: 'cash',
    receipt_number: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [search]);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getAll({ search });
      setExpenses(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await expensesAPI.getCategories();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        category: formData.category ? parseInt(formData.category) : null,
        amount: parseFloat(formData.amount),
      };

      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, data);
      } else {
        await expensesAPI.create(data);
      }

      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        category: '',
        description: '',
        amount: '',
        payment_method: 'cash',
        receipt_number: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category?.toString() || '',
      description: expense.description,
      amount: expense.amount.toString(),
      payment_method: expense.payment_method,
      receipt_number: expense.receipt_number || '',
      date: expense.date,
      notes: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('expenses.confirmDelete'))) {
      try {
        await expensesAPI.delete(id);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder={`${t('common.search')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setFormData({
              category: '',
              description: '',
              amount: '',
              payment_method: 'cash',
              receipt_number: '',
              date: new Date().toISOString().split('T')[0],
              notes: '',
            });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + {t('expenses.newExpense')}
        </button>
      </div>

      {/* Summary */}
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">
            💸
          </div>
          <div>
            <p className="text-sm text-red-600">Total de gastos</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('products.category')}</th>
                <th>{t('common.description')}</th>
                <th>{t('expenses.amount')}</th>
                <th>{t('sales.paymentMethod')}</th>
                <th>{t('expenses.receiptNumber')}</th>
                <th>Usuario</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    {t('common.noResults')}
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString('es')}</td>
                    <td>{expense.category_name || '-'}</td>
                    <td className="max-w-xs truncate">{expense.description}</td>
                    <td className="font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td>{expense.payment_method_display}</td>
                    <td className="font-mono text-sm">{expense.receipt_number || '-'}</td>
                    <td>{expense.user_name}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold">
                {editingExpense ? t('expenses.editExpense') : t('expenses.newExpense')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('common.date')} *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('products.category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">{t('common.description')} *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('expenses.amount')} *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('sales.paymentMethod')}</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input"
                  >
                    <option value="cash">{t('sales.cash')}</option>
                    <option value="card">{t('sales.card')}</option>
                    <option value="transfer">{t('sales.transfer')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">{t('expenses.receiptNumber')}</label>
                <input
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;


